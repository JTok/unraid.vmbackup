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

    # get a list of all vms by name.
    vm_list=$(virsh list --all --name)

    SAVEIFS=$IFS   # Save current IFS
    IFS=$'\n'      # Change IFS to new line

    for vmname in $vm_list
    do
      # create working xml file.
      virsh dumpxml "$vmname" > "$vm_temp_xml"

      # workaround to replace xmlns value with absolute URI to avoid namespace warning.
      sed -i 's|vmtemplate xmlns="unraid"|vmtemplate xmlns="http://unraid.net/xmlns"|g' "$vm_temp_xml"

      # add vdisk paths to vdisk list variable.
      for vdisk_path in $(xmlstarlet sel -t -m "/domain/devices/disk/source/@file" -v . -n "$vm_temp_xml")
      do
        vdisk_list+=("$vdisk_path")
      done
    done

    IFS=$SAVEIFS   # Restore IFS

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