<?php

  /* vmbackup plugin
    copyright JTok */

  require_once '/usr/local/emhttp/plugins/vmbackup/include/functions.php';
  require_once '/usr/local/emhttp/plugins/vmbackup/include/sanitization.php';
  require_once '/usr/local/emhttp/plugins/vmbackup/include/validation.php';

  // create local variables.
  // plugin name.
  $plugin = 'vmbackup';
  // default files.
  $plugin_source_path = '/usr/local/emhttp/plugins/' . $plugin;
  $script_path = $plugin_source_path . '/scripts';
  $commands_script_file = $script_path . '/commands.sh';
  $default_script_file = $script_path . '/default-script.sh';
  $default_conf_file = $plugin_source_path . '/default.cfg';
  // user files.
  $plugin_path = '/boot/config/plugins/' . $plugin;
  $plugin_config_path = $plugin_path . '/configs';

  // check for post commands.
  // if post is set folder, then set the global variable.
  if (isset($_POST['#set_folder'])) {
    if (is_dir($_POST['#set_folder'])) {
      $folder = $_POST['#set_folder'];
      $files = array_filter(scandir($folder), function($item) { return !is_dir($folder . $item); });
      exec("mkdir -p ".escapeshellarg('/tmp/vmbackup/files/'));
      file_put_contents('/tmp/vmbackup/files/restore_files.txt', implode("\n", $files));
    }
  }
?>