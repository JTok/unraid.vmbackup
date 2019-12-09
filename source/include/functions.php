<?php

  // v0.1.1 - Development

  // function to remove white space from around commas in a list.
  function remove_list_whitespace($string) {
    $string = preg_replace('/\s*,\s*/', ',', $string);

    return $string;
  }

  // function to replace commas with new lines.
  function replace_comma_newline($string) {
    $string = str_ireplace(',', "\n", $string);

    return $string;
  }

  // function to return updated conf file contents, without writing it to a file.
  function update_config_contents($conf_file, $user_variables) {

    // store the config file contents in a variable.
    $conf_contents = file_get_contents($conf_file);

    // parse config file.
    $conf = parse_ini_file($conf_file);

    // loop through each key pair in the config file
    foreach ($conf as $key => $value) {
      
      // remove whitespace from between comma separated values for user variable.
      $user_value = remove_list_whitespace($user_variables[$key]);

      // replace a corresponding value in the config variable with value from user variables.
      $conf_contents = str_ireplace("$key=\"$value\"", "$key=\"$user_value\"", $conf_contents);
    }

    return $conf_contents;
  }

  // function to add missing config options from first config to second config, without writing it to a file.
  function add_missing_config_options($first_conf_file, $second_conf_file) {
    
    // get an array of the settings for the first config file and second config file.
    $first_conf_array = parse_ini_file($first_conf_file);
    $second_conf_array = parse_ini_file($second_conf_file);

    // get an array of the differences between the two configs.
    $conf_diff = array_diff($first_conf_array, $second_conf_array);

    // add the missing config options to the second config.
    foreach ($conf_diff as $key => $value) {
      
      // only add missing keys, do not change existing values.
      if (!array_key_exists($key)){
        $second_conf_array[$key] = $value;
      }
    }

    return $second_conf_array;
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

  // function to return sanitized config file contents, without writing it to a file.
  function sanitize_config($conf_file) {

    // store the config file contents in a variable.
    $conf_contents = file_get_contents($conf_file);

    // parse config file.
    $conf = parse_ini_file($conf_file);

    // loop through each key pair in the config file
    foreach ($conf as $key => $value) {
      
      // remove whitespace from between comma separated values for user variable.
      $new_value = remove_list_whitespace($value);

      // replace a corresponding value in the config variable with value from user variables.
      $conf_contents = str_ireplace("$key=\"$value\"", "$key=\"$new_value\"", $conf_contents);
    }

    return $conf_contents;
  }

  // function to validate form options.
  function validate_form() {
    return "form validated";
  }

  // function to create an array of numbers with matching keys.
  function create_number_array($start_number, $finish_number, $padding_depth = "0") {

    // create an empty array.
    $number_array = array();

    // set argument for number of leading zeros used by sprintf.
    $sprintf_arg = '%0' . $padding_depth . 'd';

    // loop through each number and add it to the array.
    for ($i = $start_number; $i <= $finish_number; $i++) {
      $padded_number = sprintf($sprintf_arg, $i);
      $number_array[$padded_number] = $padded_number;
    }

    return $number_array;
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

  // function to take config array and create config file contents, without writing it to a file.
  function create_ini_file ($conf_array) {
    $config_contents = "";
    foreach ($conf_array as $key => $value) {
      $config_contents .= "$key=\"$value\"\n";
    }
    
    return $config_contents;
  }



  // check for post commands.
  // if update_script_contents exists, then update the user script file.
  if (isset($_POST['#update_script_contents'])) {
    $default_script_file = $_POST['#default_script_file'];
    $user_script_file = $_POST['#user_script_file'];
    $conf_file = $_POST['#conf_file'];

    // create a variable with the default script contents and user config file merged.
    $script_contents = update_script_contents($default_script_file, $user_conf_file);

    // write script contents variable as the user script file.
    file_put_contents($user_script_file, $script_contents);
  }

  // check for arguments passed from bash.
  // if first argument is update_user_script, then update the user script file.
  if ($argv[1] == "update_user_script") {
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
?>