<?php
#######################################################
#                                                     #
# User Scripts Plugin Copyright 2016, Andrew Zawadzki #
#                                                     #
#######################################################
#################################################################
#                                                               #
# Helper function to determine if $haystack begins with $needle #
#                                                               #
#################################################################
function startsWith($haystack, $needle) {
  return $needle === "" || strripos($haystack, $needle, -strlen($haystack)) !== FALSE;
}
######################################################################################
#                                                                                    #
# Function that reads a script and returns the variables contained in the lead lines #
#                                                                                    #
######################################################################################
function getRawVariables($filename) {
  $fileLines = explode("\n",str_replace("\r","",@file_get_contents($filename)));
  foreach($fileLines as $line) {
    if ( startsWith($line,"#!") ) {
      continue;
    }
    if ( ! trim($line) ) {
      continue;
    }
    if ( startsWith($line,"<?") ) {
      continue;
    }
    if ( startsWith($line,"#") ) {
      if ( ! strpos($line,"=") ) { continue;}
      $testString = trim(str_replace("#","",$line))."\n";
      $testString = str_replace("(","",$testString);
      $testString = str_replace(")","",$testString);
      $iniString .= $testString;
    
    } else {
      break;
    }
  }
  $process = explode("\n",$iniString);
  foreach ($process as $line) {
    $entry = explode("=",$line);
    if ( empty($entry) ) {
      continue;
    }
    $iniArray[trim($entry[0])] = $entry[1];
  }
  return $iniArray;
}
function getScriptVariables($filename) {
	$booleans = ['foregroundOnly','backgroundOnly','arrayStarted','clearLog','noParity','directPHP'];
	$vars = getRawVariables($filename);
	
	foreach (array_keys($vars) as $key) {
		if ( in_array($key,$booleans) ) {
			$vars[$key] = filter_var($vars[$key],FILTER_VALIDATE_BOOLEAN);
		}
	}
  return $vars;
}
###############################
#                             #
# Logs an entry to the syslog #
#                             #
###############################
function logger($string) {
  $string = escapeshellarg($string);
  exec("logger ".$string);
}
?>