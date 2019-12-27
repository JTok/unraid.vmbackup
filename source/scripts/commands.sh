#!/bin/bash

# usage: update_user_script, create_vm_lists, backup_now, fix_snapshots, abort_script


#### start script functions ####

  # function to update user script.
  update_user_script () {
    # create local variables.
    local php_functions_script="/usr/local/emhttp/plugins/vmbackup/include/functions.php"
    local default_script="/usr/local/emhttp/plugins/vmbackup/scripts/default-script.sh"
    local user_script="/boot/config/plugins/vmbackup/user-script.sh"
    local user_config="/boot/config/plugins/vmbackup/user.cfg"
    local default_fix_snapshots_script="/usr/local/emhttp/plugins/vmbackup/scripts/default-fix-snapshots.sh"
    local user_fix_snapshots_script="/boot/config/plugins/vmbackup/user-fix-snapshots.sh"

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

    # verify the default fix snapshots script and the user config files exist.
    if [[ -f "$default_fix_snapshots_script" ]] && [[ -f "$user_config" ]]; then

      # if the a user fix snapshots script already exists, remove it.
      if [[ -f "$user_fix_snapshots_script" ]]; then
        rm -f "$user_fix_snapshots_script"
      fi

      php "$php_functions_script" "update_user_script" "$default_fix_snapshots_script" "$user_fix_snapshots_script" "$user_config"
    fi
  }

  # function to update cronjob
  update_cron_job () {
    # create local variables.
    local runscript="/usr/local/emhttp/plugins/vmbackup/runscript.php"
    local runscript_argument="run_backup"
    local user_config="/boot/config/plugins/vmbackup/user.cfg"
    local cronjob_comment="# Job for VM Backup plugin:"

    # verify user config file exists.
    if [[ -f "$user_config" ]]; then
      # read cron settings from user config file.
      # parse user config to get cron variables and remove any double quotes.
      readarray -t user_config_array < "$user_config"
      for option in "${user_config_array[@]}"
      do
        key=${option%%=*}
        case "$key" in
          "frequency")
            value=${option#*=}
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            frequency="$value"
            ;;
          "week")
            value=${option#*=}
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            week="$value"
            ;;
          "month")
            value=${option#*=}
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            month="$value"
            ;;
          "hour")
            value=${option#*=}
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            hour="$value"
            ;;
          "minute")
            value=${option#*=}
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            minute="$value"
            ;;
          "custom")
            value=${option#*=}
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            custom="$value"
            ;;
        esac
      done

      # check value of frequency and build a cronjob from that.
      case "$frequency" in
        "disabled")
          # no schedule set. remove existing cron job and exit function.
          ( crontab -l | grep -v -F "$cronjob_comment" ) | crontab -
          ( crontab -l | grep -v -F "$runscript" ) | crontab -
          return 0
          ;;
        "daily")
          cronjob="$minute $hour "'* * *'
          ;;
        "weekly")
          cronjob="$minute $hour "'* * '"$week"
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
      cronjob="$cronjob $runscript $runscript_argument > /dev/null 2>&1"

      # prepend comment to cronjob variable.
      cronjob="$cronjob_comment"$'\n'"$cronjob"

      # write cronjob to crontab.
      ( crontab -l | grep -v -F "$cronjob_comment" ) | crontab -
      ( crontab -l | grep -v -F "$runscript" ; echo "$cronjob" ) | crontab -
    fi
  }

  # function to create text file lists of vms and their vdisks.
  create_vm_lists() {
    # create local variables.
    local vm_list_file="/boot/config/plugins/vmbackup/vm-list.txt"
    local vdisk_list_file="/boot/config/plugins/vmbackup/vdisk-list.txt"
    local vdisk_path_list_file="/boot/config/plugins/vmbackup/vdisk-path-list.txt"
    local user_config="/boot/config/plugins/vmbackup/user.cfg"
    local user_prefix="/mnt/user/domains/"
    local cache_prefix="/mnt/cache/domains/"
    local disk_prefix="/mnt/disk*/domains/"

    SAVEIFS=$IFS   # save current IFS.

    IFS=$'\n'      # change IFS to new line.

    # get a list of all vms by name.
    vm_list=$(virsh list --all --name)

    # sort vm_list alphabetically.
    vm_list=$(echo "$vm_list" | sort -f)

    # check to see if the list text files exist.
    if [[ -f "$vm_list_file" ]] && [[ -f "$vdisk_list_file" ]] && [[ -f "$vdisk_path_list_file" ]]; then

      # read vm_list_file into a variable for comparing it to the vms on the system.
      vm_list_var="$(<$vm_list_file)"

      # read vdisk_path_list_file into a variable for comparing it to the vms on the system.
      readarray -t vdisk_path_list_array < "$vdisk_path_list_file"

      # create an empty array for sorting the vdisk list array.
      tmp_vdisk_list=()

      for vmname in $vm_list
      do
        # create working xml file.
        tmp_xml=$(virsh dumpxml "$vmname")

        # workaround to replace xmlns value with absolute URI to avoid namespace warning.
        tmp_xml=${tmp_xml/"vmtemplate xmlns=\"unraid\""/"vmtemplate xmlns=\"http://unraid.net/xmlns\""}

        # get the vdisk path from the xml file.
        for vdisk_path in $(xmlstarlet sel -t -m "/domain/devices/disk/source/@file" -v . -n <(echo "$tmp_xml"))
        do
          # verify it is not already in the vdisk list.
          vdisk_exists=false
          for vdisk in "${tmp_vdisk_list[@]}"
          do
            if [[ "$vdisk" == "$vdisk_path" ]]; then
              vdisk_exists=true
            fi
          done

          # if the vdisk is not already in the tmp vdisk list, add it.
          if [ "$vdisk_exists" = false ]; then
            if [ "${#tmp_vdisk_list[@]}" -eq 0 ]; then
              tmp_vdisk_list=("$vdisk_path")
            else
              tmp_vdisk_list+=("$vdisk_path")
            fi
          fi
        done
      done

      # if the vms and vdisks have not changed, then exit the function.
      if [ "$vm_list_var" == "$vm_list" ] && [ "${vdisk_path_list_array[*]}" == "${tmp_vdisk_list[*]}" ]; then
        IFS=$SAVEIFS   # restore original IFS.
        return 0
      fi
    fi

    # remove previous temporary working files if they still exist.
    if [[ -f "$vm_list_file" ]]; then
      rm -f "$vm_list_file"
    fi
    if [[ -f "$vdisk_list_file" ]]; then
      rm -f "$vdisk_list_file"
    fi
    if [[ -f "$vdisk_path_list_file" ]]; then
      rm -f "$vdisk_path_list_file"
    fi

    # disable case matching.
    shopt -s nocasematch

    # check to see if a user config file has been created yet.
    if [[ ! -f "$user_config" ]]; then
      # if not, give the extensions to skip their default values.
      vdisk_extensions_to_skip+=("iso")
      snapshot_extension+=("snap")
    else
      # parse user config to get extensions to skip, including snapshot extension.
      readarray -t user_config_array < "$user_config"
      for line in "${user_config_array[@]}"
      do
        key=${line%%=*}
        case "$key" in
          "vdisk_extensions_to_skip")
            value=${line#*=}
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.
            IFS=',' read -r -a vdisk_extensions_to_skip <<< "$value"
            ;;
          "snapshot_extension")
            value=${line#*=}
            value="${value%\"*}"     # remove opening string quotes.
            value="${value#\"*}"     # remove closing string quotes.

            # verify extension is not already in the extensions to skip array.
            extension_exists=false
            for extension in "${vdisk_extensions_to_skip[@]}"
            do
              if [[ "$extension" == "$value" ]]; then
                extension_exists=true
              fi
            done

            # add extension to extensions to skip array.
            if [ "$extension_exists" = false ]; then
              snapshot_extension+=("$value")
            fi
            ;;
        esac
      done
    fi

    extensions_to_skip=("${vdisk_extensions_to_skip[@]}" "${snapshot_extension[@]}")

    # create empty vdisk_list array.
    declare -A vdisk_list

    # create an empty array for sorting the vdisk list array.
    vdisk_list_sort=()

    for vmname in $vm_list
    do
      # create working xml file.
      tmp_xml=$(virsh dumpxml "$vmname")

      # workaround to replace xmlns value with absolute URI to avoid namespace warning.
      tmp_xml=${tmp_xml/"vmtemplate xmlns=\"unraid\""/"vmtemplate xmlns=\"http://unraid.net/xmlns\""}

      # get the vdisk path from the xml file.
      for vdisk_path in $(xmlstarlet sel -t -m "/domain/devices/disk/source/@file" -v . -n <(echo "$tmp_xml"))
      do
        # get the extension of the disk.
        disk_extension="${vdisk_path##*.}"

        # create variable for skipping disk and set to false.
        skip_disk=false

        # make sure the vdisk extension should not be skipped and added it to the list array.
        for extension in "${extensions_to_skip[@]}"
        do
          if [[ "$extension" == "$disk_extension" ]]; then
            skip_disk=true
          fi
        done

        # if the disk should not be skipped, verify it is not already in the vdisk list.
        if [ "$skip_disk" = false ]; then
          vdisk_exists=false
          for vdisk in "${vdisk_list[@]}"
          do
            if [[ "$vdisk" == "$vdisk_path" ]]; then
              vdisk_exists=true
            fi
          done

          # if the vdisk is not already in the vdisk list array, add it to both arrays.
          if [ "$vdisk_exists" = false ]; then
            # add vdisk path to an array to use for sorting.
            vdisk_list_sort+=("$vdisk_path")
            # remove common prefixes and add to the vdisk list array.
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

        # verify path is not already in the tmp vdisk list.
        tmp_vdisk_exists=false
        for vdisk in "${tmp_vdisk_list[@]}"
        do
          if [[ "$vdisk" == "$vdisk_path" ]]; then
            tmp_vdisk_exists=true
          fi
        done

        # if the vdisk is not already in the tmp vdisk list, add it.
        if [ "$tmp_vdisk_exists" = false ]; then
          if [ "${#tmp_vdisk_list[@]}" -eq 0 ]; then
            tmp_vdisk_list=("$vdisk_path")
          else
            tmp_vdisk_list+=("$vdisk_path")
          fi
        fi
      done
    done

    IFS=$SAVEIFS   # restore original IFS.

    # enable case matching.
    shopt -u nocasematch

    # create vm list text file.
    printf "%s\n" "${vm_list[@]}" > "$vm_list_file"

    # create vm vdisk list text file.
    for key in "${vdisk_list_sort[@]}"
    do 
      printf "%s\n" "$key=\"${vdisk_list[$key]}\"" >> "$vdisk_list_file"
    done

    # create vdisk paths list text file.
    printf "%s\n" "${tmp_vdisk_list[@]}" > "$vdisk_path_list_file"
  }

  function backup_now() {
    # create local variables.
    local runscript="/usr/local/emhttp/plugins/vmbackup/runscript.php"
    local argument1="run_backup"

    "$runscript" "$argument1" | at NOW -M > /dev/null 2>&1
  }

  function fix_snapshots() {
    # create local variables.
    local runscript="/usr/local/emhttp/plugins/vmbackup/runscript.php"
    local argument1="fix_snapshots"

    "$runscript" "$argument1" | at NOW -M > /dev/null 2>&1
  }

  function abort_script() {
    # create local variables.
    local runscript="/usr/local/emhttp/plugins/vmbackup/runscript.php"
    local argument1="abort_script"

    "$runscript" "$argument1" | at NOW -M > /dev/null 2>&1
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
    'backup_now')
      backup_now
      ;;
    'fix_snapshots')
      fix_snapshots
      ;;
    'abort_script')
      abort_script
      ;;
    *)
     echo "usage $0 update_user_script, create_vm_lists, backup_now, fix_snapshots, abort_script"
     ;;
  esac

#### end script execution ####