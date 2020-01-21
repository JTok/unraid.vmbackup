<?php

  /* vmbackup plugin
    copyright JTok */

  require_once '/usr/local/emhttp/plugins/vmbackup/include/functions.php';
  require_once '/usr/local/emhttp/plugins/vmbackup/include/sanitization.php';
  require_once '/usr/local/emhttp/plugins/vmbackup/include/validation.php';

  // create local variables.
  // plugin name.
  $plugin = 'vmbackup';
  // user files.
  $plugin_path = '/boot/config/plugins/' . $plugin;

  // check for post commands.
  // see if current_config was sent with post.
  if (isset($_POST['#current_config'])) {
    // if so, set the variable based on post.
    $current_config = ($_POST['#current_config']);
  } else {
    // if not, set as default for backwards compatibility.
    $current_config = "default";
  }

  // set variables based on current config.
  if (!strcasecmp($current_config, "default") == 0) {
    $plugin_configs_path = $plugin_path . '/configs';
    $current_config_path = $plugin_configs_path . '/' . $current_config;
    $user_conf_file = $current_config_path . '/user.cfg';
    $pre_script_file = $current_config_path . '/pre-script.sh';
    $post_script_file = $current_config_path . '/post-script.sh';
  } else {
    $current_config_path = $plugin_path;
    $user_conf_file = $plugin_path . '/user.cfg';
    $pre_script_file = $plugin_path . '/pre-script.sh';
    $post_script_file = $plugin_path . '/post-script.sh';
  }

  // if submit pre-script, then update pre-script.
  if (isset($_POST['#submit_pre_script']) && (isset($_POST['pre_script_textarea']))) {
    // check that the root folder we want to write to exists and is writeable.
    if (!verify_dir($current_config_path)) {
      syslog(LOG_INFO, "Could not verify $current_config_path. Cannot create pre-script.");
      exit;
    }
    $pre_script_contents = ($_POST['pre_script_textarea']);
    if (empty($pre_script_contents)) {
      if (is_file($pre_script_file)) {
        unlink($pre_script_file);
      }
    } else {
      $pre_script_contents = validate_script($pre_script_contents, $user_conf_file);
      file_put_contents($pre_script_file, $pre_script_contents);
    }
  }
  // if remove pre-script, then remove pre-script.
  if (isset($_POST['#remove_pre_script'])) {
    if (is_file($pre_script_file)) {
      unlink($pre_script_file);
    }
  }
  // if submit post-script, then update post-script.
  if (isset($_POST['#submit_post_script']) && (isset($_POST['post_script_textarea']))) {
    // check that the root folder we want to write to exists and is writeable.
    if (!verify_dir($current_config_path)) {
      syslog(LOG_INFO, "Could not verify $current_config_path. Cannot create post-script.");
      exit;
    }
    $post_script_contents = ($_POST['post_script_textarea']);
    if (empty($post_script_contents)) {
      if (is_file($post_script_file)) {
        unlink($post_script_file);
      }
    } else {
      $post_script_contents = validate_script($post_script_contents, $user_conf_file);
      file_put_contents($post_script_file, $post_script_contents);
    }
  }
  // if remove post-script, then remove post-script.
  if (isset($_POST['#remove_post_script'])) {
    if (is_file($post_script_file)) {
      unlink($post_script_file);
    }
  }
?>