<?php

  // v0.1.0 - Development


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
?>