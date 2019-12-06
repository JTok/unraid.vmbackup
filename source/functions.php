<?php

  // function to remove white space from around commas in a list.
  function remove_list_whitespace($string) {
    while (preg_match('/\s+,\s+/', $string)) {
      $string = preg_replace('/\s+,\s+/', ',', $string);
    }

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
      
      // replace a corresponding value in the config variable with value from user variables.
      $conf_contents = str_ireplace("$key=\"$value\"", "$key=\"$user_variables[$key]\"", $conf_contents);
    }

    return $conf_contents;
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

?>