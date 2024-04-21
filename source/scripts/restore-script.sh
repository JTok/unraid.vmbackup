#!/bin/bash
#backgroundOnly=true
#arrayStarted=no_config
#noParity=no_config
#version=v0.1.0 - 2022/12/25

#### DISCLAIMER ####
# Use at your own risk. This is a work-in-progress and provided as is.
# I have tested this on my own server, as best as I am able, but YMMV.
# -jtok


# this script restores unRAID vm's vdisks and their configurations if they have been backedup using the vmbackup plugin.


################################################## script variables start ######################################################

# location of backed up vm. this is the folder that the vm was backed up to and is usually the same name as the vm.
vm_backup_location="no_config"

# name of vm to restore. this must match the name of the vm as specified by the xml file.
vm_name="no_config"

# timestamp of vm backup to restore. this is the timestamp of the backup to restore from and should be a prefix to the file name of the backup.
vm_backup_timestamp="no_config"

# default is 0. restore vdisk only. set this to 1 to restore only the vdisk on top of an existing vm. set to 0 to remove and restore all vm files.
restore_vdisks_only="no_config"

# default is 1. enable logging. set this to 1 to enable logging. set to 0 to disable logging. logging will automatically be written to a folder called restore-logs in the same location as the vm backup source.
logging_enabled="no_config"

# default is 0. set to 1 to receive more detailed notifications.
detailed_notifications="no_config"

# default is 0. set to 1 to have reconstruct write (a.k.a. turbo write) enabled during the restore and then disabled after the resotre completes.
# NOTE: may break auto functionality when it is implemented. do not use if reconstruct write is already enabled. restores may run faster with this enabled.
enable_reconstruct_write="no_config"

# default is 1. set this to 0 if you would like to abort instead of killing a vm. if using this, it is recommended to shut down the vm in advance.
kill_vm="no_config"


################################################## script variables end #########################################################


###################################################### script start #############################################################

