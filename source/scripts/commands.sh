#!/bin/bash

# v0.1.0 - Development

# usage: update_user_script


#### start script variables ####

  # update user script
  update_user_script () {
    # create local variables.
    local php_functions_script="/usr/local/emhttp/plugins/vmbackup/functions.php"
    local default_script="/usr/local/emhttp/plugins/vmbackup/default-script.sh"
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

#### end script variables ####


#### start script execution ####

  case "$1" in
    'update_user_script')
      update_user_script
      ;;
    *)
     echo "usage $0 update_user_script"
     ;;
  esac

#### end script execution ####