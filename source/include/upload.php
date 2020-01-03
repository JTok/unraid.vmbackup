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

  // verify directory exists before trying to write to it.
  if (!file_exists($plugin_path)) {
    mkdir($plugin_path, 0755, true);
  }
  if (!is_dir($plugin_path)) {
    syslog(LOG_ALERT, "$plugin_path is not a directory. User script not created.");
    exit;
  }
  // verify that the directory is writable.
  if (!is_writeable($plugin_path)) {
    syslog(LOG_ALERT, "Could not write to $plugin_path. User script not created.");
    exit;
  }

  // check for post commands.
  // if submit pre-script, then update pre-script.
  if (isset($_POST['#submit_pre_script']) && (isset($_POST['pre_script_textarea']))) {
    $pre_script_contents = ($_POST['pre_script_textarea']);
    if (empty($pre_script_contents)) {
      if (is_file($pre_script_file)) {
        unlink($pre_script_file);
      }
    } else {
      $pre_script_contents = validate_script($pre_script_contents, $user_conf_file);
      file_put_contents($pre_script_file, $pre_script_contents);
      // set file permissions.
      exec("chmod 755 " . $pre_script_file);
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
    $post_script_contents = ($_POST['post_script_textarea']);
    if (empty($post_script_contents)) {
      if (is_file($post_script_file)) {
        unlink($post_script_file);
      }
    } else {
      $post_script_contents = validate_script($post_script_contents, $user_conf_file);
      file_put_contents($post_script_file, $post_script_contents);
      // set file permissions.
      exec("chmod 755 " . $post_script_file);
    }
  }
  // if remove post-script, then remove post-script.
  if (isset($_POST['#remove_post_script'])) {
    if (is_file($post_script_file)) {
      unlink($post_script_file);
    }
  }
?>