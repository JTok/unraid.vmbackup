<?php

  /* vmbackup plugin
    copyright 2019 JTok */

  // function to validate form options.
  function validate_form() {
    return "form validated";
  }

  // function to check if a string is a positive whole integer or zero.
  function is_positive_integer($num) {
    return (is_numeric($num) && $num >= 0 && $num == round($num));
  }

  // function to validate if a string follows a relative linux file naming path convention with trailing slashes.
  function is_relative_path($path) {
    return (preg_match("^[^\/]([\w-]*)+(\/[\w-]*)*[\/]$", $path));
  }

// function to validate if a string follows a absolute linux file naming path convention with trailing slashes.
  function is_absolute_path($path) {
    return (preg_match("(^\/$)|(^\/([\w-]*)+(\/[\w-]*)*[\/]$)", $path));
  }

  // function to validate user pre and post scripts.
  function validate_script($script_contents, $conf_file) {
    // replace line breaks with unix style line breaks.
    $script_contents = replace_line_breaks($script_contents);
    // parse config file.
    $conf = parse_ini_file($conf_file);

    // read the first line of the script to find out if the shebang already exists.
    $line = rtrim(strtok($script_contents, "\n"));
    if (!strcmp($line, "#!/bin/bash") == 0) {
      $shebang_exists = false;
      $prepend = "#!/bin/bash\n";
    } else {
      $shebang_exists = true;
      $prepend = "#!/bin/bash\n";
    }
    // see if the file contains any special variables.
    $special_conf_array = get_special_variables($script_contents, 10, false);
    // if the file does not contain any special variables, add them.
    if (empty($special_conf_array)) {
      $prepend .= "#arrayStarted=" . $conf["arrayStarted"] . "\n";
      $prepend .= "#noParity=" . $conf["noParity"] . "\n";
    } else {
      if (!empty($special_conf_array["arrayStarted"])) {
        $script_contents = replace_line("arrayStarted", "", $script_contents, false);
        $prepend .= "#arrayStarted=" . $conf["arrayStarted"] . "\n";
      } else {
        $prepend .= "#arrayStarted=" . $conf["arrayStarted"] . "\n";
      }
      if (!empty($special_conf_array["noParity"])) {
        $script_contents = replace_line("noParity", "", $script_contents, false);
        $prepend .= "#noParity=" . $conf["noParity"] . "\n";
      } else {
        $prepend .= "#noParity=" . $conf["noParity"] . "\n";
      }
    }
    // prepend the string to the script.
    if ($shebang_exists == false) {
      $script_contents = prepend_string($prepend, $script_contents, false);
    } elseif ($shebang_exists == true ) {
      $script_contents = replace_line("#!/bin/bash", "", $script_contents, false);
      $prepend = rtrim($prepend);
      $script_contents = prepend_string($prepend, $script_contents, false);
    }
    return $script_contents;
  }

  // function to replace line in a file based on a search string.
  function replace_line($search_string, $new_line, $contents, $is_file = true) {
    // check to see if the contents passed are a file or not.
    if ($is_file == true) {
      $file = $contents;
      $reading = fopen($file, 'r');
      $writing = fopen($file . ".tmp", 'w');

      $replaced = false;

      while (!feof($reading)) {
        $line = fgets($reading);
        if (stristr($line, $search_string)) {
          if ($new_line == "") {
            $line = $new_line;
          } else {
            $line = $new_line . "\n";
          }
          $replaced = true;
        }
        fputs($writing, $line);
      }
      fclose($reading); fclose($writing);
      // don't overwrite the file if nothing was replaced.
      if ($replaced) {
        rename($file . ".tmp", $file);
      } else {
        unlink($file . ".tmp");
      }
    } elseif ($is_file == false) {
      // check to see if the variable is a string or an array.
      if (gettype($contents) == "array") {
        // if it is an array, copy it to contents_array.
        $contents_array = $contents;
      } elseif (gettype($contents) == "string") {
        // if it is a string, explode it into an array using newline.
        $contents_array = explode("\n", $contents);
      }
      // search array values for the search string and return the corresponding key.
      // use regex to find the full search string value.
      $search_string = preg_quote($search_string, '/');
      $search_result_array = preg_grep("/.*$search_string.*/", $contents_array);
      // remove empty values.
      $search_result_array = array_values(array_filter($search_result_array));
      // get the full search string.
      $full_search_string = $search_result_array[0];
      $key = array_search($full_search_string, $contents_array);
      // replace the line in the contents array with the new one.
      if ($new_line == "" ) {
        unset($contents_array[$key]);
        $contents_array = array_values($contents_array);
      } else {
        $contents_array[$key] = $new_line;
      }

      // check to see if the variable is a string or an array.
      if (gettype($contents) == "array") {
        // if it is an array, return an array.
        return $contents_array;
      } elseif (gettype($contents) == "string") {
        // if it is a string, return a string.
        $contents_string = implode("\n", $contents_array);
        return $contents_string;
      }
    }
  }
?>