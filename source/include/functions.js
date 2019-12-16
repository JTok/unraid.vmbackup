
/* vmbackup plugin
  copyright 2019 JTok */

// function to change a specific attribute for a specific control.
function change_attr(control_name, attr_name, desired_state) {
  $(control_name).attr(attr_name, desired_state);
}

// function to add validation events to page element.
function add_validation_events(id, message) {
  // get page element by id.
  var input = document.getElementById(id);

  // set a custom validation message.
  input.oninvalid = function (event) {
    event.target.setCustomValidity(message);
  }
  // set the validation message to blank on input to prevent it from staying triggered after a correction.
  input.oninput = function (event) {
    event.target.setCustomValidity('');
  }
}

// function to return basic regular expression to validate a cron statement.
function basic_cron_regex() {
  return '(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})'
}

// function to create a regular expression to validate a cron statement.
function create_cron_regex() {
  var regexByField = {};
  regexByField["sec"] = "[0-5]?\\\\d";
  regexByField["min"] = "[0-5]?\\\\d";
  regexByField["hour"] = "[01]?\\\\d|2[0-3]";
  regexByField["day"] = "0?[1-9]|[12]\\\\d|3[01]";
  regexByField["month"] = "[1-9]|1[012]";
  regexByField["dayOfWeek"] = "[0-7]";
  regexByField["year"] = "|\\\\d{4}";

  ["sec", "min", "hour", "day", "month", "dayOfWeek", "year"].forEach(function (field) {
    var number = regexByField[field];
    var range =
      "(?:" + number + ")" +
      "(?:" +
      "(?:-|\/|," + ("dayOfWeek" === field ? "|#" : "") + ")" +
      "(?:" + number + ")" +
      ")?";
    if (field === "dayOfWeek") range += "(?:L)?";
    if (field === "month") range += "(?:L|W)?";
    regexByField[field] = "\\\\?|\\\\*|" + range + "(?:," + range + ")*";
  });

  var monthValues = "JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC";
  var monthRange = "(?:" + monthValues + ")(?:(?:-)(?:" + monthValues + "))?";
  regexByField["month"] += "|\\\\?|\\\\*|" + monthRange + "(?:," + monthRange + ")*";

  var dayOfWeekValues = "MON|TUE|WED|THU|FRI|SAT|SUN";
  var dayOfWeekRange = "(?:" + dayOfWeekValues + ")(?:(?:-)(?:" + dayOfWeekValues + "))?";
  regexByField["dayOfWeek"] += "|\\\\?|\\\\*|" + dayOfWeekRange + "(?:," + dayOfWeekRange + ")*";

  return '^\\\\s*($' +
    '|#' +
    '|\\\\w+\\\\s*=' +
    "|" +
    "(" + regexByField["sec"] + ")\\\\s+" +
    "(" + regexByField["min"] + ")\\\\s+" +
    "(" + regexByField["hour"] + ")\\\\s+" +
    "(" + regexByField["day"] + ")\\\\s+" +
    "(" + regexByField["month"] + ")\\\\s+" +
    "(" + regexByField["dayOfWeek"] + ")(|\\\\s)+" +
    "(" + regexByField["year"] + ")" +
    ")$";
}