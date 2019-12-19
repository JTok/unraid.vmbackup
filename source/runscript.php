#!/usr/bin/php

<?php

  /* vmbackup plugin
  copyright 2019 JTok */

  // v0.1.6 - 2019/12/18

  require_once '/usr/local/emhttp/plugins/vmbackup/include/functions.php';

  // create local variables.
  // plugin name.
  $plugin = 'vmbackup';
  // user files.
  $plugin_path = '/boot/config/plugins/' . $plugin;
  $user_script_file = $plugin_path . '/user-script.sh';
  // tmp files.
  $current_datetime = date('Ymd_His');
  $tmp_plugin_path = '/tmp/vmbackup/scripts';
  $tmp_user_script_file = $tmp_plugin_path . '/user-script.sh';
  $tmp_log_file = $tmp_plugin_path . '/'. $current_datetime .'_user-script.log';


  // start logging to tmp log file.
  file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Starting VM Backup ".$tmp_user_script_file."\n", FILE_APPEND);
  // log the process id of the current process running the script.
  file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." PID: ".getmypid()."\n", FILE_APPEND);

  // make directory in tmp to run script from.
  exec("mkdir -p ".escapeshellarg($tmp_plugin_path));
  file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Created directory: ".$tmp_plugin_path."\n", FILE_APPEND);

  // remove any old logs from the tmp path.
  $old_logs = glob($tmp_plugin_path . "/*_user-script.log");
  foreach ($old_logs as $log_file) {
    unlink($log_file);
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Removed old log file: ".$log_file."\n", FILE_APPEND);
  }

  // check if tmp_user_script_file exists. if so, delete it.
  if (is_file($tmp_user_script_file)) {
    unlink($tmp_user_script_file);
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Removed old script file: ".$tmp_user_script_file."\n", FILE_APPEND);
  }

  // make sure that the user script file exists.
  if (! is_file($user_script_file)) {
    // if not, exit the script.
    logger("User script file does not exist. Exiting.");
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." User script file does not exist. Exiting.\n", FILE_APPEND);
    exit();
  }

  // get user script config variables.
  $conf_array = get_special_variables($user_script_file);
  // get unraid config variables.
  $unraid_conf = parse_ini_file("/var/local/emhttp/var.ini");
  
  // verify that the array is started before trying to run the script. if not, exit.
  if ($conf_array['arrayStarted'] == "true" && $unraid_conf['mdState'] != "STARTED") {
    logger("Array is not started. Cannot run $user_script_file. Exiting.");
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Array is not started. Cannot run $user_script_file. Exiting.\n", FILE_APPEND);
    exit();
  }

  // verify that the array is not running a parity check or rebuild. if so, exit.
  if ($conf_array['noParity'] == "true" && $unraid_conf['mdResyncPos']) {
    logger("Parity check or rebuild is in progress. Cannot run $user_script_file. Exiting.");
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Parity check or rebuild is in progress. Cannot run $user_script_file. Exiting.\n", FILE_APPEND);
    exit();
  }

  // get the contents of the user script file.
  $user_script_contents = file_get_contents($user_script_file);
  
  // create a copy of the user script file in the tmp folder and make it executable.
  file_put_contents($tmp_user_script_file, $user_script_contents);
  exec("chmod +x ".escapeshellarg($tmp_user_script_file));

  // build command to run script with logging.
  $run_cmd = $tmp_user_script_file." >> $tmp_log_file 2>&1";

  // execute the command to run the script.
  file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Running command: ".$run_cmd."\n", FILE_APPEND);
  exec($run_cmd);

  // remove tmp user script file.
  unlink($tmp_user_script_file);
  file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_user_script_file."\n", FILE_APPEND);

  // end logging to tmp log file.
  file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Finished VM Backup user-script.sh."."\n\n", FILE_APPEND);

?>