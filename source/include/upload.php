<?php

  /* vmbackup plugin
    copyright 2019 JTok */

  require_once '/usr/local/emhttp/plugins/vmbackup/include/functions.php';
  require_once '/usr/local/emhttp/plugins/vmbackup/include/sanitization.php';
  require_once '/usr/local/emhttp/plugins/vmbackup/include/validation.php';

  // create local variables.
  // plugin name.
  $plugin = 'vmbackup';
  // user files.
  $plugin_path = '/boot/config/plugins/' . $plugin;
  $user_conf_file = $plugin_path . '/user.cfg';
  $pre_script_file = $plugin_path . '/pre-script.sh';
  $post_script_file = $plugin_path . '/post-script.sh';

  // check for post commands.
  // if submit pre-script, then update pre-script.
  if (isset($_POST['#submit_pre_script']) && (isset($_POST['pre_script_textarea']))) {
    // check that the root folder we want to write to exists and is writeable.
    if (!verify_dir($plugin_path)) {
      syslog(LOG_INFO, "Could not verify $plugin_path. Cannot create new config.");
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
    if (!verify_dir($plugin_path)) {
      syslog(LOG_INFO, "Could not verify $plugin_path. Cannot create new config.");
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