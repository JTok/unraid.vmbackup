<?php

  /* vmbackup plugin
    copyright 2019 JTok */


  require_once '/usr/local/emhttp/plugins/vmbackup/include/sanitization.php';
  require_once '/usr/local/emhttp/plugins/vmbackup/include/validation.php';

  // function to create or update the user config file as necessary and return the results as a config array.
  function update_user_conf_file($default_conf_file, $user_conf_file) {
    // see if user config file already exists.
    if (!is_file($user_conf_file)) {

      // if not, create it from the default config file.
      if (!copy($default_conf_file, $user_conf_file)) {
        echo "failed to create user config file.\n";

      } else {

        // parse user config file.
        $conf_array = parse_ini_file($user_conf_file);
      }

    } else {

      // if so, get an array of the user config settings with any new default config settings added to it.
      $user_conf_array = add_missing_config_options($default_conf_file, $user_conf_file);

      if (!empty($user_conf_array)) {
        // create user config file contents from new array.
        $user_conf_contents = create_ini_file($user_conf_array);
        
        // write new config contents variable as the new user config.
        file_put_contents($user_conf_file, $user_conf_contents);
      }
    }
      // parse user config file.
      $conf_array = parse_ini_file($user_conf_file);
      return $conf_array;
  }

  // function to add missing config options from first config to second config, without writing it to a file.
  function add_missing_config_options($first_conf_file, $second_conf_file) {

    // get an array of the settings for the first config file and second config file.
    $first_conf_array = parse_ini_file($first_conf_file);
    $second_conf_array = parse_ini_file($second_conf_file);

    // get an array of the differences between the two configs.
    $conf_diff = array_diff($first_conf_array, $second_conf_array);

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

      // remove whitespace from between comma separated values for script variable.
      $value = remove_list_whitespace($value);

      // replace commas with new lines for script variable.
      $value = replace_comma_newline($value);

      // replace a corresponding value in the script variable with value from config file.
      $script_contents = str_ireplace("$key=\"no_config\"", "$key=\"$value\"", $script_contents);
    }

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
  function get_special_variables($file, $num_lines = 10) {
    // read the file into an array.
    $file_contents_array = file($file);
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
    $valid_keys = ['arrayStarted', 'noParity'];
    $special_variables = array_filter($commented_variables, function($key) use ($valid_keys) {
      return in_array($key, $valid_keys);
    }, ARRAY_FILTER_USE_KEY);
    // return the filtered array.
    return $special_variables;
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

    // create a variable with the default script contents and user config file merged.
    $script_contents = update_script_contents($default_script_file, $conf_file);

    // write script contents variable as the user script file.
    file_put_contents($user_script_file, $script_contents);
  }
  // if first argument is update_user_script, then update the user script file.
  if ($argv[1] == "update_user_conf_file") {
    // create variables for passed parameters.
    $default_conf_file = $argv[2];
    $user_conf_file = $argv[3];

    // create or update the user config file as necessary.
    update_user_conf_file($default_conf_file, $user_conf_file);
  }
?>