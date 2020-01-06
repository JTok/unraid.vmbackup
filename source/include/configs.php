<?php

  /* vmbackup plugin
    copyright 2019 JTok */

  require_once '/usr/local/emhttp/plugins/vmbackup/include/functions.php';
  require_once '/usr/local/emhttp/plugins/vmbackup/include/sanitization.php';
  require_once '/usr/local/emhttp/plugins/vmbackup/include/validation.php';

  // create local variables.
  // plugin name.
  $plugin = 'vmbackup';
  // default files.
  $plugin_source_path = '/usr/local/emhttp/plugins/' . $plugin;
  $script_path = $plugin_source_path . '/scripts';
  $default_script_file = $script_path . '/default-script.sh';
  $default_conf_file = $plugin_source_path . '/default.cfg';
  // user files.
  $plugin_path = '/boot/config/plugins/' . $plugin;
  $plugin_config_path = $plugin_path . '/configs';


  // check for post commands.
  // if post is add config, then add the new config.
  if (isset($_POST['#add_config_button']) && (isset($_POST['add_config']))) {
    // check that the root folder we want to write to exists and is writeable.
    if (!verify_dir($plugin_config_path)) {
      syslog(LOG_INFO, "Could not verify $plugin_config_path. Cannot create new config.");
      exit;
    }
    // get the config name and path.
    $new_config_name = $_POST['add_config'];
    $new_config_path = $plugin_config_path . '/' . $new_config_name;
    // make sure the config name isn't empty.
    if (empty($new_config_name)) {
      syslog(LOG_INFO, "New config name was empty. Cannot create new config.");
      exit;
    }
    // make sure the path doesn't already exist.
    if (file_exists($new_config_path)) {
      syslog(LOG_ALERT, "$new_config_name config already exists. Cannot create config.");
      exit;
    }

    // create the directory for the new config.
    mkdir($new_config_path, 0755, true);
    // create local variables for new config files.
    $new_config_script_file = $new_config_path . '/user-script.sh';
    $new_config_conf_file = $new_config_path . '/user.cfg';

    // create the new config based off the defaults.
    if (!copy($default_conf_file, $new_config_conf_file)) {
      syslog(LOG_ALERT, "failed to create user config file for $new_config_name.");
    }

    // create the new script based off the new config file.
    // create a variable with the default script contents and new user config file merged.
    $script_contents = update_script_contents($default_script_file, $new_config_conf_file);

    // write script contents variable as the user script file.
    file_put_contents($new_config_script_file, $script_contents);
  }

  // if post is rename config, then rename the config.
  if (isset($_POST['#rename_config_button']) && (isset($_POST['selected_configs'])) && (isset($_POST['new_config_name']))) {
    // check that the root folder we want to write to exists and is writeable.
    if (!verify_dir($plugin_config_path)) {
      syslog(LOG_INFO, "Could not verify $plugin_config_path. Cannot rename config.");
      exit;
    }
    // get the old config name and path.
    $selected_configs_array = json_decode($_POST['selected_configs']);
    $old_config_name = $selected_configs_array[0];
    $old_config_path = $plugin_config_path . '/' . $old_config_name;
    // get the new config name and path.
    $new_config_name = $_POST['new_config_name'];
    $new_config_path = $plugin_config_path . '/' . $new_config_name;
    // make sure the config names aren't empty.
    if (empty($old_config_name)) {
      syslog(LOG_INFO, "Old config name was empty. Cannot rename config.");
      exit;
    }
    if (empty($new_config_name)) {
      syslog(LOG_INFO, "New config name was empty. Cannot rename config.");
      exit;
    }
    // make sure the path doesn't already exist.
    if (file_exists($new_config_path)) {
      syslog(LOG_ALERT, "$new_config_name config already exists. Cannot rename config.");
      exit;
    }

    // create the directory for the new config.
    mkdir($new_config_path, 0755, true);
    // create local variables for old config files.
    $old_config_script_file = $old_config_path . '/user-script.sh';
    $old_config_conf_file = $old_config_path . '/user.cfg';
    $old_config_pre_script_file = $old_config_path . '/pre-script.sh';
    $old_config_post_script_file = $old_config_path . '/post-script.sh';
    // create local variables for new config files.
    $new_config_script_file = $new_config_path . '/user-script.sh';
    $new_config_conf_file = $new_config_path . '/user.cfg';
    $new_config_pre_script_file = $new_config_path . '/pre-script.sh';
    $new_config_post_script_file = $new_config_path . '/post-script.sh';

    // move the config and script files to the new config folder.
    if (is_file($old_config_conf_file) && !file_exists($new_config_conf_file)) {
      rename($old_config_conf_file, $new_config_conf_file);
    }
    if (is_file($old_config_script_file) && !file_exists($new_config_script_file)) {
      rename($old_config_script_file, $new_config_script_file);
    }
    if (is_file($old_config_pre_script_file) && !file_exists($new_config_pre_script_file)) {
      rename($old_config_pre_script_file, $new_config_pre_script_file);
    }
    if (is_file($old_config_post_script_file) && !file_exists($new_config_post_script_file)) {
      rename($old_config_post_script_file, $new_config_post_script_file);
    }

    // verify that the old config directory is empty before removing.
    if (is_empty_dir($old_config_path)) {
      rmdir($old_config_path);
    } else {
      syslog(LOG_WARNING, "Could not remove $old_config_path during rename. Directory is not empty.");
    }

    // still need to update the cronjob.

  }

  // if post is copy config, then copy the config.
  if (isset($_POST['#copy_config_button']) && (isset($_POST['selected_configs'])) && (isset($_POST['copy_config_name']))) {
    // check that the root folder we want to write to exists and is writeable.
    if (!verify_dir($plugin_config_path)) {
      syslog(LOG_INFO, "Could not verify $plugin_config_path. Cannot copy config.");
      exit;
    }
    // get the selected config to copy.
    $selected_configs_array = json_decode($_POST['selected_configs']);
    $orig_config_name = $selected_configs_array[0];
    $orig_config_path = $plugin_config_path . '/' . $orig_config_name;
    // get the new config name and path.
    $copy_config_name = $_POST['copy_config_name'];
    $copy_config_path = $plugin_config_path . '/' . $copy_config_name;
    // make sure the config names aren't empty.
    if (empty($orig_config_name)) {
      syslog(LOG_INFO, "Old config name was empty. Cannot copy config.");
      exit;
    }
    if (empty($copy_config_name)) {
      syslog(LOG_INFO, "New config name was empty. Cannot copy config.");
      exit;
    }
    // make sure the path doesn't already exist.
    if (file_exists($copy_config_path)) {
      syslog(LOG_ALERT, "$copy_config_name config already exists. Cannot copy config.");
      exit;
    }

    // create the directory for the new config.
    mkdir($copy_config_path, 0755, true);
    // create local variables for original config files.
    $orig_config_script_file = $orig_config_path . '/user-script.sh';
    $orig_config_conf_file = $orig_config_path . '/user.cfg';
    $orig_config_pre_script_file = $orig_config_path . '/pre-script.sh';
    $orig_config_post_script_file = $orig_config_path . '/post-script.sh';
    // create local variables for copy config files.
    $copy_config_script_file = $copy_config_path . '/user-script.sh';
    $copy_config_conf_file = $copy_config_path . '/user.cfg';
    $copy_config_pre_script_file = $copy_config_path . '/pre-script.sh';
    $copy_config_post_script_file = $copy_config_path . '/post-script.sh';

    // copy the original config and script files to the copy config folder.
    if (is_file($orig_config_conf_file) && !file_exists($copy_config_conf_file)) {
      copy($orig_config_conf_file, $copy_config_conf_file);
    }
    if (is_file($orig_config_script_file) && !file_exists($copy_config_script_file)) {
      copy($orig_config_script_file, $copy_config_script_file);
    }
    if (is_file($orig_config_pre_script_file) && !file_exists($copy_config_pre_script_file)) {
      copy($orig_config_pre_script_file, $copy_config_pre_script_file);
    }
    if (is_file($orig_config_post_script_file) && !file_exists($copy_config_post_script_file)) {
      copy($orig_config_post_script_file, $copy_config_post_script_file);
    }

    // change copy user config cron schedule frequency to disabled.
    $copy_config_conf_array = parse_ini_file($copy_config_conf_file);
    $copy_config_conf_array["frequency"] = "disabled";

    // create copy user config file contents from updated copy user config array.
    $copy_config_conf_contents = create_ini_file($copy_config_conf_array);

    // write updated copy user config contents variable as the copy user config file.
    file_put_contents($copy_config_conf_file, $copy_config_conf_contents);
  }

  // if post is rename config, then rename the config.
  if (isset($_POST['#remove_configs_button']) && (isset($_POST['selected_configs']))) {
    // check that the root folder we want to write to exists and is writeable.
    if (!verify_dir($plugin_config_path)) {
      syslog(LOG_INFO, "Could not verify $plugin_config_path. Cannot rename config.");
      exit;
    }

    // get the old config name and path.
    $selected_configs_array = json_decode($_POST['selected_configs']);

    // remove all the files from each config and then remove the directory.
    foreach ($selected_configs_array as $config_name) {
      // get the name and full path of each config.
      $config_path = $plugin_config_path . '/' . $config_name;
      // remove all sub-files and the root directory.
      if (!remove_dir($config_path)) {
        syslog(LOG_ALERT, "Failed to remove config $config_name.");
      }
    }

    // still need to remove the cronjob.

  }
?>