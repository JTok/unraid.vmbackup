<?php

  /* vmbackup plugin
    copyright JTok */


  require_once '/usr/local/emhttp/plugins/vmbackup/include/sanitization.php';
  require_once '/usr/local/emhttp/plugins/vmbackup/include/validation.php';

  // function to compare versions of two files.
  function same_file_version($default_file, $user_file, $is_config = false) {
    // check to see if the user file exists.
    if (!is_file($user_file)) {
      return false;
    }
    if ($is_config) {
      $default_conf_array = parse_ini_file("$default_file");
      $user_conf_array = parse_ini_file("$user_file");
      if ($default_conf_array["version"] === $user_conf_array["version"]) {
        return true;
      } else {
        return false;
      }
    } else {
      $default_file_array = get_special_variables($default_file);
      $user_file_array = get_special_variables($user_file);
      if ($default_file_array["version"] === $user_file_array["version"]) {
        return true;
      } else {
        return false;
      }
    }
  }

  // function to create or update the user config file as necessary and return the results as a config array.
  function update_user_conf_file($default_conf_file, $user_conf_file) {
    // see if user config file already exists.
    if (!is_file($user_conf_file)) {
      // if not, create it from the default config file.
      if (!copy($default_conf_file, $user_conf_file)) {
        syslog(LOG_ALERT, "failed to create user config file.");
      } else {
        // parse user config file.
        $conf_array = parse_ini_file($user_conf_file);
      }
    } else {
      // see if default config version is the same as user config version.
      if (!same_file_version($default_conf_file, $user_conf_file, true)) {
        // if not, get an array of the user config settings with any new default config settings added to it, or an empty array if no changes were found.
        $user_conf_array = add_missing_config_options($default_conf_file, $user_conf_file);

        if (empty($user_conf_array)) {
          // if array is empty, create user config array from file.
          $user_conf_array = parse_ini_file($user_conf_file);
        }

        // update the user config array to have the new version number from the default config file.
        $default_conf_array = parse_ini_file("$default_conf_file");
        $user_conf_array["version"] = $default_conf_array["version"];

        // update legacy variables.
        $user_conf_array = replace_legacy_variables($user_conf_array);

        // create user config file contents from updated user config array.
        $user_conf_contents = create_ini_file($user_conf_array);

        // write new config contents variable as the new user config.
        file_put_contents($user_conf_file, $user_conf_contents);

        // clone updated user config array to conf_array.
        $conf_array = $user_conf_array;
      } else {
        // if file version is the same, create user config array from file.
        $conf_array = parse_ini_file($user_conf_file);
      }
    }
    // return updated config array.
    return $conf_array;
  }

  // function to replace legacy variables from past versions of the plugin.
  function replace_legacy_variables($conf_array) {
    // update new variables with values from legacy variables before removal.
    // v0.2.1 variables which added zstandard compression to the existing pigz compression.
    if (array_key_exists("pigz_compress", $conf_array) && array_key_exists("compress_backups", $conf_array)) {
      $conf_array["pigz_compress"] = $conf_array["compress_backups"];
    }
    if (array_key_exists("pigz_level", $conf_array) && array_key_exists("compression_level", $conf_array)) {
      $conf_array["pigz_level"] = $conf_array["compression_level"];
    }
    if (array_key_exists("pigz_threads", $conf_array) && array_key_exists("threads", $conf_array)) {
      $conf_array["pigz_threads"] = $conf_array["threads"];
    }
    // v0.2.3 variables which removed pigz and reverted back to gzip.
    if (array_key_exists("gzip_compress", $conf_array) && array_key_exists("pigz_compress", $conf_array)) {
      $conf_array["gzip_compress"] = $conf_array["pigz_compress"];
    }
    if (array_key_exists("gzip_level", $conf_array) && array_key_exists("pigz_level", $conf_array)) {
      $conf_array["gzip_level"] = $conf_array["pigz_level"];
    }
    // remove legacy variables.
    // v0.2.0 variables replaced, which added zstandard compression to the existing pigz compression.
    unset($conf_array["compress_backups"]);
    unset($conf_array["compression_level"]);
    unset($conf_array["threads"]);
    // v0.2.3 variables replaced, which removed pigz and reverted back to gzip.
    unset($conf_array["pigz_compress"]);
    unset($conf_array["pigz_level"]);
    unset($conf_array["pigz_threads"]);

    // return updated config array.
    return $conf_array;
  }

  // function to add missing config options from first config to second config, without writing it to a file.
  function add_missing_config_options($first_conf_file, $second_conf_file) {

    // get an array of the settings for the first config file and second config file.
    $first_conf_array = parse_ini_file($first_conf_file);
    $second_conf_array = parse_ini_file($second_conf_file);

    // get an array of the differences between the two configs.
    $conf_diff = array_diff_assoc($first_conf_array, $second_conf_array);

    // if differences were found, continue.
    if (!empty($conf_diff)) {

      // add the missing config options to the second config.
      foreach ($conf_diff as $key => $value) {

        // only add missing keys, do not change existing values.
        if (!array_key_exists($key, $second_conf_array)){
          $second_conf_array[$key] = $value;
        }
      }
      return $second_conf_array;
    } else {
      return $conf_diff;
    }
  }


  // function to take config array and create config file contents, without writing it to a file.
  function create_ini_file ($conf_array) {
    $config_contents = "";
    foreach ($conf_array as $key => $value) {
      $config_contents .= "$key=\"$value\"\n";
    }

    return $config_contents;
  }


  // function to return script file contents that have been updated by an array of configs, without writing it to a file.
  function update_script_contents($script_file, $conf_file) {

    // store the script file contents in a variable.
    $script_contents = file_get_contents($script_file);

    // store the config file contents in a variable.
    $conf_contents = file_get_contents($conf_file);

    // parse config file.
    $conf = parse_ini_file($conf_file);

    // for each key pair in the config array, replace the corresponding value in the script contents.
    foreach ($conf as $key => $value) {
      // check if key is arrayStarted or noParity.
      if ($key == "arrayStarted") {
        // set arrayStarted value.
        $script_contents = str_replace("#arrayStarted=no_config", "#arrayStarted=" . $value, $script_contents);
      } elseif ($key == "noParity") {
        // set noParity to value.
        $script_contents = str_replace("#noParity=no_config", "#noParity=" . $value, $script_contents);
      } else {
        // remove whitespace from between comma separated values for script variable.
        $value = remove_list_whitespace($value);

        // replace commas with new lines for script variable.
        $value = replace_comma_newline($value);

        // replace a corresponding value in the script variable with value from config file.
        $script_contents = str_ireplace("$key=\"no_config\"", "$key=\"$value\"", $script_contents);
      }
    }

    return $script_contents;
  }

  // function to update just special variables in a script without writing the file.
  function update_special_variables($script_file, $conf_file) {
    // get the script contents.
    $script_contents = file_get_contents($script_file);
    // validate the script contents and update any config variables.
    $script_contents = validate_script($script_contents, $conf_file);

    // return the updated contents.
    return $script_contents;
  }

  // function to create an array of padded numbers as the key with un-padded values.
  function create_number_array($start_number, $finish_number, $padding_depth = "0") {

    // create an empty array.
    $number_array = array();

    // set argument for number of leading zeros used by sprintf.
    $sprintf_arg = '%0' . $padding_depth . 'd';

    // loop through each number and add it to the array.
    for ($i = $start_number; $i <= $finish_number; $i++) {
      $padded_number = sprintf($sprintf_arg, $i);
      $number_array[$padded_number] = $i;
    }

    return $number_array;
  }

  // function to determine if a string contains a specific substring using a regular expression.
  function find_substring($substring, $string) {
    if (preg_match($substring, $string) === 1) {
      return true;
    }
  }

  // function to get special commented variables from the top of a file.
  function get_special_variables($contents, $num_lines = 10, $is_file = true) {
    // check to see if the passed contents are a file.
    if ($is_file == true) {
      // if so, read the file into an array.
      $file_contents_array = file($contents);
    } elseif ($is_file == false) {
      // check to see if the variable is a string or an array.
      if (gettype($contents) == "array") {
        // if it is an array, copy it to file_contents_array.
        $file_contents_array = $contents;
      } elseif (gettype($contents) == "string") {
        // if it is a string, explode it into an array using newline.
        $file_contents_array = explode("\n", $contents);
      }
    }

    // determine the number of lines to read from the top of the file.
    if (count($file_contents_array) >= $num_lines) {
      $num_lines = $num_lines;
    } else {
      $num_lines = count($file_contents_array);
    }
    // iterate through each line and add any that appear to be special variables to the commented_variables array.
    for ($i = 0; $i < $num_lines; $i++) {
      // check line to see if it starts with just a '#' and not a '#!'.
      if ((!find_substring('/^#!/', $file_contents_array[$i])) && (find_substring('/^#/', $file_contents_array[$i]))) {
        // check line to make sure it contains an '='.
        $is_commented_variable = strpos($file_contents_array[$i], '=');
        // if the line matches the requirements above, remove the leading '#' and add it to the array as a key/value pair.
        if ($is_commented_variable !== false) {
          $no_prefix = preg_replace('/^#/', '', $file_contents_array[$i]);
          $commented_variable = explode("=", $no_prefix);
          $commented_variables[$commented_variable[0]] = $commented_variable[1];
        }
      } else {
        // if the line does not start with a '#', continue to the next line.
        continue;
      }
    }
    // filter array to only contain valid special variables before returning it.
    $valid_keys = ['arrayStarted', 'noParity', 'version'];
    $special_variables = array_filter($commented_variables, function($key) use ($valid_keys) {
      return in_array($key, $valid_keys);
    }, ARRAY_FILTER_USE_KEY);
    // return the filtered array.
    return $special_variables;
  }

  // function to prepend string to a file.
  function prepend_string($string, $contents, $is_file = true) {
    if ($is_file == true) {
      $file = $contents;
      $context = stream_context_create();
      $open_file = fopen($file, 'r', 1, $context);

      $temp_filename = tempnam(sys_get_temp_dir(), 'php_prepend_');
      file_put_contents($temp_filename, $string);
      file_put_contents($temp_filename, $open_file, FILE_APPEND);

      fclose($open_file);
      unlink($file);
      rename($temp_filename, $file);
    } elseif ($is_file == false) {
      // check to see if the variable is a string or an array.
      if (gettype($contents) == "array") {
        // if it is an array, copy it to contents_array.
        $array_unshift($contents, $string);
        return $contents;
      } elseif (gettype($contents) == "string") {
        // if it is a string, explode it into an array using newline.
        $contents = $string . "\n" . $contents;
        return $contents;
      }
    }
  }

  // function to verify directory exists and is writeable.
  function verify_dir($path) {
    // see if directory or file already exists with a given path.
    if (!file_exists($path)) {
      mkdir($path, 0755, true);
    }
    // verify that the path is a directory.
    if (!is_dir($path)) {
      syslog(LOG_INFO, "$path is not a directory.");
      return false;
    }
    // verify that the directory is writable.
    if (!is_writeable($path)) {
      syslog(LOG_INFO, "Could not write to $path.");
      return false;
    }
    // if we have made it to the end without an error, return true.
    return true;
  }

  // function to verify directory is empty.
  function is_empty_dir($path) {
    // make the path is a directory.
    if(is_dir($path)){
      // use scandir to get the contents of the directory and array_diff to filter out . and ..
      $list = array_diff(scandir($path), array('..', '.'));
      // check to see if anything was found.
      if(empty($list)){
        return true;
      } else{
        return false;
      }
    } else {
      syslog(LOG_INFO, "$path is not a directory.");
      return false;
    }
  }

  // function to remove all contents from directory and, optionally, remove the directory.
  function remove_dir($path, $keep_folder = false) {
    // verify path is valid.
    if (empty($path) || !file_exists($path)) {
      // the path does not exist.  
      return true;
    } elseif (is_file($path) || is_link($path)) {
      // delete the file or directory. 
      return @unlink($path);
    }

    // use recursive iterators to delete all children.
    $files = new \RecursiveIteratorIterator(
      new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS),
      \RecursiveIteratorIterator::CHILD_FIRST
    );

    foreach ($files as $fileinfo) {
      $action = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
      if (!@$action($fileinfo->getRealPath())) {
        return false;
      }
    }

    // check if the folder should be removed, and if so, remove it. return true/false based on result.
    return (!$keep_folder ? @rmdir($path) : true);
  }

  // function to get number of CPU cores using php
  function cpu_thread_count($include_smt = true) {
    // get the cpu core count from nproc.
    exec("nproc --all", $thread_output);
    $thread_count = trim($thread_output[0]);
    if (!ctype_digit($thread_count)) {
      $thread_count = 0;
    } else {
      // cast thread_count as int.
      $thread_count = intval($thread_count);
    }

    // if smt should not be included in the thread count, check to see if it is enabled.
    if (!$include_smt) {
      exec("cat /sys/devices/system/cpu/smt/active", $smt_output);
      if ($smt_output[0] == "1") {
        // if smt is enabled, divide the number of threads found by 2.
        $thread_count = intdiv($thread_count, 2);
      }
    }

    // if the core count is greater than 0 return it. otherwise return 2 so that at least 2 threads can run.
    if ($thread_count > 0) {
      return $thread_count;
    } else {
      return 2;
    }
  }


  // function to send a post command to another php page.
  function send_post($url, $data) {

    // use key 'http' even if you send the request to https://...
    $options = array(
      'http' => array(
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query($data)
      )
    );
    $context  = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    if ($result === FALSE) {
      echo "POST to $url failed.\n";
    }

    var_dump($result);
  }

  function set_config_defaults($current_config) {
    // plugin name.
    $plugin = 'vmbackup';
    // default files.
    $plugin_source_path = '/usr/local/emhttp/plugins/' . $plugin;
    $script_path = $plugin_source_path . '/scripts';
    $commands_script_file = $script_path . '/commands.sh';
    $default_conf_file = $plugin_source_path . '/default.cfg';
    $default_fix_snapshots_file = $script_path. '/default-fix-snapshots.sh';
    // user files.
    $plugin_path = '/boot/config/plugins/' . $plugin;
    $user_fix_snapshots_file = $plugin_path. '/user-fix-snapshots.sh';

    // finish creating variables based on current config.
    if (!strcasecmp($current_config, "default") == 0) {
      $configs_plugin_path = $plugin_path . '/configs';
      $current_config_path = $configs_plugin_path . '/' . $current_config;
      $user_script_file = $current_config_path . '/user-script.sh';
      $user_conf_file = $current_config_path . '/user.cfg';
    } else {
      $user_script_file = $plugin_path . '/user-script.sh';
      $user_conf_file = $plugin_path . '/user.cfg';
    }

    // replace the user config with the default config.
    if (!copy($default_conf_file, $user_conf_file)) {
      syslog(LOG_ALERT, "failed to reset user config file.");
    } else {
      // check to see if we are working with the default config.
      if (strcasecmp($current_config, "default") == 0) {
        // create a variable with the default fix snapshots script contents and user config file merged.
        $snapshot_script_contents = update_script_contents($default_fix_snapshots_file, $user_conf_file);

        // write script contents variable as the user fix snapshots script file.
        file_put_contents($user_fix_snapshots_file, $snapshot_script_contents);
      }
    }

    // remove the cron job.
    exec("$commands_script_file remove_cron_job ".escapeshellarg($current_config));
  }

  function backup_user_files($file_path, $contents) {
    // strip the plugin path from the file path.
    $file_folder = str_replace('/boot/config/plugins/vmbackup/', '', $file_path);
    // check to see if the file is in a folder or not.
    if ($file_folder === basename($file_path)) {
      // the file is not in a folder, so it must be the default config.
      // set the config name to default.
      $conf_name = 'default';
    } else {
      // the file is in a folder, so it must not be the default config.
      // strip the configs folder from the file path.
      $file_folder = str_replace('configs/', '', $file_path);
      // get the name of the folder the file is in and set that as the config name.
      $conf_name = str_replace('/', '', dirname($file_folder));
    }
    // read contents into array.
    $contents_array = parse_ini_string($contents);
    // write file to backup location.
    file_put_contents($contents_array["backup_location"] . $conf_name . '_' . basename($file_path), $contents);
  }


  // check for post commands.
  // if update_script_contents argument exists, then update the user script file.
  if (isset($_POST['#update_script_contents'])) {
    $default_script_file = $_POST['#default_script_file'];
    $user_script_file = $_POST['#user_script_file'];
    $conf_file = $_POST['#conf_file'];

    // create a variable with the default script contents and user config file merged.
    $script_contents = update_script_contents($default_script_file, $user_conf_file);

    // write script contents variable as the user script file.
    file_put_contents($user_script_file, $script_contents);
  }

  // if set_config_defaults argument exists, then reset the user script file.
  if (isset($_POST['#set_config_defaults'])) {
    if (isset($_POST['#current_config'])) {
      $current_config = $_POST['#current_config'];
      set_config_defaults($current_config);
    }
  }

  // if script argument exists, then run script with any additional arguments.
  if (isset($_POST['#script'])) {
    // get the script to be run.
    $script = $_POST['#script'];
    // build the command to be executed.
    $command = $script;
    if (isset($_POST['#args'])) {
      $args = $_POST['#args'];
      $command = $command . " " .implode(" ", $args);
    }
    // run the command.
    exec($command);
  }

  // check for arguments passed from bash.
  // if first argument is update_user_script, then update the user script file.
  if ($argv[1] == "update_user_script") {
    // create variables for passed parameters.
    $default_script_file = $argv[2];
    $user_script_file = $argv[3];
    $conf_file = $argv[4];

    // create a variable with the config file contents sanitized.
    $conf_contents = sanitize_config($conf_file);

    // write sanitized config contents variable to the user config file.
    file_put_contents($conf_file, $conf_contents);

    // see if user config should be backed up.
    // convert conf_contents string to associative array
    $conf_contents_array = parse_ini_string($conf_contents);
    if ($conf_contents_array["backup_config"] === "1") {
      backup_user_files($conf_file, $conf_contents);
    }

    // create a variable with the default script contents and user config file merged.
    $script_contents = update_script_contents($default_script_file, $conf_file);

    // write script contents variable as the user script file.
    file_put_contents($user_script_file, $script_contents);
  }
  // if first argument is update_user_conf_file, then update the user config file.
  if ($argv[1] == "update_user_conf_file") {
    // create variables for passed parameters.
    $default_conf_file = $argv[2];
    $user_conf_file = $argv[3];

    // create or update the user config file as necessary.
    update_user_conf_file($default_conf_file, $user_conf_file);
  }
  // if first argument is update special variables, then update the special variables.
  if ($argv[1] == "update_special_variables") {
    // create variables for passed parameters.
    $script_file = $argv[2];
    $conf_file = $argv[3];

    // get a string containing the script contents merged with the config file.
    $script_contents = update_special_variables($script_file, $conf_file);

    // write user script contents variable as the user script file.
    file_put_contents($script_file, $script_contents);

    // see if user scripts should be backed up.
    // convert conf_contents string to associative array
    $conf_contents_array = parse_ini_string($conf_contents);
    if ($conf_contents_array["backup_user_scripts"] === "1") {
      backup_user_files($script_file, $script_contents);
    }
  }
?>