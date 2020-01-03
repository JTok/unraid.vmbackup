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
  $pre_script_file = $plugin_path . '/pre-script.sh';
  $post_script_file = $plugin_path . '/post-script.sh';
  // tmp files.
  $current_datetime = date('Ymd_His');
  $tmp_plugin_path = '/tmp/vmbackup/scripts';
  // user script tmp files.
  $tmp_user_script_file = $tmp_plugin_path . '/user-script.sh';
  $tmp_log_file = $tmp_plugin_path . '/'. $current_datetime .'_user-script.log';
  $tmp_user_script_pid = $tmp_plugin_path . '/user-script.pid';
  $tmp_pre_script_file = $tmp_plugin_path . '/pre-script.sh';
  $tmp_post_script_file = $tmp_plugin_path . '/post-script.sh';
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

    // check to see if a backup is already running.
    if (is_file($tmp_user_script_file) || is_file($tmp_pre_script_file) || is_file($tmp_post_script_file)) {
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." A backup is already running. Exiting.\n", FILE_APPEND);
      exit();
    }

    // check to see if a snapshot fix is already running.
    if (is_file($tmp_fix_snapshots_file)) {
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Fix Snapshots is already running. Exiting.\n", FILE_APPEND);
      exit();
    }

    // make sure that the user script file exists.
    if (! is_file($user_script_file)) {
      // if not, exit the script.
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." User script file does not exist. Exiting.\n", FILE_APPEND);
      exit();
    }

    // remove any old logs from the tmp path.
    $old_logs = glob($tmp_plugin_path . "/*_user-script.log");
    foreach ($old_logs as $log_file) {
      unlink($log_file);
    }

    // start logging to tmp log file.
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Starting VM Backup.\n", FILE_APPEND);
    // log the process id of the current process running the script.
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." PID: ".getmypid()."\n", FILE_APPEND);
    // create text file for the process id of the current process running the script.
    file_put_contents($tmp_user_script_pid, getmypid());

    // get user script config variables.
    $conf_array = get_special_variables($user_script_file);
    // get unraid config variables.
    $unraid_conf = parse_ini_file("/var/local/emhttp/var.ini");
    
    // verify that the array is started before trying to run the script. if not, exit.
    if ($conf_array['arrayStarted'] == "true" && $unraid_conf['mdState'] != "STARTED") {
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Array is not started. Cannot run $user_script_file. Exiting.\n", FILE_APPEND);
      exit();
    }

    // check if script should run during parity or rebuild.
    if ($conf_array['noParity'] == "true") {
      // find out if parity check is in progress.
      if (array_key_exists('mdResyncPos', $unraid_conf) && !empty($unraid_conf['mdResyncPos'])) {
        $parityRunning = true;
      } else {
        $parityRunning = false;
      }

      // verify that the array is not running a parity check or rebuild. if so, exit.
      if ($parityRunning == true) {
        file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Parity check or rebuild is in progress. Cannot run $user_script_file. Exiting.\n", FILE_APPEND);
        exit();
      }
    }

    // copy user scripts to tmp directory.
    if (is_file($pre_script_file)) {
      // get the contents of the pre-script file.
      $pre_script_contents = file_get_contents($pre_script_file);
      // create a copy of the pre-script file in the tmp folder and make it executable.
      file_put_contents($tmp_pre_script_file, $pre_script_contents);
      exec("chmod +x ".escapeshellarg($tmp_pre_script_file));
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Pre-script copied to ".$tmp_pre_script_file."\n", FILE_APPEND);
    }

    // get the contents of the user script file.
    $user_script_contents = file_get_contents($user_script_file);
    // create a copy of the user script file in the tmp folder and make it executable.
    file_put_contents($tmp_user_script_file, $user_script_contents);
    exec("chmod +x ".escapeshellarg($tmp_user_script_file));
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." User script copied to ".$tmp_user_script_file."\n", FILE_APPEND);

    if (is_file($post_script_file)) {
      // get the contents of the post-script file.
      $post_script_contents = file_get_contents($post_script_file);
      // create a copy of the post-script file in the tmp folder and make it executable.
      file_put_contents($tmp_post_script_file, $post_script_contents);
      exec("chmod +x ".escapeshellarg($tmp_post_script_file));
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Post-script copied to ".$tmp_post_script_file."\n", FILE_APPEND);
    }

    if (is_file($tmp_pre_script_file)) {
      // build command to run pre-script with logging.
      $pre_run_cmd = $tmp_pre_script_file." >> $tmp_log_file 2>&1";

      // execute the command to run the script.
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Running command: ".$pre_run_cmd."\n", FILE_APPEND);
      exec($pre_run_cmd);
    }

    // build command to run script with logging.
    $run_cmd = $tmp_user_script_file." >> $tmp_log_file 2>&1";

    // execute the command to run the script.
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Running command: ".$run_cmd."\n", FILE_APPEND);
    exec($run_cmd);

    if (is_file($tmp_post_script_file)) {
      // build command to run post-script with logging.
      $post_run_cmd = $tmp_post_script_file." >> $tmp_log_file 2>&1";

      // execute the command to run the script.
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Running command: ".$post_run_cmd."\n", FILE_APPEND);
      exec($post_run_cmd);
    }

    // remove tmp pre script file.
    if (is_file($tmp_pre_script_file)) {
      unlink($tmp_pre_script_file);
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_pre_script_file."\n", FILE_APPEND);
    }

    // remove tmp user script file.
    unlink($tmp_user_script_file);
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_user_script_file."\n", FILE_APPEND);

    // remove tmp post script file.
    if (is_file($tmp_post_script_file)) {
      unlink($tmp_post_script_file);
      file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_post_script_file."\n", FILE_APPEND);
    }

    // remove tmp user pid file.
    unlink($tmp_user_script_pid);
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_user_script_pid."\n", FILE_APPEND);

    // end logging to tmp log file.
    file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Finished VM Backup.", FILE_APPEND);
  }


  if ($arg1 == "fix_snapshots") {
    // make directory in tmp to run script from.
    exec("mkdir -p ".escapeshellarg($tmp_plugin_path));

    // check to see if a backup is already running.
    if (is_file($tmp_user_script_file) || is_file($tmp_pre_script_file) || is_file($tmp_post_script_file)) {
      file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." A backup is already running. Exiting.\n", FILE_APPEND);
      exit();
    }

    // check to see if a snapshot fix is already running.
    if (is_file($tmp_fix_snapshots_file)) {
      file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Fix Snapshots is already running. Exiting.\n", FILE_APPEND);
      exit();
    }

    // make sure that the fix snapshots script file exists.
    if (! is_file($user_fix_snapshots_file)) {
      // if not, exit the script.
      file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Fix Snapshots script file does not exist. Exiting.\n", FILE_APPEND);
      exit();
    }

    // remove any old logs from the tmp path.
    $old_logs = glob($tmp_plugin_path . "/*_fix-snapshots.log");
    foreach ($old_logs as $log_file) {
      unlink($log_file);
    }

    // start logging to tmp log file.
    file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Starting Fix Snapshots.\n", FILE_APPEND);
    // log the process id of the current process running the script.
    file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." PID: ".getmypid()."\n", FILE_APPEND);
    // create text file for the process id of the current process running the script.
    file_put_contents($tmp_fix_snapshots_pid, getmypid());

    // get user script config variables.
    $conf_array = get_special_variables($user_fix_snapshots_file);
    // get unraid config variables.
    $unraid_conf = parse_ini_file("/var/local/emhttp/var.ini");
    
    // verify that the array is started before trying to run the script. if not, exit.
    if ($conf_array['arrayStarted'] == "true" && $unraid_conf['mdState'] != "STARTED") {
      file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Array is not started. Cannot run $user_fix_snapshots_file. Exiting.\n", FILE_APPEND);
      exit();
    }

    // check if script should run during parity or rebuild.
    if ($conf_array['noParity'] == "true") {
      // find out if parity check is in progress.
      if (array_key_exists('mdResyncPos', $unraid_conf) && !empty($unraid_conf['mdResyncPos'])) {
        $parityRunning = true;
      } else {
        $parityRunning = false;
      }

      // verify that the array is not running a parity check or rebuild. if so, exit.
      if ($parityRunning == true) {
        file_put_contents($tmp_log_file, date('Y-m-d H:i:s')." Parity check or rebuild is in progress. Cannot run $user_script_file. Exiting.\n", FILE_APPEND);
        exit();
      }
    }

    // get the contents of the fix snapshots script file.
    $fix_snapshots_contents = file_get_contents($user_fix_snapshots_file);
    // create a copy of the fix snapshots script file in the tmp folder and make it executable.
    file_put_contents($tmp_fix_snapshots_file, $fix_snapshots_contents);
    exec("chmod +x ".escapeshellarg($tmp_fix_snapshots_file));
    file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Fix snapshots script copied to ".$tmp_fix_snapshots_file."\n", FILE_APPEND);

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
    file_put_contents($tmp_fix_snapshots_log_file, date('Y-m-d H:i:s')." Finished Fix Snapshots.", FILE_APPEND);
  }


  if ($arg1 == "abort_script") {
    // make directory in tmp to run script from.
    exec("mkdir -p ".escapeshellarg($tmp_plugin_path));

    // remove any old logs from the tmp path.
    $old_logs = glob($tmp_plugin_path . "/*_abort-script.log");
    foreach ($old_logs as $log_file) {
      unlink($log_file);
    }

    // notify the user that an abort has been started.
    exec('/usr/local/emhttp/plugins/dynamix/scripts/notify -s "VM Backup plugin" -d "attempting abort" -i "warning" -m "$(date \'+%Y-%m-%d %H:%M\') Attempting to abort running scripts."');

    // start logging to tmp log file.
    file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Starting abort script.\n", FILE_APPEND);
    // log the process id of the current process running the script.
    file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." PID: ".getmypid()."\n", FILE_APPEND);

    // check to see if both pid files don't exist.
    if ((!is_file($tmp_user_script_pid)) && (!is_file($tmp_fix_snapshots_pid))) {
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." No PID files found. Nothing to abort.", FILE_APPEND);
    }

    // check for user script pid.
    if (is_file($tmp_user_script_pid)) {
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Found $tmp_user_script_pid. Attempting to kill process.\n", FILE_APPEND);
      // attempt to kill user script process.
      $user_script_pid = file_get_contents("$tmp_user_script_pid");
      // try sigterm for orderly shutdown.
      exec("pkill -SIGTERM -P " . $user_script_pid);
      exec("killall -SIGTERM pre-script.sh");
      exec("killall -SIGTERM user-script.sh");
      exec("killall -SIGTERM post-script.sh");
      // try keyboard interrupt.
      exec("pkill -SIGINT -P " . $user_script_pid);
      exec("killall -SIGINT pre-script.sh");
      exec("killall -SIGINT user-script.sh");
      exec("killall -SIGINT post-script.sh");
      // force kill in case those didn't work.
      exec("pkill -SIGKILL -P " . $user_script_pid);
      exec("killall -SIGKILL pre-script.sh");
      exec("killall -SIGKILL user-script.sh");
      exec("killall -SIGKILL post-script.sh");
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Aborted user script with pid $user_script_pid.\n", FILE_APPEND);

      // remove tmp user script file.
      unlink($tmp_user_script_file);
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_user_script_file."\n", FILE_APPEND);

      // remove tmp user pid file.
      unlink($tmp_user_script_pid);
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_user_script_pid."\n", FILE_APPEND);
    }

    // check for fix snapshots script pid.
    if (is_file($tmp_fix_snapshots_pid)) {
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Found $tmp_fix_snapshots_pid. Attempting to kill process.\n", FILE_APPEND);
      // attempt to kill fix snapshots script process.
      $fix_snapshots_pid = file_get_contents("$tmp_fix_snapshots_pid");
      // try sigterm for orderly shutdown.
      exec("killall -SIGTERM user-fix-snapshots.sh");
      // try keyboard interrupt.
      exec("killall -SIGINT user-fix-snapshots.sh");
      // force kill in case those didn't work.
      exec("killall -SIGKILL user-fix-snapshots.sh");
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Aborted fix snapshots script with pid $fix_snapshots_pid.\n", FILE_APPEND);

      // remove tmp user script file.
      unlink($tmp_fix_snapshots_file);
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_fix_snapshots_file."\n", FILE_APPEND);

      // remove tmp user pid file.
      unlink($tmp_fix_snapshots_pid);
      file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Removed: ".$tmp_fix_snapshots_pid."\n", FILE_APPEND);
    }

    // end logging to tmp fix snapshots log file.
    file_put_contents($tmp_abort_script_log_file, date('Y-m-d H:i:s')." Finished abort script.", FILE_APPEND);
  }

  if ($arg1 == "show_log") {
    if (file_exists($tmp_plugin_path)) {
      $files = scandir($tmp_plugin_path, SCANDIR_SORT_DESCENDING);
      for ($i = 0; $i < count($files); $i++) {
        if (preg_match('/.*_user-script.log/', $files[$i])) {
          $newest_file = $files[$i];
          break;
        }
      }
      $newest_log_file = $tmp_plugin_path . '/' . $newest_file;
      if (is_file($newest_log_file)) {
        $tail_log = popen('/usr/bin/tail -n 80 -f ' . escapeshellarg($tmp_plugin_path . '/' . $newest_file) . ' 2>&1' , 'r');
        while (!feof($tail_log)) {
          $line = fgets($tail_log);
          echo $line;
          flush();
        }
        pclose($tail_log);
      }
    }
  }

?>