#### define functions start ####

  # copy files based on passed arguments.
  copy_file () {
    # assign arguments to local variables for readability.
    local _source="$1"
    local _destination="$2"
    local _sync_type="$3"

    # determine the copy command that should be ran and capture the result.
    case "$_sync_type" in
      "standard")
        # perform standard rsync.
        rsync -av "$_source" "$_destination"
        local copy_result="$?"
        ;;

      "sparse")
        # perform rsync or copy with support for sparse files.
        rsync -av --sparse "$_source" "$_destination"
        local copy_result="$?"
        ;;

      "inplace")
        # perform inplace copy (i.e. delta sync).
        rsync -av --inplace --no-whole-file "$_source" "$_destination"
        ;;

      "mkpath")
        # make any needed directories when copying files.
        rsync -av --mkpath "$_source" "$_destination"
        ;;

      *)
        # no valid copy choice was able to be ran.
        log_message "failure: no valid copy choice was able to run for copy of $_source to $_destination failed." "copy failed" "alert"

        # exit the function
        return 1
        ;;
    esac

    # get rsync result and send notification
    if [[ "$copy_result" -eq 1 ]]; then
      log_message "failure: copy of $_source to $_destination failed." "copy failed" "alert"
    else
      log_message "information: copy of $_source to $_destination complete." "completed copy" "normal"
    fi
  }

  # create a directory if it does not exist.
  create_directory () {
    # assign arguments to local variables for readability.
    local _directory="$1"

    # see if a file was passed instead of a directory. if so, remove the file name and use the directory.
    if [ -f "$_directory" ]; then
      _directory="$(dirname "$_directory")"
    fi

    # check to see if the folder exists.
    if [ ! -d "$_directory" ]; then
      # create the folder.
      mkdir -p "$_directory"
      local create_result="$?"

      # check to see if the folder was created.
      if [ "$create_result" -eq 1 ]; then
        log_message "failure: creation of folder $_directory failed." "folder creation failed" "alert"
      else
        log_message "information: creation of folder $_directory complete."
      fi
    fi

    # verify that the directory was successfully created. return failure.
    if [ ! -d "$_directory" ]; then
      log_message "failure: folder $_directory does not exist." "script failed" "alert"
      return 1
    else
      return 0
    fi
  }

  # pass log messages to log files and system notifications.
  log_message () {

    # assign arguments to local variables for readability.
    local _message="$1"
    local _description="$2"
    local _importance="$3"

    case "$_importance" in
      "information")
        local _is_error="0"
        ;;
      "alert")
        local _is_error="1"
        ;;
      "warning")
        local _is_error="1"
        ;;
      *)
        local _is_error="0"
        ;;
      esac

    if [ "$_description" ] && [ "$_importance" ]; then
      local _enable_detailed_notifications="1"
    else
      local _enable_detailed_notifications="0"
    fi

    # if logging is enabled, add the message to the main log file.
    if [ "$logging_enabled" -eq 1 ]; then
      echo "$(date '+%Y-%m-%d %H:%M:%S') $_message" | tee -a "$vm_backup_location/$log_file_subfolder$timestamp""unraid-vmbackup-restore.log"
    fi

    # check to see if the message is an error message.
    if [ "$_is_error" -eq 1 ]; then
      # send a notification.
      /usr/local/emhttp/plugins/dynamix/scripts/notify -s "unRAID VM Backup script" -d "$_description" -i "$_importance" -m "$(date '+%Y-%m-%d %H:%M:%S') $_message"
    fi

    # send a detailed notification if it is enabled and if they should be used.
    if [ "$_enable_detailed_notifications" -eq 1 ] && [ "$detailed_notifications" -eq 1 ]; then
      /usr/local/emhttp/plugins/dynamix/scripts/notify -s "unRAID VM Backup script" -d "$_description" -i "$_importance" -m "$(date '+%Y-%m-%d %H:%M:%S') $_message"
    fi
  }

  # pass notification messages to system notifications.
  notification_message () {

    # assign arguments to local variables for readability.
    local _message="$1"
    local _description="$2"
    local _importance="$3"

    # show the message in the log.
    echo "$(date '+%Y-%m-%d %H:%M:%S') $_message"

    # send message notification.
    if [[ -n "$_description" ]] && [[ -n "$_importance" ]]; then
      /usr/local/emhttp/plugins/dynamix/scripts/notify -s "unRAID VM Backup script" -d "$_description" -i "$_importance" -m "$(date '+%Y-%m-%d %H:%M:%S') $_message"
    fi
  }

  # prepare vm for backup.
  prepare_vm () {

    # assign arguments to local variables for readability.
    local _vm="$1"

    # get the vm state.
    local _vm_state
    _vm_state=$(virsh domstate "$_vm")

    # check to see if the vm is shut off.
    if [ "$_vm_state" == "shut off" ]; then
      # set a flag to check later to indicate whether to backup this vm or not.
      can_restore_vm="1"
      log_message "information: $_vm is $_vm_state. vm desired state is shut off. can_restore_vm set to $can_restore_vm."

    # if the vm is not shut off, try to kill it.
    else
      log_message "information: $_vm is $_vm_state. vm desired state is shut off."

      if [ "$kill_vm" -eq 1 ]; then
        log_message "information: attempting to kill $_vm."
        # destroy vm, based on testing this should be instant and without failure.
        virsh destroy "$_vm"

        # but we are going to wait for 5 seconds anyway just to be safe
        sleep 5

        # get the state of the vm.
        _vm_state=$(virsh domstate "$_vm")

        # if the vm is shut off then proceed or give up.
        if [ "$_vm_state" == "shut off" ]; then
          # set a flag to check later to indicate whether to backup this vm or not.
          can_restore_vm="1"
          log_message "information: $_vm is $_vm_state. vm desired state is shut off. can_restore_vm set to $can_restore_vm ."
        else
          # set a flag to check later to indicate whether to backup this vm or not.
          can_restore_vm="0"
          log_message "failure: $_vm is $_vm_state. vm desired state is shut off. can_restore_vm set to $can_restore_vm ." "$_vm restore failed" "alert"
          exit 1
        fi
      fi
    fi
  }

#### define functions end ####


