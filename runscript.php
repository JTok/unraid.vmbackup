#!/usr/bin/php

<?php

  /* vmbackup plugin
  copyright 2019 JTok */

  // v0.1.0 - Development

  require_once '/usr/local/emhttp/plugins/vmbackup/include/helpers.php';

  // create local variables.
  // plugin name.
  $plugin = 'vmbackup';
  // user files.
  $plugin_path = '/boot/config/plugins/' . $plugin;
  $user_script_file = $plugin_path . '/user-script.sh';
  // tmp files.
  $tmp_plugin_path = '/tmp/vmbackup/scripts';
  $tmp_user_script_file = $tmp_plugin_path . '/user-script.sh';
  $tmp_log_file = $tmp_plugin_path . '/user-script-log.txt';

  // make directory in tmp to run script from.
  exec("mkdir -p ".escapeshellarg($tmp_plugin_path));
  
  // make sure that the user script file exists.
  if (! is_file($user_script_file)) {
    // if not, exit the script.
    logger("User script file does not exist. Exiting.");
    exit();
  }

  // get user script config variables.
  $conf_array = getScriptVariables($user_script_file);
  // get unraid config variables.
  $unraid_conf = parse_ini_file("/var/local/emhttp/var.ini");
  
  // verify that the array is started before trying to run the script. if not, exit.
  if ($conf_array['arrayStarted'] && $unraid_conf['mdState'] != "STARTED") {
    logger("Array is not started. Cannot run $user_script_file. Exiting.");
    exit();
  }

  // verify that the array is not running a parity check or rebuild. if so, exit.
  if ($conf_array['noParity'] && $unraid_conf['mdResyncPos']) {
    logger("Parity check or rebuild is in progress. Cannot run $user_script_file. Exiting.");
    exit();
  }
  
  // get the contents of the user script file.
  $user_script_contents = file_get_contents($user_script_file);
  
  // create a copy of the user script file in the tmp folder and make it executable.
  file_put_contents($tmp_user_script_file, $user_script_contents);
  exec("chmod +x ".escapeshellarg($tmp_user_script_file));
  
  // start logging to tmp log file.
  file_put_contents($tmp_log_file, date('Y-m-d H:i:s')."Starting VM Backup user-script.sh."."\n", FILE_APPEND);

  // build command to run script with logging.
  $run_cmd = $tmp_user_script_file." >> $tmp_log_file 2>&1";

  // execute the command to run the script.
  exec($run_cmd);

  // end logging to tmp log file.
  file_put_contents($tmp_log_file, date('Y-m-d H:i:s')."Finished VM Backup user-script.sh."."\n\n", FILE_APPEND);

  // remove tmp user script file.
  unlink($tmp_user_script_file);

  // remove tmp log file.
  unlink($tmp_log_file);

?>