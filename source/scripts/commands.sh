#!/bin/bash

# v0.1.1 - Development

# usage: update_user_script


#### start script functions ####

  # function to update user script.
  update_user_script () {
    # create local variables.
    local php_functions_script="/usr/local/emhttp/plugins/vmbackup/include/functions.php"
    local default_script="/usr/local/emhttp/plugins/vmbackup/scripts/default-script.sh"
    local user_script="/boot/config/plugins/vmbackup/user-script.sh"
    local user_config="/boot/config/plugins/vmbackup/user.cfg"

    # verify the default script and the user config files exist.
    if [[ -f "$default_script" ]] && [[ -f "$user_config" ]]; then

      # if the a user script already exists, remove it.
      if [[ -f "$user_script" ]]; then
        rm -f "$user_script"
      fi

      php "$php_functions_script" "update_user_script" "$default_script" "$user_script" "$user_config"

      # update cronjob.
      update_cron_job
    fi
  }

  # function to update cronjob
  update_cron_job () {
    # create local variables.
    local user_script="/boot/config/plugins/vmbackup/user-script.sh"
    local user_config="/boot/config/plugins/vmbackup/user.cfg"
    local cronjob_comment="# Job for VM Backup plugin:"

    # verify user config file exists.
    if [[ -f "$user_config" ]]; then
      # read cron settings from user config file.
      # parse user config to get cron variables and remove any double quotes.
      while IFS='=' read -r name value
      do
        case "$name" in
          "frequency")
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            frequency="$value"
            ;;
          "day")
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            day="$value"
            ;;
          "month")
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            month="$value"
            ;;
          "hour")
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            hour="$value"
            ;;
          "minute")
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            minute="$value"
            ;;
          "custom")
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            custom="$value"
            ;;
        esac
      done < $user_config

      # check value of frequency and build a cronjob from that.
      case "$frequency" in
        "disabled")
          # no schedule set. remove existing cron job and exit function.
          ( crontab -l | grep -v -F "$cronjob_comment" ) | crontab -
          ( crontab -l | grep -v -F "$user_script" ) | crontab -
          return 0
          ;;
        "daily")
          cronjob="$minute $hour "'* * *'
          ;;
        "weekly")
          cronjob="$minute $hour "'* * '"$day"
          ;;
        "monthly")
          cronjob="$minute $hour $month "'* *'
          ;;
        "custom")
          cronjob="$custom"
          ;;
        *)
          # schedule setting is not valid. exiting function.
          return 1
          ;;
      esac

      # append the user script path to the cronjob variable.
      cronjob="$cronjob $user_script > /dev/null 2>&1"

      # prepend comment to cronjob variable.
      cronjob="$cronjob_comment"$'\n'"$cronjob"

      # write cronjob to crontab.
      ( crontab -l | grep -v -F "$cronjob_comment" ) | crontab -
      ( crontab -l | grep -v -F "$user_script" ; echo "$cronjob" ) | crontab -
    fi
  }

  # function to create text file lists of vms and their vdisks.
  create_vm_lists() {
    # create local variables.
    local vm_temp_xml="/boot/config/plugins/vmbackup/vm.xml"
    local vm_list_file="/boot/config/plugins/vmbackup/vm-list.txt"
    local vdisk_list_file="/boot/config/plugins/vmbackup/vdisk-list.txt"
    local user_config="/boot/config/plugins/vmbackup/user.cfg"
    local user_prefix="\/mnt\/user\/domains\/"
    local cache_prefix="/mnt/cache/domains/"
    local disk_prefix="/mnt/disk*/domains/"

    # remove previous temporary working files if they still exist.
    if [[ -f "$vm_temp_xml" ]]; then
      rm -f "$vm_temp_xml"
    fi
    if [[ -f "$vm_list_file" ]]; then
      rm -f "$vm_list_file"
    fi
    if [[ -f "$vdisk_list_file" ]]; then
      rm -f "$vdisk_list_file"
    fi

    # check to see if a user config file has been created yet.
    if [[ ! -f "$user_config" ]]; then
      # if not, give the extensions to skip their default values.
      vdisk_extensions_to_skip+=("iso")
      snapshot_extension+=("snap")
    fi

    SAVEIFS=$IFS   # save current IFS.

    # get a list of all vms by name.
    vm_list=$(virsh list --all --name)

    # disable case matching.
    shopt -s nocasematch

    # parse user config to get extensions to skip, including snapshot extension.
    while IFS='=' read -r name value
    do
      if [ "$name" == "vdisk_extensions_to_skip" ]; then
        value="${value%\"*}"     # remove opening string quotes.
        value="${value#\"*}"     # remove closing string quotes.

        IFS=',' read -r -a vdisk_extensions_to_skip <<< "$value"
      elif [ "$name" == "snapshot_extension" ]; then
        value="${value%\"*}"     # remove opening string quotes.
        value="${value#\"*}"     # remove closing string quotes.
        
        # verify extension is not already in the extensions to skip array.
        extension_exists=false
        for extension in "${vdisk_extensions_to_skip[@]}"
        do
          if [ "$extension" == "$value" ]; then
            extension_exists=true
          fi
        done

        # add extension to extensions to skip array.
        if [ "$extension_exists" = false ]; then
          snapshot_extension+=("$value")
        fi
      fi
    done < $user_config

    extensions_to_skip=("${vdisk_extensions_to_skip[@]}" "${snapshot_extension[@]}")

    IFS=$'\n'      # change IFS to new line.

    # create empty vdisk_list array.
    declare -A vdisk_list

    for vmname in $vm_list
    do
      # create working xml file.
      virsh dumpxml "$vmname" > "$vm_temp_xml"

      # workaround to replace xmlns value with absolute URI to avoid namespace warning.
      sed -i 's|vmtemplate xmlns="unraid"|vmtemplate xmlns="http://unraid.net/xmlns"|g' "$vm_temp_xml"

      # get the vdisk path from the xml file.
      for vdisk_path in $(xmlstarlet sel -t -m "/domain/devices/disk/source/@file" -v . -n "$vm_temp_xml")
      do
        # get the extension of the disk.
        disk_extension="${vdisk_path##*.}"

        # create variable for skipping disk and set to false.
        skip_disk=false

        # make sure the vdisk extension should not be skipped and added it to the list array.
        for extension in "${extensions_to_skip[@]}"
        do
          if [ "$extension" == "$disk_extension" ]; then
            skip_disk=true
          fi
        done

        # if the disk should not be skipped, verify it is not already in the vdisk list.
        if [ "$skip_disk" = false ]; then
          vdisk_exists=false
          for vdisk in "${vdisk_list[@]}"
          do
            if [ "$vdisk" == "$vdisk_path" ]; then
              vdisk_exists=true
            fi
          done

          # add vdisk to array list, but first remove common prefixes.
          if [ "$vdisk_exists" = false ]; then
            case "$vdisk_path" in
              $user_prefix*)
                vdisk_list+=(["$vdisk_path"]="${vdisk_path##$user_prefix}")
                ;;
              $cache_prefix*)
                vdisk_list+=(["$vdisk_path"]="${vdisk_path##$cache_prefix}")
                ;;
              $disk_prefix*)
                vdisk_list+=(["$vdisk_path"]="${vdisk_path##$disk_prefix}")
                ;;
              *)
                vdisk_list+=(["$vdisk_path"]="$vdisk_path")
                ;;
            esac
          fi
        fi
      done
    done

    IFS=$SAVEIFS   # restore original IFS.

    # enable case matching.
    shopt -u nocasematch

    # remove working xml file.
    if [ -f "$vm_temp_xml" ]; then
      rm -fv "$vm_temp_xml"
    fi

    # create vm list text file.
    printf "%s\n" "${vm_list[@]}" > "$vm_list_file"

    # create vm vdisk list text file.
    for key in "${!vdisk_list[@]}"
    do 
      printf "%s\n" "$key=\"${vdisk_list[$key]}\"" >> "$vdisk_list_file"
    done
  }

#### end script functions ####


#### start script execution ####

  case "$1" in
    'update_user_script')
      update_user_script
      ;;
    'create_vm_lists')
      create_vm_lists
      ;;
    *)
     echo "usage $0 update_user_script"
     ;;
  esac

#### end script execution ####