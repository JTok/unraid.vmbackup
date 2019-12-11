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

    else

      echo "could not find default script and/or user config."
    fi
  }

  # function to create text file lists of vms and their vdisks.
  create_vm_lists() {
    # create local variables.
    local vm_temp_xml="/boot/config/plugins/vmbackup/vm.xml"
    local vm_list_file="/boot/config/plugins/vmbackup/vm-list.txt"
    local vdisk_list_file="/boot/config/plugins/vmbackup/vdisk-list.txt"
    local user_config_file="/boot/config/plugins/vmbackup/user.cfg"

    # get a list of all vms by name.
    vm_list=$(virsh list --all --name)
    
    # disable case matching.
    shopt -s nocasematch

    # parse user config to get extensions to skip, including snapshot extension.
    while IFS='=' read -r name value
    do
      if [ "$name" == "vdisk_extensions_to_skip" ] || [ "$name" == "snapshot_extension" ]; then
        value="${value%\"*}"     # remove opening string quotes.
        value="${value#\"*}"     # remove closing string quotes.
      fi

      # verify extension is not already in the extensions to skip array.
      extension_exists=false
      for extension in "${extensions_to_skip[@]}"
      do
        if [ "$extension" == "$value" ]; then
          extension_exists=true
        fi
      done

      # add extension to extensions to skip array.
      if [ "$extension_exists" = false ]; then
        extensions_to_skip+=("$value")
      fi
    done < $user_config_file

    SAVEIFS=$IFS   # save current IFS.
    IFS=$'\n'      # change IFS to new line.

    for vmname in $vm_list
    do
      # create working xml file.
      virsh dumpxml "$vmname" > "$vm_temp_xml"

      # workaround to replace xmlns value with absolute URI to avoid namespace warning.
      sed -i 's|vmtemplate xmlns="unraid"|vmtemplate xmlns="http://unraid.net/xmlns"|g' "$vm_temp_xml"

      # add vdisk paths to vdisk list variable.
      for vdisk_path in $(xmlstarlet sel -t -m "/domain/devices/disk/source/@file" -v . -n "$vm_temp_xml")
      do
        # get the extension of the disk.
        disk_extension="${vdisk_path##*.}"

        for extension in "${extensions_to_skip[@]}"
        do
          if [ ! "$extension" == "$disk_extension" ]; then
            # add vdisk to array list.
            vdisk_list+=("$vdisk_path")
          fi
        done
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
    printf "%s\n" "${vdisk_list[@]}" > "$vdisk_list_file"
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