#### validate user variables start ####

  # check if vm_backup_location is set
  if [ "$vm_backup_location" == "no_config" ]; then
    notification_message "failure: vm_backup_location is not set. exiting." "script failed" "alert"
    exit 1
  fi

  # remove the trailing slash from backup_location if it exists.
  vm_backup_location=${vm_backup_location%/}

  # check to see if the vm_backup_location specified by the user exists. if yes, continue if no, exit. if exists check if readable, if yes continue, if not exit. if input invalid, exit.
  if [[ -d "$vm_backup_location" ]]; then
    notification_message "information: vm_backup_location is $vm_backup_location. this location exists. continuing."

  # if vm_backup_location does exist check to see if the vm_backup_location is readable.
  if [[ -r "$vm_backup_location" ]]; then
      notification_message "information: vm_backup_location is $vm_backup_location. this location is readable. continuing."
    else
      notification_message "failure: vm_backup_location is $vm_backup_location. this location is not readable. exiting." "script failed" "alert"
      exit 1
    fi
  else
    notification_message "failure: vm_backup_location is $vm_backup_location. this location does not exist. exiting." "script failed" "alert"
    exit 1
  fi

  # check if vm_name is set
  if [ "$vm_name" == "no_config" ]; then
    notification_message "failure: vm_name is not set. exiting." "script failed" "alert"
    exit 1
  fi

  # check if vm_backup_timestamp is set
  if [ "$vm_backup_timestamp" == "no_config" ]; then
    notification_message "failure: vm_backup_timestamp is not set. exiting." "script failed" "alert"
    exit 1
  fi

  # check if restore_vdisks_only is set
  if [ "$restore_vdisks_only" == "no_config" ]; then
    notification_message "failure: restore_vdisks_only is not set. exiting." "script failed" "alert"
    exit 1
  fi

  # check to see if only the vdisks should be restored. if yes, continue. if no, continue. if input invalid, exit.
  if [[ "$restore_vdisks_only" =~ ^(0|1)$ ]]; then
    if [ "$restore_vdisks_only" -eq 0 ]; then
      notification_message "information: restore_vdisks_only is $restore_vdisks_only. all vm files will be restored."
    elif  [ "$restore_vdisks_only" -eq 1 ]; then
      notification_message "information: restore_vdisks_only is $restore_vdisks_only. only vdisk files will be restored."
    fi
  else
    notification_message "failure: restore_vdisks_only is $restore_vdisks_only. this is not a valid format. expecting [0 = no] or [1 = yes]. exiting." "script failed" "alert"
    exit 1
  fi

  # check to see if logging is enabled. if yes, continue. if no, continue. if input invalid, exit.
  if [[ "$logging_enabled" =~ ^(0|1)$ ]]; then
    if [ "$logging_enabled" -eq 0 ]; then
      notification_message "information: logging_enabled is $logging_enabled. logs will not be created."
    elif  [ "$restore_vdisks_only" -eq 1 ]; then
      notification_message "information: logging_enabled is $logging_enabled. logs will be created in the source vm backup folder."
    fi
  else
    notification_message "failure: logging_enabled is $logging_enabled. this is not a valid format. expecting [0 = no] or [1 = yes]. exiting." "script failed" "alert"
    exit 1
  fi

  # set up logging to the backup source folder.
  # if logging is enabled, verify vm_backup_location is writeable.
  if [ "$logging_enabled" -eq 1 ]; then
    # check to see if the vm_backup_location specified by the user is writeable. if yes, continue if no, exit. if input invalid, exit.
    if [[ -w "$vm_backup_location" ]]; then
        notification_message "information: vm_backup_location is $vm_backup_location. this location is writable. continuing."
      else
        notification_message "warning: vm_backup_location is $vm_backup_location. this location is not writable. log will not be written." "cannot write log file" "warning"
        logging_enabled=0
    fi
  fi

  # if logging is still enabled, create the log file subfolder and verify it is writeable.
  if [ "$logging_enabled" -eq 1 ]; then
    # set the log file subfolder.
    log_file_subfolder="restore-logs/"

    # create the log file subfolder for storing log files.
    if [ ! -d "$vm_backup_location/$log_file_subfolder" ] ; then
      notification_message "information: $vm_backup_location/$log_file_subfolder does not exist. creating it."

      # make the directory as it doesn't exist. added -v option to give a confirmation message to command line.
      mkdir -vp "$vm_backup_location/$log_file_subfolder"
    else
      notification_message "information: $vm_backup_location/$log_file_subfolder exists. continuing."
    fi

    # check to see if the log_file_subfolder exists. if yes, continue. if no, throw an warning. if exists check, if writable, if yes continue, if not exit. if input invalid, exit.
    if [[ -d "$vm_backup_location/$log_file_subfolder" ]]; then
      notification_message "information: log_file_subfolder is $vm_backup_location/$log_file_subfolder. this location exists. continuing."

      # if log_file_subfolder does exist check to see if the log_file_subfolder is writable.
      if [[ -w "$vm_backup_location/$log_file_subfolder" ]]; then
        notification_message "information: log_file_subfolder is $vm_backup_location/$log_file_subfolder. this location is writable. continuing."
      else
        notification_message "warning: log_file_subfolder is $vm_backup_location/$log_file_subfolder. this location is not writable. log will not be written." "cannot write log file" "warning"
        logging_enabled=0
      fi
    else
      notification_message "warning: log_file_subfolder is $vm_backup_location/$log_file_subfolder. this location does not exist. log will not be written." "cannot write log file" "warning"
      logging_enabled=0
    fi
  fi


  ### Logging Started ###
  # create timestamp variable for log file.
  timestamp="$(date '+%Y%m%d_%H%M')""_"

  log_message "Start logging to log file."

  #### logging and notifications ####

  # check to see if detailed notifications should be sent. if yes, continue. if no, continue. if input invalid, exit.
  if [[ "$enable_detailed_notifications" =~ ^(0|1)$ ]]; then
    if [ "$enable_detailed_notifications" -eq 0 ]; then
      log_message "information: enable_detailed_notifications is $enable_detailed_notifications. detailed notifications will not be sent."
    elif  [ "$enable_detailed_notifications" -eq 1 ]; then
      log_message "information: enable_detailed_notifications is $enable_detailed_notifications. detailed notifications will be sent."
    fi
  else
    log_message "failure: enable_detailed_notifications is $enable_detailed_notifications. this is not a valid format. expecting [0 = no] or [1 = yes]. exiting." "script failed" "alert"
    exit 1
  fi

  # notify user that script has started.
  notification_message "information: unRAID VM Backup Restore script is starting. Look for finished message." "restore script starting" "normal"

  # check to see how many times vm's state should be checked for shutdown. messages to user only. if input invalid, exit.
  if [[ "$clean_shutdown_checks" =~ ^[0-9]+$ ]]; then
    if [ "$clean_shutdown_checks" -lt 5 ]; then
      log_message "warning: clean_shutdown_checks is $clean_shutdown_checks. this is potentially an insufficient number of shutdown checks."
    elif [ "$clean_shutdown_checks" -gt 50 ]; then
      log_message "warning: clean_shutdown_checks is $clean_shutdown_checks. this is a vast number of shutdown checks."
    elif [ "$clean_shutdown_checks" -ge 5 ] && [ "$clean_shutdown_checks" -le 50 ]; then
      log_message "information: clean_shutdown_checks is $clean_shutdown_checks. this is probably a sufficient number of shutdown checks."
    fi
  else
    log_message "failure: clean_shutdown_checks is $clean_shutdown_checks. this is not a valid format. expecting a number between [0 - 1000000]. exiting." "script failed" "alert"
    exit 1
  fi


  # check to see how many seconds to wait between vm shutdown checks. messages to user only. if input invalid, exit.
  if [[ "$seconds_to_wait" =~ ^[0-9]+$ ]]; then
    if [ "$seconds_to_wait" -lt 30 ]; then
      log_message "warning: seconds_to_wait is $seconds_to_wait. this is potentially an insufficient number of seconds to wait between shutdown checks."
    elif [ "$seconds_to_wait" -gt 600 ]; then
      log_message "warning: seconds_to_wait is $seconds_to_wait. this is a vast number of seconds to wait between shutdown checks."
    elif [ "$seconds_to_wait" -ge 30 ] && [ "$seconds_to_wait" -le 600 ]; then
      log_message "information: seconds_to_wait is $seconds_to_wait. this is probably a sufficient number of seconds to wait between shutdown checks."
    fi
  else
    log_message "failure: seconds_to_wait is $seconds_to_wait. this is not a valid format. expecting a number between [0 - 1000000]. exiting." "script failed" "alert"
    exit 1
  fi

    # check to see if vm should be killed if clean shutdown fails. if yes, continue. if no, continue. if input invalid, exit.
  if [[ "$kill_vm_if_cant_shutdown" =~ ^(0|1)$ ]]; then
    if [ "$kill_vm_if_cant_shutdown" -eq 0 ]; then
      log_message "information: kill_vm_if_cant_shutdown is $kill_vm_if_cant_shutdown. vms will not be forced to shutdown if a clean shutdown can not be detected."
    elif [ "$kill_vm_if_cant_shutdown" -eq 1 ]; then
      log_message "information: kill_vm_if_cant_shutdown is $kill_vm_if_cant_shutdown. vms will be forced to shutdown if a clean shutdown can not be detected."
    fi
  else
    log_message "failure: kill_vm_if_cant_shutdown is $kill_vm_if_cant_shutdown. this is not a valid format. expecting [0 = no] or [1 = yes]. exiting." "script failed" "alert"
    exit 1

  fi

  # check to see if reconstruct write should be enabled during backup. if yes, continue. if no, continue. if input invalid, exit.
  if [[ "$enable_reconstruct_write" =~ ^(0|1)$ ]]; then
    if [ "$enable_reconstruct_write" -eq 0 ]; then
      log_message "information: enable_reconstruct_write is $enable_reconstruct_write. reconstruct write will not be enabled by this script."
    elif [ "$enable_reconstruct_write" -eq 1 ]; then
      log_message "information: enable_reconstruct_write is $enable_reconstruct_write. reconstruct write will be enabled during the backup."
    fi
  else
    log_message "failure: enable_reconstruct_write is $enable_reconstruct_write. this is not a valid format. expecting [0 = no] or [1 = yes]. exiting." "script failed" "alert"
    exit 1
  fi


