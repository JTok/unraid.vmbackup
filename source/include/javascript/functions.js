
/* vmbackup plugin
  copyright JTok */


/* start functions to manipulate page elements */
  // function to change a specific attribute for a specific control.
  function change_attr(control_name, attr_name, desired_state) {
    $(control_name).attr(attr_name, desired_state);
  }

  // function to change a specific property for a specific control.
  function change_prop(control_name, prop_name, desired_state) {
    $(control_name).prop(prop_name, desired_state);
  }

  // function to create serialized data for form post.
  function serialize_string(name, value, append = true) {
    if (append) {
      serialized_string = "&";
    }
    serialized_string += encodeURIComponent(name) + "=" + encodeURIComponent(value);
    return serialized_string;
  }
/* end functions to manipulate page elements */

/* start functions for cookies */
  // function to set a cookie.
  function set_cookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      var expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires;
  }

  // function to get a cookie by name.
  function get_cookie(name) {
    var name_equals = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(name_equals) == 0) {
        return c.substring(name_equals.length, c.length);
      }
    }
    return "";
  }

  // function to delete a cookie by name.
  function delete_cookie(name) {
    document.cookie = name + "=; Max-Age=0;";
  }
  // function to check the default cookies, and set them if they don't exist.
  function check_cookie(name, value = false) {
    var cookie = get_cookie(name);
    if (cookie == "") {
      if (name) {
        set_cookie(name, value);
      }
    }
  }

  // function to change a global variable and set its cookie.
  function set_variable_cookie(name, new_value = false) {
    window[name] = new_value;
    set_cookie(name, new_value);
  }
/* end functions for cookies */

/* start functions for validation */
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

  // function to remove white space from around commas in a list.
  function remove_list_whitespace(string) {
    string = string.trim();
    string = string.replace(/\s*,\s*/gi, ",");

    return string;
  }

  // function to return basic regular expression to validate a cron statement.
  function basic_cron_regex() {
    return '(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\\d+(ns|us|µs|ms|s|m|h))+)|((((\\d+,)+\\d+|(\\d+(\\/|-)\\d+)|\\d+|\\*) ?){5,7})';
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
/* end functions for validation */