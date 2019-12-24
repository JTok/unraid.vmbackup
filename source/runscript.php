#!/usr/bin/php

<?php

  /* vmbackup plugin
  copyright 2019 JTok */

  require_once '/usr/local/emhttp/plugins/vmbackup/include/functions.php';

  // create local variables.
  // plugin name.
  $plugin = 'vmbackup';
  // user files.
  $plugin_path = '/boot/config/plugins/' . $plugin;
  $user_script_file = $plugin_path . '/user-script.sh';
  $user_fix_snapshots_file = $plugin_path . '/user-fix-snapshots.sh';
  // tmp files.
  $current_datetime = date('Ymd_His');
  $tmp_plugin_path = '/tmp/vmbackup/scripts';
  // user script tmp files.
  $tmp_user_script_file = $tmp_plugin_path . '/user-script.sh';
  $tmp_log_file = $tmp_plugin_path . '/'. $current_datetime .'_user-script.log';
  $tmp_user_script_pid = $tmp_plugin_path . '/user-script.pid';
  // fix snapshots tmp files.
  $tmp_fix_snapshots_file = $tmp_plugin_path . '/user-fix-snapshots.sh';
  $tmp_fix_snapshots_log_file = $tmp_plugin_path . '/'. $current_datetime .'_fix-snapshots.log';
  $tmp_fix_snapshots_pid = $tmp_plugin_path . '/user-fix-snapshots.pid';
  // abort script tmp files.
  $tmp_abort_script_log_file = $tmp_plugin_path . '/'. $current_datetime .'_abort-script.log';
  // get arguments.
  $arg1 = $argv[1];

  // if no arguments were passed, set arg1 to run_backup for backwards compatibility.
  if (empty($arg1)) {
    $arg1 = "run_backup";
  }

  if ($arg1 == "run_backup") {
    // make directory in tmp to run script from.
    exec("mkdir -p ".escapeshellarg($tmp_plugin_path));

    // remove any old logs from the tmp path.
    $old_logs = glob($tmp_plugin_path . "/*_user-script.log");
    foreach ($old_logs as $log_file) {
      unlink($log_file);
    }

    // start logging to tmp log file.
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Starting VM Backup ".$tmp_user_script_file."\n", FILE_APPEND);
    // log the process id of the current process running the script.
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." PID: ".getmypid()."\n", FILE_APPEND);
    // create text file for the process id of the current process running the script.
    file_put_contents($tmp_user_script_pid, getmypid());

    // check to see if a backup is already running.
    if (is_file($tmp_user_script_file)) {
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." A backup is already running. Exiting.\n", FILE_APPEND);
      logger("A backup is already running. Exiting.");
      exit();
    }

    // check to see if a snapshot fix is already running.
    if (is_file($tmp_fix_snapshots_file)) {
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Fix Snapshots is already running. Exiting.\n", FILE_APPEND);
      logger("Fix Snapshots is already running. Exiting.");
      exit();
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

    // remove tmp user pid file.
    unlink($tmp_user_script_pid);
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_user_script_pid."\n", FILE_APPEND);

    // end logging to tmp log file.
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Finished VM Backup user-script.sh.", FILE_APPEND);
  }


  if ($arg1 == "fix_snapshots") {
    // make directory in tmp to run script from.
    exec("mkdir -p ".escapeshellarg($tmp_plugin_path));

    // remove any old logs from the tmp path.
    $old_logs = glob($tmp_plugin_path . "/*_fix-snapshots.log");
    foreach ($old_logs as $log_file) {
      unlink($log_file);
    }

    // start logging to tmp log file.
    file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Starting Fix Snapshots ".$tmp_fix_snapshots_file."\n", FILE_APPEND);
    // log the process id of the current process running the script.
    file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." PID: ".getmypid()."\n", FILE_APPEND);
    // create text file for the process id of the current process running the script.
    file_put_contents($tmp_fix_snapshots_pid, getmypid());

    // check to see if a backup is already running.
    if (is_file($tmp_fix_snapshots_file)) {
      file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." A backup is already running. Exiting.\n", FILE_APPEND);
      logger("A backup is already running. Exiting.");
      exit();
    }

    // check to see if a snapshot fix is already running.
    if (is_file($tmp_fix_snapshots_file)) {
      file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Fix Snapshots is already running. Exiting.\n", FILE_APPEND);
      logger("Fix Snapshots is already running. Exiting.");
      exit();
    }

    // make sure that the fix snapshots script file exists.
    if (! is_file($user_fix_snapshots_file)) {
      // if not, exit the script.
      logger("Fix Snapshots script file does not exist. Exiting.");
      file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Fix Snapshots script file does not exist. Exiting.\n", FILE_APPEND);
      exit();
    }

    // get user script config variables.
    $conf_array = get_special_variables($user_fix_snapshots_file);
    // get unraid config variables.
    $unraid_conf = parse_ini_file("/var/local/emhttp/var.ini");
    
    // verify that the array is started before trying to run the script. if not, exit.
    if ($conf_array['arrayStarted'] == "true" && $unraid_conf['mdState'] != "STARTED") {
      logger("Array is not started. Cannot run $user_fix_snapshots_file. Exiting.");
      file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Array is not started. Cannot run $user_fix_snapshots_file. Exiting.\n", FILE_APPEND);
      exit();
    }

    // verify that the array is not running a parity check or rebuild. if so, exit.
    if ($conf_array['noParity'] == "true" && $unraid_conf['mdResyncPos']) {
      logger("Parity check or rebuild is in progress. Cannot run $user_fix_snapshots_file. Exiting.");
      file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Parity check or rebuild is in progress. Cannot run $user_fix_snapshots_file. Exiting.\n", FILE_APPEND);
      exit();
    }

    // get the contents of the fix snapshots script file.
    $fix_snapshots_contents = file_get_contents($user_fix_snapshots_file);
    
    // create a copy of the fix snapshots script file in the tmp folder and make it executable.
    file_put_contents($tmp_fix_snapshots_file, $fix_snapshots_contents);
    exec("chmod +x ".escapeshellarg($tmp_fix_snapshots_file));

    // build command to run fix snapshots script with logging.
    $run_cmd = $tmp_fix_snapshots_file." >> $tmp_fix_snapshots_log_file 2>&1";

    // execute the command to run the fix snapshots script.
    file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Running command: ".$run_cmd."\n", FILE_APPEND);
    exec($run_cmd);

    // remove tmp fix snapshots script file.
    unlink($tmp_fix_snapshots_file);
    file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_fix_snapshots_file."\n", FILE_APPEND);

    // remove tmp fix snapshots pid file.
    unlink($tmp_fix_snapshots_pid);
    file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_fix_snapshots_pid."\n", FILE_APPEND);

    // end logging to tmp fix snapshots log file.
    file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Finished Fix Snapshots user-fix-snapshots.sh.", FILE_APPEND);
  }


  if ($arg1 == "abort_script") {
    // make directory in tmp to run script from.
    exec("mkdir -p ".escapeshellarg($tmp_plugin_path));

    // remove any old logs from the tmp path.
    $old_logs = glob($tmp_plugin_path . "/*_abort-script.log");
    foreach ($old_logs as $log_file) {
      unlink($log_file);
    }

    // start logging to tmp log file.
    file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Starting abort script.\n", FILE_APPEND);
    // log the process id of the current process running the script.
    file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." PID: ".getmypid()."\n", FILE_APPEND);

    // check to see if both pid files don't exist.
    if ((!is_file($tmp_user_script_pid)) && (!is_file($tmp_fix_snapshots_pid))) {
      file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." No PID files found. Nothing to abort.", FILE_APPEND);
    }

    // check for user script pid.
    if (is_file($tmp_user_script_pid)) {
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Found $tmp_user_script_pid. Attempting to kill process.\n", FILE_APPEND);
      // attempt to kill user script process.
      $user_script_pid = file_get_contents("$tmp_user_script_pid");
      // try sigterm for orderly shutdown.
      exec("kill -SIGTERM $user_script_pid");
      // try keyboard interrupt.
      exec("kill -SIGINT $user_script_pid");
      // force kill in case those didn't work.
      exec("kill -SIGKILL $user_script_pid");

      // remove tmp user script file.
      unlink($tmp_user_script_file);
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_user_script_file."\n", FILE_APPEND);

      // remove tmp user pid file.
      unlink($tmp_user_script_pid);
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_user_script_pid."\n", FILE_APPEND);
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Aborted user script with pid $tmp_user_script_pid.\n", FILE_APPEND);
    }

    // check for fix snapshots script pid.
    if (is_file($tmp_fix_snapshots_pid)) {
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Found $tmp_fix_snapshots_pid. Attempting to kill process.\n", FILE_APPEND);
      // attempt to kill fix snapshots script process.
      $fix_snapshots_pid = file_get_contents("$tmp_fix_snapshots_pid");
      // try sigterm for orderly shutdown.
      exec("kill -SIGTERM $fix_snapshots_pid");
      // try keyboard interrupt.
      exec("kill -SIGINT $fix_snapshots_pid");
      // force kill in case those didn't work.
      exec("kill -SIGKILL $fix_snapshots_pid");

      // remove tmp user script file.
      unlink($tmp_fix_snapshots_file);
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_user_script_file."\n", FILE_APPEND);

      // remove tmp user pid file.
      unlink($tmp_user_script_pid);
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_user_script_pid."\n", FILE_APPEND);
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Aborted user script with pid $tmp_user_script_pid.\n", FILE_APPEND);
    }

    // end logging to tmp fix snapshots log file.
    file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Finished abort script.", FILE_APPEND);
  }

?>