#### validate user variables end ####


#### code execution start ####

  # set this to force the for loops to split on new lines and not spaces.
  IFS=$'\n'

  # check to see if reconstruct write should be enabled by this script. if so, enable and continue.
  if [ "$enable_reconstruct_write" -eq 1 ]; then

    /usr/local/sbin/mdcmd set md_write_method 1
    log_message "information: Reconstruct write enabled."

  fi

  # find the xml file for the vm to restore.
  xml_backup_full_path="$(find "$vm_backup_location" -type f -name $vm_backup_timestamp'*.xml')"

  # verify that exactly 1 xml file was found. otherwise abort the script.
  if [ "$(echo "$xml_backup_full_path" | wc -l)" -eq 0 ]; then
    log_message "failure: no xml files were found for the vm to restore. this is not expected. exiting." "script failed" "alert"
    exit 1
  elif [ "$(echo "$xml_backup_full_path" | wc -l)" -gt 1 ]; then
    log_message "failure: multiple xml files were found for the vm to restore. this is not expected. exiting." "script failed" "alert"
    exit 1
  fi

  # see if the user specified vm name is the same as the xml file name by removing the timestamp and the extension. if not, throw a warning.
  xml_backup_file_vm_name="$(basename "$xml_backup_full_path")"
  xml_backup_file_vm_name="${xml_backup_file_vm_name#"$vm_backup_timestamp"}"
  xml_backup_file_vm_name="${xml_backup_file_vm_name%.xml}"
  if [ "$xml_backup_file_vm_name" != "$vm_name" ]; then
    log_message "warning: the xml file name is $xml_backup_file_vm_name, which is not the same as $vm_name which is the vm name. this is not expected. continuing anyway." "xml file name does not match user specified vm name" "warning"
  fi

  # see if the vm name in the xml file is the same as the vm name specified by the user. if not, abort script.
  xml_vm_name=$(xmllint --xpath "string(/domain/name)" "$xml_backup_full_path")
  if [ "$xml_vm_name" != "$vm_name" ]; then
    log_message "failure: the vm name in the xml file is $xml_vm_name, which is not the same as $vm_name, which was specified by the user. this is not expected. exiting script." "script failed" "alert"
    exit 1
  fi

  # begin the restore process.
  # assume vm does not already exist.
  vm_exists="0"

  # assume vm cannot be restored.
  can_restore_vm="0"

  # get a list of all vm names.
  vm_list=$(virsh list --all --name)

  # check to see if the vm we are trying to restore is in the list of all vms.
  for vm in $vm_list
  do
    if [ "$vm" == "$vm_name" ]; then
      log_message "information: the vm to restore $vm already exists. ensuring it is shut off."
      vm_exists="1"
      # make sure the VM to restore isn't running. if it is, stop it.
      prepare_vm "$vm_name"
    fi
  done

  # if the vm to restore doesn't exist, ensure that that restore_vdisks_only is disabled.
  if [ "$vm_exists" -eq 0 ]; then
    if [ "$restore_vdisks_only" -eq 1 ]; then
      log_message "failure: the vm to restore does not exist. restoring vdisks only won't work. exiting." "script failed" "alert"
      exit 1
    elif [ "$restore_vdisks_only" -eq 0 ]; then
      log_message "information: the vm to restore does not already exist. continuing."
      can_restore_vm="1"
    fi
  fi

  # double-check that the vm has been determined to be restorable. if not, exit.
  if [ "$can_restore_vm" -eq 0 ]; then
    log_message "failure: the vm to restore cannot be restored. unable to determine why. exiting." "script failed" "alert"
    exit 1
  fi

  # begin restoring vdisks.
  # get number of vdisks assoicated with the vm.
  vdisk_restore_count=$(xmllint --xpath "count(/domain/devices/disk/source/@file)" "$xml_backup_full_path")

  # unset array for vdisks.
  unset vdisks_restore_paths
  # initialize vdisks as empty array
  vdisks_restore_paths=()

  # get vdisk paths from config file.
  for (( i=1; i<=vdisk_restore_count; i++ ))
  do
    vdisk_restore_path="$(xmllint --xpath "string(/domain/devices/disk[$i]/source/@file)" "$xml_backup_full_path")"
    vdisks_restore_paths+=("$vdisk_restore_path")
  done

  # if restore vdisks only is disabled, restore the nvram and config files.
  if [ "$restore_vdisks_only" -eq 0 ]; then
    # begin restoring nvram file.
    # assume nvram cannot be restored.
    can_restore_nvram="0"

    # get nvram path from config file.
    nvram_restore_full_path=$(xmllint --xpath "string(/domain/os/nvram)" "$xml_backup_full_path")
    # get nvram directory path.
    nvram_restore_dir_path="$(dirname "$nvram_restore_full_path")"
    # get nvram file name.
    nvram_restore_file_name="$(basename "$nvram_restore_full_path")"

    # make sure that the restore directory exists, if not, create it.
    create_directory "$nvram_restore_dir_path"

    # find the nvram file for the vm to restore.
    nvram_backup_full_path="$(find "$vm_backup_location" -type f -name "$vm_backup_timestamp$nvram_restore_file_name")"

    # verify that exactly 1 nvmram file was found. otherwise throw an error.
    if [ "$(echo "$nvram_backup_full_path" | wc -l)" -eq 0 ]; then
      log_message "warning: no nvram files were found for the vm to restore. this is not expected. continuing anyway." "no nvram files found to restore" "alert"
      can_restore_nvram="0"
    elif [ "$(echo "$nvram_backup_full_path" | wc -l)" -gt 1 ]; then
      log_message "warning: multiple nvram files were found for the vm to restore. this is not expected. skipping." "multiple nvram files found to restore" "alert"
      can_restore_nvram="0"
    fi

    # verify that the nvram file to restore exits. if not, throw an error.
    if [ -f "$nvram_backup_full_path" ]; then
      can_restore_nvram="1"
    else
      log_message "warning: the nvram file to restore does not exist. continuing anyway." "nvram file to restore does not exist" "alert"
      can_restore_nvram="0"
    fi

    if [ "$can_restore_nvram" -eq 1 ]; then
      # restore the nvmram file from the backup.
      log_message "information: restoring nvram file from $nvram_backup_full_path to $nvram_restore_full_path."

      copy_file "$nvram_backup_full_path" "$nvram_restore_full_path" "standard"

      # set permissions on the restored nvram file.
      chmod 666 "$nvram_restore_full_path"
      chown root:users "$nvram_restore_full_path"
    fi

    # begin restoring xml config file.
    # assume xml config cannot be restored.
    can_restore_xml="0"

    # get xml name from config file's vm name.
    xml_restore_full_path="/etc/libvirt/qemu/$xml_vm_name.xml"
    # get xml directory path.
    xml_restore_dir_path="$(dirname "$xml_restore_full_path")"

    # make sure that the restore directory exists, if not, create it.
    create_directory "$xml_restore_dir_path"

    # since we already found xml_backup_full_path, there is no need to find it again.

    # verify that the xml file to restore exits. if not, throw an error.
    if [ -f "$xml_backup_full_path" ]; then
      can_restore_xml="1"
    else
      log_message "warning: the xml config file to restore does not exist. continuing anyway." "xml config file to restore does not exist" "alert"
      can_restore_xml="0"
    fi

    if [ "$can_restore_xml" -eq 1 ]; then
      # restore the nvmram file from the backup.
      log_message "information: restoring xml config file from $xml_backup_full_path to $xml_restore_full_path."

      copy_file "$xml_backup_full_path" "$xml_restore_full_path" "standard"

      # set permissions on the restored xml config file.
      chmod 600 "$xml_restore_full_path"
      chown root:root "$xml_restore_full_path"
    fi
  fi












    # check to see if reconstruct write was enabled by this script. if so, disable and continue.
  if [ "$enable_reconstruct_write" -eq 1 ]; then

    /usr/local/sbin/mdcmd set md_write_method 0
    log_message "information: Reconstruct write disabled."

  fi

#### code execution end ####