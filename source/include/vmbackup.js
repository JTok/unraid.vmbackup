
/* vmbackup plugin
  copyright JTok */


/** start functions for Vmbackup all pages **/
  // function to enable and set validation for page elements.
  function set_validation() {
    // set validation message for each page element, as well as a custom error message.
    add_validation_events('backup_location', 'Path must be located in /mnt/, or disable restrictive validation. Cannot be blank.');
    add_validation_events('number_of_days_to_keep_backups', 'Please input a zero, a number from 7-180, or disable restrictive validation. Cannot be blank.');
    add_validation_events('number_of_backups_to_keep', 'Please input a zero, a number from 2-40, or disable restrictive validation. Cannot be blank.');
    add_validation_events('custom', 'Please enter a valid cron statement, or disable cron validation. Cannot be blank.');
    add_validation_events('vdisk_extensions_to_skip', 'This should be blank, or a comma separated list.');
    add_validation_events('number_of_log_files_to_keep', 'Please input a zero, a number from 1-40, or disable restrictive validation. Cannot be blank.');
    add_validation_events('log_file_subfolder', 'Path must be relative (no leading slash). Cannot be blank.');
    add_validation_events('number_of_error_log_files_to_keep', 'Please input a zero, a number from 2-40, or disable restrictive validation. Cannot be blank.');
    add_validation_events('clean_shutdown_checks', 'Please input a number from 5-50, or disable restrictive validation. Cannot be blank.');
    add_validation_events('seconds_to_wait', 'Please input a number from 30-600, or disable restrictive validation. Cannot be blank.');
    add_validation_events('snapshot_extension', 'Please enter a valid extension. Cannot be blank.');
  }

  // function to update form elements based on current config.
  function update_form_config(current_config) {
    if (current_config.toUpperCase() != "default".toUpperCase()) {
      // change config file passed with form.
      $("#vmbackup_settings_file").val("vmbackup/configs/" + current_config + "/user.cfg");
      $("#vmbackup_other_settings_file").val("vmbackup/configs/" + current_config + "/user.cfg");
      $("#vmbackup_danger_zone_file").val("vmbackup/configs/" + current_config + "/user.cfg");
    } else {
      // change config file passed with form.
      $("#vmbackup_settings_file").val("vmbackup/user.cfg");
      $("#vmbackup_other_settings_file").val("vmbackup/user.cfg");
      $("#vmbackup_danger_zone_file").val("vmbackup/user.cfg");
    }
    // append current config to forms.
    $("#vmbackup_settings_form").append('<input type="hidden" name="#arg[2]" value="' + current_config + '">');
    $("#backup_now_form").append('<input type="hidden" name="#args[2]" value="' + current_config + '">');
    $("#upload_form").append('<input type="hidden" name="#current_config" value="' + current_config + '">');
    $("#vmbackup_other_settings").append('<input type="hidden" name="#arg[2]" value="' + current_config + '">');
    $("#vmbackup_danger_zone_form").append('<input type="hidden" name="#arg[2]" value="' + current_config + '">');
  }

  /* assign event handlers to element events. */

  // add custom click function to Settings tab.
  function tab_click_events() {
    $("#tab1").on('click', function (e) {
      // refresh the form.
      if (refresh_settings) {
        $.ajax({
          url: "",
          context: document.body,
          success: function (s, x) {
            $(this).html(s);
          }
        });
        set_variable_cookie("refresh_settings", false);
      }
    });
  }

  // function assigns actions to forms for changes and add click events.
  function assign_functions() {
    // monitor form input changes.
    vmbackup_settings_form_input_change();
    vmbackup_other_settings_form_input_change();
    vmbackup_danger_zone_form_input_change();
    // tab click events.
    tab_click_events();
    // monitor specific Vmbackup1Settings inputs for changes and click events.
    vdisk_extensions_to_skip_change();
    default_vmbackup_settings_click();
    apply_vmbackup_settings_click();
    done_vmbackup_settings_click();
    show_log_click();
    backup_now_click();
    // monitor specific Vmbackup2UploadScripts inputs for changes and click events.
    submit_pre_script_click();
    remove_pre_script_click();
    submit_post_script_click();
    remove_post_script_click();
    // monitor specific VmBackup3OtherSettings inputs for changes and click events.
    default_vmbackup_other_settings_click();
    apply_vmbackup_other_settings_click();
    done_vmbackup_other_settings_click();
    // monitor specific Vmbackup4DangerZone inputs for changes and click events.
    snapshot_extension_change();
    disable_restrictive_regex_change();
    default_vmbackup_danger_zone_click();
    apply_vmbackup_danger_zone_click();
    done_vmbackup_danger_zone_click();
    abort_script_click();
    fix_snapshots_click();
    // monitor specific Vmbackup5ManageConfigs inputs for changes and click events.
    add_config_button_click();
    rename_config_button_click();
    copy_config_button_click();
    remove_configs_button_click();
  }
/** end functions for Vmbackup all pages **/


/** start functions for Vmbackup1Settings **/
  // function to set the label vms_to_backup based on backup_all_vms value.
  function set_vms_to_backup_lbl() {
    if ($("#backup_all_vms").val() == "0") {
      $("label[for=vms_to_backup]").text("List VMs to backup:");
    } else if ($("#backup_all_vms").val() == "1") {
      $("label[for=vms_to_backup]").text("List VMs to exclude:");
    }
  }

  // function executed when frequency control is set.
  function backup_frequency() {
    if ($("#frequency").val() == "disabled") {
      change_attr("#week", "disabled", true);
      change_attr("#month", "disabled", true);
      change_attr("#hour", "disabled", true);
      change_attr("#minute", "disabled", true);
      change_attr("#custom", "disabled", true);
    } else if ($("#frequency").val() == "daily") {
      change_attr("#week", "disabled", true);
      change_attr("#month", "disabled", true);
      change_attr("#hour", "disabled", false);
      change_attr("#minute", "disabled", false);
      change_attr("#custom", "disabled", true);
    } else if ($("#frequency").val() == "weekly") {
      change_attr("#week", "disabled", false);
      change_attr("#month", "disabled", true);
      change_attr("#hour", "disabled", false);
      change_attr("#minute", "disabled", false);
      change_attr("#custom", "disabled", true);
    } else if ($("#frequency").val() == "monthly") {
      change_attr("#week", "disabled", true);
      change_attr("#month", "disabled", false);
      change_attr("#hour", "disabled", false);
      change_attr("#minute", "disabled", false);
      change_attr("#custom", "disabled", true);
    } else if ($("#frequency").val() == "custom") {
      change_attr("#week", "disabled", true);
      change_attr("#month", "disabled", true);
      change_attr("#hour", "disabled", true);
      change_attr("#minute", "disabled", true);
      change_attr("#custom", "disabled", false);
    } else {
      change_attr("#week", "disabled", false);
      change_attr("#month", "disabled", false);
      change_attr("#hour", "disabled", false);
      change_attr("#minute", "disabled", false);
      change_attr("#custom", "disabled", true);
    }
  }

  // function to set the current config.
  function config_changed() {
    var $current_config = $("#current_config").children("option:selected").val();
    set_variable_cookie("current_config", $current_config);
    // reset the form.
    $.ajax({
      url: "",
      context: document.body,
      success: function (s, x) {
        $(this).html(s);
      }
    });
    update_form_config($current_config);
  }

  // add change event handler to vdisk extensions to skip.
  function vdisk_extensions_to_skip_change() {
    $("#vdisk_extensions_to_skip").on('input propertychange paste', function () {
      set_variable_cookie("rebuild_text_files", true);
      set_variable_cookie("refresh_settings", true);
    });
  }

  /* add button click events */
  // add click event handler to default button.
  function default_vmbackup_settings_click() {
    $("#default_vmbackup_settings").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // get button that was clicked so it can be passed with the form later.
      var clicked_button = $(this).attr("name") + "=" + $(this).val();
      // ask if user is certain they want to abort scripts.
      swal({
        title: 'Reset to defaults?',
        text: 'Are you sure you want to reset to defaults?',
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, reset to defaults",
        cancelButtonText: "Cancel",
        closeOnConfirm: true,
        closeOnCancel: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // disable current_config to prevent submission with form.
            change_prop("#current_config", "disabled", true);
            // append input to form submission to force text files to be re-created.
            $("#vmbackup_settings_form").append('<input type="hidden" name="#arg[3]" value="rebuild_text_files">');
            // submit the form with the clicked button appended.
            $.post($("#vmbackup_settings_form").attr("action"), $("#vmbackup_settings_form").serialize() + "&" + clicked_button,
              function () {
                // refresh the form.
                $.ajax({
                  url: "",
                  context: document.body,
                  success: function (s, x) {
                    $(this).html(s);
                  }
                });
                change_prop("#current_config", "disabled", false);
              });
          }
        });
    });
  }

  // add click event handler to apply button.
  function apply_vmbackup_settings_click() {
    $("#apply_vmbackup_settings").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // check to see if the form is invalid.
      if (!$("#vmbackup_settings_form")[0].checkValidity()) {
        return false;
      }
      // let user know the script is not enabled.
      if ($("#enabled").val() == "0") {
        swal({
          title: 'Backups have not been enabled',
          text: 'Set "Enable backups" to "Yes" (and set a schedule), or backups will not run.',
          type: "warning",
          showCancelButton: false,
          closeOnConfirm: true
        });
      }
      // grab the settings from the form and prepare it.
      var vmbackup_settings_form = document.getElementById("vmbackup_settings_form");
      prepare_form(vmbackup_settings_form);
      // disable current_config to prevent submission with form.
      change_prop("#current_config", "disabled", true);
      // check to see if text files should be rebuilt.
      if (rebuild_text_files) {
        // append input to form submission to force text files to be re-created.
        $("#vmbackup_settings_form").append('<input type="hidden" name="#arg[3]" value="rebuild_text_files">');
        set_variable_cookie("rebuild_text_files", false);
      }
      // disable the apply button.
      change_prop("#apply_vmbackup_settings", "disabled", true);
      // submit the form with the clicked button appended.
      $.post($("#vmbackup_settings_form").attr("action"), $("#vmbackup_settings_form").serialize() + "&" + $(this).attr("name") + "=" + $(this).val(),
        function () {
          // check to see if the Settings tab should be refreshed.
          if (refresh_settings) {
            // refresh the form.
            $.ajax({
              url: "",
              context: document.body,
              success: function (s, x) {
                $(this).html(s);
              }
            });
            set_variable_cookie("refresh_settings", false);
          }
          change_prop("#current_config", "disabled", false);
        });
    });
  }

  // add click event handler to done button.
  function done_vmbackup_settings_click() {
    $("#done_vmbackup_settings").click(function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      if ($("#done_vmbackup_settings").val() == "Reset") {
        // reset the form.
        $.ajax({
          url: "",
          context: document.body,
          success: function (s, x) {
            $(this).html(s);
          }
        });
      } else {
        // perform normal done action.
        done();
      }
    });
  }

  // add click event handler to show log button.
  function show_log_click() {
    $("#show_log").click(function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      // open the log in a new window.
      openWindow('/usr/local/emhttp/plugins/vmbackup/runscript.php&arg1=show_log&arg2=' + current_config, 'Backup Log', 800, 1200);
    });
  }

  // add click event handler to backup now button.
  function backup_now_click() {
    $("#backup").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // ask if user is certain they want to backup now.
      swal({
        title: 'Backup now?',
        text: 'Are you sure you want to backup now?',
        type: "info",
        showCancelButton: true,
        confirmButtonText: "Yes, backup now",
        cancelButtonText: "Cancel",
        closeOnConfirm: true,
        closeOnCancel: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // check to see if the form is invalid.
            if (!$("#vmbackup_settings_form")[0].checkValidity()) {
              return false;
            }
            // disable the apply button before form submission to prevent it from being submitted twice.
            change_prop("#apply_vmbackup_settings", "disabled", true);
            // grab the settings from the form and prepare it.
            var vmbackup_settings_form = document.getElementById("vmbackup_settings_form");
            prepare_form(vmbackup_settings_form);
            // check to see if text files should be rebuilt.
            if (rebuild_text_files) {
              // append input to form submission to force text files to be re-created.
              $("#vmbackup_settings_form").append('<input type="hidden" name="#arg[3]" value="rebuild_text_files">');
              set_variable_cookie("rebuild_text_files", false);
            }
            // submit the vmbackup settings form like normal.
            $.post($("#vmbackup_settings_form").attr("action"), $("#vmbackup_settings_form").serialize(),
              function () {
                // submit the second form to actually perform the backup.
                $.post($("#backup_now_form").attr("action"), $("#backup_now_form").serialize(),
                  function () {
                    // check to see if the Settings tab should be refreshed.
                    if (refresh_settings) {
                      // refresh the form.
                      $.ajax({
                        url: "",
                        context: document.body,
                        success: function (s, x) {
                          $(this).html(s);
                        }
                      });
                      set_variable_cookie("refresh_settings", false);
                    }
                  });
              });
          }
        });
    });
  }

  // function to monitor form inputs for changes and set the done button click function.
  function vmbackup_settings_form_input_change() {
    $("#vmbackup_settings_form :input").change(function () {
      $("#done_vmbackup_settings").click(function (e) {
        // prevent normal button actions.
        e.preventDefault();
        e.stopPropagation();
        if ($("#done_vmbackup_settings").val() == "Reset") {
          // reset the form.
          $.ajax({
            url: "",
            context: document.body,
            success: function (s, x) {
              $(this).html(s);
            }
          });
        } else {
          // perform normal done action.
          done();
        }
      });
    });
  }
/** end functions for Vmbackup1Settings **/


/** start functions for Vmbackup2UploadScripts **/
  /* add click events to script buttons*/
  function submit_pre_script_click() {
    $("#submit_pre_script").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // get button that was clicked so it can be passed with the form later.
      var clicked_button = $(this).attr("name") + "=" + $(this).val();
      // ask if user is certain they want to Submit the pre-script.
      swal({
        title: 'Submit pre-script?',
        text: 'Are you sure you want to submit this pre-script?',
        type: "info",
        showCancelButton: true,
        confirmButtonText: "Yes, submit pre-script",
        cancelButtonText: "Cancel",
        closeOnConfirm: false,
        closeOnCancel: true,
        showLoaderOnConfirm: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // submit the form with the clicked button appended.
            $.post($("#upload_form").attr("action"), $("#upload_form").serialize() + "&" + clicked_button,
              function () {
                // refresh the div containing the text area.
                $("#pre_script_div").load(location.href + " #pre_script_div",
                  function () {
                    swal.close();
                  });
              });
          }
        });
    });
  }
  function remove_pre_script_click() {
    $("#remove_pre_script").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // get button that was clicked so it can be passed with the form later.
      var clicked_button = $(this).attr("name") + "=" + $(this).val();
      // ask if user is certain they want to remove the script.
      swal({
        title: 'Remove pre-script?',
        text: 'Are you sure you want to remove the pre-script?',
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, remove pre-script",
        cancelButtonText: "Cancel",
        closeOnConfirm: true,
        closeOnCancel: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // submit the form with the clicked button appended.
            $.post($("#upload_form").attr("action"), $("#upload_form").serialize() + "&" + clicked_button,
              function () {
                // clear textarea.
                $("#pre_script_textarea").html("");
                $("#pre_script_textarea").val("");
              });
          }
        });
    });
  }
  function submit_post_script_click() {
    $("#submit_post_script").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // get button that was clicked so it can be passed with the form later.
      var clicked_button = $(this).attr("name") + "=" + $(this).val();
      // ask if user is certain they want to Submit the post-script.
      swal({
        title: 'Submit post-script?',
        text: 'Are you sure you want to submit this post-script?',
        type: "info",
        showCancelButton: true,
        confirmButtonText: "Yes, submit post-script",
        cancelButtonText: "Cancel",
        closeOnConfirm: false,
        closeOnCancel: true,
        showLoaderOnConfirm: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // submit the form with the clicked button appended.
            $.post($("#upload_form").attr("action"), $("#upload_form").serialize() + "&" + clicked_button,
              function () {
                // refresh the div containing the text area.
                $("#post_script_div").load(location.href + " #post_script_div",
                  function () {
                    swal.close();
                  });
              });
          }
        });
    });
  }
  function remove_post_script_click() {
    $("#remove_post_script").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // get button that was clicked so it can be passed with the form later.
      var clicked_button = $(this).attr("name") + "=" + $(this).val();
      // ask if user is certain they want to remove the script.
      swal({
        title: 'Remove post-script?',
        text: 'Are you sure you want to remove the post-script?',
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, remove post-script",
        cancelButtonText: "Cancel",
        closeOnConfirm: true,
        closeOnCancel: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // submit the form with the clicked button appended.
            $.post($("#upload_form").attr("action"), $("#upload_form").serialize() + "&" + clicked_button,
              function () {
                // clear textarea.
                $("#post_script_textarea").html("");
                $("#post_script_textarea").val("");
              });
          }
        });
    });
  }
/** end functions for Vmbackup2UploadScripts **/


/** start functions for Vmbackup3OtherSettings **/
  // function to monitor form inputs for changes and set the done button click function.
  function vmbackup_other_settings_form_input_change() {
    $("#vmbackup_other_settings_form :input").change(function () {
      $("#done_vmbackup_other_settings").click(function (e) {
        // prevent normal button actions.
        e.preventDefault();
        e.stopPropagation();
        if ($("#done_vmbackup_other_settings").val() == "Reset") {
          // make sure that settings page will be refreshed.
          set_variable_cookie("refresh_settings", true);
          // reset the form.
          $.ajax({
            url: "",
            context: document.body,
            success: function (s, x) {
              $(this).html(s);
            }
          });
        } else {
          // perform normal done action.
          done();
        }
      });
    });
  }

  /* add button click events */
  // add click event handler to default button.
  function default_vmbackup_other_settings_click() {
    $("#default_vmbackup_other_settings").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // get button that was clicked so it can be passed with the form later.
      var clicked_button = $(this).attr("name") + "=" + $(this).val();
      // ask if user is certain they want to abort scripts.
      swal({
        title: 'Reset to defaults?',
        text: 'Are you sure you want to reset to defaults?',
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, reset to defaults",
        cancelButtonText: "Cancel",
        closeOnConfirm: true,
        closeOnCancel: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // submit the form with the clicked button appended.
            $.post($("#vmbackup_other_settings_form").attr("action"), $("#vmbackup_other_settings_form").serialize() + "&" + clicked_button,
              function () {
                // refresh the form.
                $.ajax({
                  url: "",
                  context: document.body,
                  success: function (s, x) {
                    $(this).html(s);
                  }
                });
              });
            set_variable_cookie("refresh_settings", true);
          }
        });
    });
  }

  // add click event handler to apply button.
  function apply_vmbackup_other_settings_click() {
    $("#apply_vmbackup_other_settings").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // check to see if the form is invalid.
      if (!$("#vmbackup_other_settings_form")[0].checkValidity()) {
        return false;
      }
      // grab the settings from the form and prepare it.
      var vmbackup_other_settings_form = document.getElementById("vmbackup_other_settings_form");
      prepare_form(vmbackup_other_settings_form);
      // disable the apply button.
      change_prop("#apply_vmbackup_other_settings", "disabled", true);
      // submit the form with the clicked button appended.
      $.post($("#vmbackup_other_settings_form").attr("action"), $("#vmbackup_other_settings_form").serialize() + "&" + $(this).attr("name") + "=" + $(this).val());
    });
  }

  // add click event handler to done button.
  function done_vmbackup_other_settings_click() {
    $("#done_vmbackup_other_settings").click(function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      if ($("#done_vmbackup_other_settings").val() == "Reset") {
        // make sure that settings page will be refreshed.
        set_variable_cookie("refresh_settings", true);
        // reset the form.
        $.ajax({
          url: "",
          context: document.body,
          success: function (s, x) {
            $(this).html(s);
          }
        });
      } else {
        // perform normal done action.
        done();
      }
    });
  }
/** end functions for Vmbackup3OtherSettings **/


/** start functions for Vmbackup4DangerZone **/
  // function to toggle custom cron regex.
  function toggle_cron_regex() {
    if ($("#disable_cron_regex").val() == "0") {
      change_attr("#custom", "pattern", basic_cron_regex());
    } else if ($("#disable_cron_regex").val() == "1") {
      $("#custom").removeAttr("pattern");
    }
  }

  // function to toggle restrictive regex.
  function toggle_restrictive_regex() {
    if ($("#disable_restrictive_regex").val() == "0") {
      // set backup location drop-down list folder root.
      change_attr("#backup_location", "data-pickroot", "/mnt/user/");
      // add file tree to backup location.
      $("#backup_location").fileTreeAttach();
      // set regex patterns for validation.
      change_attr("#backup_location", "pattern", "^\\/mnt\\/(([\\w.-]+)( [\\w.-]+)*)*(\\/(([\\w.-]+)( [\\w.-]+)*)*)*$");
      change_attr("#number_of_days_to_keep_backups", "pattern", "^(0|([7-9]|[1-8][0-9]|9[0-9]|1[0-7][0-9]|180))$");
      change_attr("#number_of_backups_to_keep", "pattern", "^(0|([2-9]|[1-3][0-9]|40))$");
      change_attr("#number_of_log_files_to_keep", "pattern", "^(0|([1-9]|[1-3][0-9]|40))$");
      change_attr("#number_of_error_log_files_to_keep", "pattern", "^(0|([2-9]|[1-3][0-9]|40))$");
      change_attr("#clean_shutdown_checks", "pattern", "^([5-9]|[1-4][0-9]|50)$");
      change_attr("#seconds_to_wait", "pattern", "^([3-8][0-9]|9[0-9]|[1-5][0-9]{2}|600)$");
    } else if ($("#disable_restrictive_regex").val() == "1") {
      // set backup location drop-down list folder root.
      change_attr("#backup_location", "data-pickroot", "/mnt/");
      // add file tree to backup location.
      $("#backup_location").fileTreeAttach();
      // set regex patterns for validation.
      change_attr("#backup_location", "pattern", "^\\/(([\\w.-]+)( [\\w.-]+)*)*(\\/(([\\w.-]+)( [\\w.-]+)*)*)*$");
      change_attr("#number_of_days_to_keep_backups", "pattern", "^(0|([1-9])+(\\d+)?)$");
      change_attr("#number_of_backups_to_keep", "pattern", "^(0|([1-9])+(\\d+)?)$");
      change_attr("#number_of_log_files_to_keep", "pattern", "^(0|([1-9])+(\\d+)?)$");
      change_attr("#number_of_error_log_files_to_keep", "pattern", "^(0|([1-9])+(\\d+)?)$");
      change_attr("#clean_shutdown_checks", "pattern", "^([1-9])+(\\d+)?$");
      change_attr("#seconds_to_wait", "pattern", "^([1-9])+(\\d+)?$");
    }
  }

  // add change event handler to snapshot extension.
  function snapshot_extension_change() {
    $("#snapshot_extension").on('input propertychange paste', function () {
      set_variable_cookie("rebuild_text_files", true);
      set_variable_cookie("refresh_settings", true);
    });
  }

  // add change event handler to restrictive regex drop-down.
  function disable_restrictive_regex_change() {
    $("#disable_restrictive_regex").change(function () {
      set_variable_cookie("refresh_settings", true);
    });
  }

  /* add button click events */
  // add click event handler to default button.
    function default_vmbackup_danger_zone_click() {
      $("#default_vmbackup_danger_zone").click(function (e) {
        // prevent normal form submission.
        e.preventDefault();
        e.stopPropagation();
        // get button that was clicked so it can be passed with the form later.
        var clicked_button = $(this).attr("name") + "=" + $(this).val();
        // ask if user is certain they want to abort scripts.
        swal({
          title: 'Reset to defaults?',
          text: 'Are you sure you want to reset to defaults?',
          type: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, reset to defaults",
          cancelButtonText: "Cancel",
          closeOnConfirm: true,
          closeOnCancel: true
        },
          function (isConfirm) {
            if (isConfirm) {
              // submit the form with the clicked button appended.
              $.post($("#vmbackup_danger_zone_form").attr("action"), $("#vmbackup_danger_zone_form").serialize() + "&" + clicked_button,
                function () {
                  // refresh the form.
                  $.ajax({
                    url: "",
                    context: document.body,
                    success: function (s, x) {
                      $(this).html(s);
                    }
                  });
                });
              set_variable_cookie("refresh_settings", true);
            }
          });
      });
    }

  // add click event handler to apply button.
  function apply_vmbackup_danger_zone_click() {
    $("#apply_vmbackup_danger_zone").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // check to see if the form is invalid.
      if (!$("#vmbackup_danger_zone_form")[0].checkValidity()) {
        return false;
      }
      // grab the settings from the form and prepare it.
      var vmbackup_danger_zone_form = document.getElementById("vmbackup_danger_zone_form");
      prepare_form(vmbackup_danger_zone_form);
      // check to see if text files should be rebuilt.
      if (rebuild_text_files) {
        // append input to form submission to force text files to be re-created.
        $("#apply_vmbackup_danger_zone").append('<input type="hidden" name="#arg[3]" value="rebuild_text_files">');
        set_variable_cookie("rebuild_text_files", false);
      }
      // disable the apply button.
      change_prop("#apply_vmbackup_danger_zone", "disabled", true);
      // submit the form with the clicked button appended.
      $.post($("#vmbackup_danger_zone_form").attr("action"), $("#vmbackup_danger_zone_form").serialize() + "&" + $(this).attr("name") + "=" + $(this).val());
    });
  }

  // add click event handler to done button.
  function done_vmbackup_danger_zone_click(){
    $("#done_vmbackup_danger_zone").click(function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      if ($("#done_vmbackup_danger_zone").val() == "Reset") {
        // make sure that settings page will be refreshed.
        set_variable_cookie("refresh_settings", true);
        // reset the form.
        $.ajax({
          url: "",
          context: document.body,
          success: function (s, x) {
            $(this).html(s);
          }
        });
      } else {
        // perform normal done action.
        done();
      }
    });
  }

  // add click event handler to abort script button.
  function abort_script_click() {
    $("#abort_script").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // ask if user is certain they want to abort scripts.
      swal({
        title: 'Abort all running VM Backup scripts?',
        text: 'Are you sure you want to abort any running scripts? This could cause more issues than it prevents. Proceed with caution!',
        type: "error",
        showCancelButton: true,
        confirmButtonText: "Yes, abort scripts",
        cancelButtonText: "Cancel",
        closeOnConfirm: true,
        closeOnCancel: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // submit the abort script form.
            $.post($("#abort_script_form").attr("action"), $("#abort_script_form").serialize());
          }
        });
    });
  }

  // add click event handler to fix snapshots button.
  function fix_snapshots_click() {
    $("#fix_snapshots").click(function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // ask if user is certain they want to fix snapshots.
      swal({
        title: 'Fix stuck snapshots?',
        text: 'Are you sure you want to fix stuck snapshots? This could cause more issues than it fixes. Run with care!',
        type: "error",
        showCancelButton: true,
        confirmButtonText: "Yes, fix snapshots",
        cancelButtonText: "Cancel",
        closeOnConfirm: true,
        closeOnCancel: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // submit the fix snapshots script form.
            $.post($("#fix_snapshots_form").attr("action"), $("#fix_snapshots_form").serialize());
          }
        });
    });
  }

  // function to monitor form inputs for changes and set the done button click function.
  function vmbackup_danger_zone_form_input_change() {
    $("#vmbackup_danger_zone_form :input").change(function () {
      $("#done_vmbackup_danger_zone").click(function (e) {
        // prevent normal button actions.
        e.preventDefault();
        e.stopPropagation();
        if ($("#done_vmbackup_danger_zone").val() == "Reset") {
          // make sure that settings page will be refreshed.
          set_variable_cookie("refresh_settings", true);
          // reset the form.
          $.ajax({
            url: "",
            context: document.body,
            success: function (s, x) {
              $(this).html(s);
            }
          });
        } else {
          // perform normal done action.
          done();
        }
      });
    });
  }
/** end functions for Vmbackup4DangerZone **/


/** start functions for Vmbackup5ManageConfigs **/
  /* add click event handlers for config management buttons. */
  function add_config_button_click() {
    $("#add_config_button").click(function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      // check to see if the form is invalid.
      if (!$("#manage_configs_form")[0].checkValidity()) {
        return false;
      }
      // get list of configs.
      $configs = $("#select_configs_div input");
      // get the configs as an array.
      var configs_array = $configs.map(function () {
        return $(this).parent().find('a:first').html();
      }).get();
      // create config_exists variable and assume the new config does not exist already.
      var config_exists = false;
      // make sure that the new config does not already exist.
      configs_array.forEach(config => {
        if ($("#add_config").val().toUpperCase() == config.toUpperCase()) {
          config_exists = true;
        }
      });
      // if new config was found in existing configs, then abort.
      if (config_exists) {
        swal({
          title: 'Config already exists',
          text: 'This config already exits. Please choose a different name and try again.',
          type: "warning",
          showCancelButton: false,
          closeOnConfirm: true
        });
        return false;
      }
      // verify that the text field isn't blank before submitting the form.
      if (!$("#add_config").val() == "") {
        // submit the form with the clicked button appended.
        $.post($("#manage_configs_form").attr("action"), $("#manage_configs_form").serialize() + "&" + $(this).attr("name") + "=" + $(this).val(),
          function () {
            // clear textbox.
            $("#add_config").val("");
            // refresh the div containing the text area.
            $("#select_configs_div").load(location.href + " #select_configs_div",
              function () {
                // re-build config selection after refresh.
                $("#select_configs_div").fileTree({
                  root: "/boot/config/plugins/vmbackup/configs/",
                  multiSelect: true,
                  filter: "HIDE_FILES_FILTER",
                  folderEvent: "nothing"
                });
              });
          });
      } else {
        swal({
          title: 'Config name is blank',
          text: 'The config name cannot be blank. Please choose a name and try again.',
          type: "warning",
          showCancelButton: false,
          closeOnConfirm: true
        });
      }
    });
  }

  function rename_config_button_click() {
    $("#rename_config_button").click(function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      // get info for the button that was clicked so it can be passed with the form later.
      var clicked_button_name = $(this).attr("name");
      var clicked_button_value = $(this).val();
      // make sure that only one config has been selected and if so, rename it.
      $selected_configs = $("#select_configs_div input:checked");
      if ($selected_configs.length === 0) {
        swal({
          title: 'No config selected',
          text: 'Please select exactly one config to rename.',
          type: "info",
          showCancelButton: false,
          closeOnConfirm: true
        });
      } else if ($selected_configs.length === 1) {
        // get the selected config as an array.
        var selected_configs_array = $selected_configs.map(function () {
          // use this to get the full path instead: $(this).parent().find('a:first').attr("rel");
          // return config name.
          return $(this).parent().find('a:first').html();
        }).get();
        // ask the user what they would like the new config name to be.
        swal({
          title: 'Choose new name',
          text: 'Please choose a new name for ' + selected_configs_array[0] + '.',
          type: "input",
          showCancelButton: true,
          closeOnConfirm: false,
          inputValue: selected_configs_array[0]
        },
          function (inputValue) {
            if (inputValue === false) {
              return false;
            } else if (inputValue.trim() === "") {
              swal.showInputError("The new name cannot be blank.");
              return false;
            }
            // get list of configs.
            $configs = $("#select_configs_div input");
            // get the configs as an array.
            var configs_array = $configs.map(function () {
              return $(this).parent().find('a:first').html();
            }).get();
            // create config_exists variable and assume the new config does not exist already.
            var config_exists = false;
            // make sure that the new config does not already exist.
            configs_array.forEach(config => {
              if (String(inputValue).trim().toUpperCase() == config.toUpperCase()) {
                config_exists = true;
              }
            });
            // if new config was found in existing configs, then abort.
            if (config_exists) {
              swal.showInputError("The config name already exists.");
              return false;
            }
            // create a regular expression variable to use for validation.
            var name_regex = /^[^\/\. ](([\w.-]+)( [\w.-]+)*)+$/
            if (name_regex.test(inputValue.trim())) {
              var new_config_name = inputValue.trim();
              // get the serialized form data.
              var config_form_data = $("#manage_configs_form").serialize();
              // append the new config name to the form data.
              config_form_data += serialize_string("new_config_name", new_config_name);
              // append the array of selected configs to the form data.
              config_form_data += serialize_string("selected_configs", JSON.stringify(selected_configs_array));
              // append the clicked button the the form data.
              config_form_data += serialize_string(clicked_button_name, clicked_button_value);
              // submit the form data.
              $.post($("#manage_configs_form").attr("action"), config_form_data,
                function () {
                  // refresh the div containing the text area.
                  $("#select_configs_div").load(location.href + " #select_configs_div",
                    function () {
                      // re-build config selection after refresh.
                      $("#select_configs_div").fileTree({
                        root: "/boot/config/plugins/vmbackup/configs/",
                        multiSelect: true,
                        filter: "HIDE_FILES_FILTER",
                        folderEvent: "nothing"
                      });
                      swal.close();
                    });
                });
            } else {
              swal.showInputError("Please type a valid name.");
              return false;
            }
          });
      } else {
        swal({
          title: 'Too many configs selected',
          text: 'Please select exactly one config to rename.',
          type: "info",
          showCancelButton: false,
          closeOnConfirm: true
        });
      }
    });
  }

  function copy_config_button_click() {
    $("#copy_config_button").click(function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      // get info for the button that was clicked so it can be passed with the form later.
      var clicked_button_name = $(this).attr("name");
      var clicked_button_value = $(this).val();
      // make sure that only one config has been selected and if so, copy it.
      $selected_configs = $("#select_configs_div input:checked");
      if ($selected_configs.length === 0) {
        swal({
          title: 'No config selected',
          text: 'Please select exactly one config to copy.',
          type: "info",
          showCancelButton: false,
          closeOnConfirm: true
        });
      } else if ($selected_configs.length === 1) {
        var selected_configs_array = $selected_configs.map(function () {
          // return config name.
          return $(this).parent().find('a:first').html();
        }).get();
        // ask the user what they would like the new config name to be.
        swal({
          title: 'Choose name for copy',
          text: 'Please choose a new name for the copy of ' + selected_configs_array[0] + '.',
          type: "input",
          showCancelButton: true,
          closeOnConfirm: false,
          inputValue: selected_configs_array[0]
        },
          function (inputValue) {
            if (inputValue === false) {
              return false;
            } else if (inputValue.trim() === "") {
              swal.showInputError("The new name cannot be blank.");
              return false;
            }
            // get list of configs.
            $configs = $("#select_configs_div input");
            // get the configs as an array.
            var configs_array = $configs.map(function () {
              return $(this).parent().find('a:first').html();
            }).get();
            // create config_exists variable and assume the new config does not exist already.
            var config_exists = false;
            // make sure that the new config does not already exist.
            configs_array.forEach(config => {
              if (String(inputValue).trim().toUpperCase() == config.toUpperCase()) {
                config_exists = true;
              }
            });
            // if new config was found in existing configs, then abort.
            if (config_exists) {
              swal.showInputError("The config name already exists.");
              return false;
            }
            // create a regular expression variable to use for validation.
            var name_regex = /^[^\/\. ](([\w.-]+)( [\w.-]+)*)+$/
            if (name_regex.test(inputValue.trim())) {
              var copy_config_name = inputValue.trim();
              // get the serialized form data.
              var config_form_data = $("#manage_configs_form").serialize();
              // append the new config name to the form data.
              config_form_data += serialize_string("copy_config_name", copy_config_name);
              // append the array of selected configs to the form data.
              config_form_data += serialize_string("selected_configs", JSON.stringify(selected_configs_array));
              // append the clicked button to the form data.
              config_form_data += serialize_string(clicked_button_name, clicked_button_value);
              // submit the form data.
              $.post($("#manage_configs_form").attr("action"), config_form_data,
                function () {
                  // refresh the div containing the text area.
                  $("#select_configs_div").load(location.href + " #select_configs_div",
                    function () {
                      // re-build config selection after refresh.
                      $("#select_configs_div").fileTree({
                        root: "/boot/config/plugins/vmbackup/configs/",
                        multiSelect: true,
                        filter: "HIDE_FILES_FILTER",
                        folderEvent: "nothing"
                      });
                      swal.close();
                    });
                });
            } else {
              swal.showInputError("Please type a valid name.");
              return false;
            }
          });
      } else {
        swal({
          title: 'Too many configs selected',
          text: 'Please select exactly one config to copy.',
          type: "info",
          showCancelButton: false,
          closeOnConfirm: true
        });
      }
    });
  }

  function remove_configs_button_click() {
    $("#remove_configs_button").click(function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      // get info for the button that was clicked so it can be passed with the form later.
      var clicked_button_name = $(this).attr("name");
      var clicked_button_value = $(this).val();
      // make sure that at least one config has been selected.
      $selected_configs = $("#select_configs_div input:checked");
      if ($selected_configs.length === 0) {
        swal({
          title: 'No config selected',
          text: 'Please select at least one config to remove.',
          type: "info",
          showCancelButton: false,
          closeOnConfirm: true
        });
      } else {
        // ask if user is certain they want to remove the script.
        swal({
          title: 'Remove the configs?',
          text: 'Are you sure you want to remove the selected configs?',
          type: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, remove configs",
          cancelButtonText: "Cancel",
          closeOnConfirm: true,
          closeOnCancel: true
        },
          function (isConfirm) {
            if (isConfirm) {
              var selected_configs_array = $selected_configs.map(function () {
                // return config name.
                return $(this).parent().find('a:first').html();
              }).get();
              // see if one of the configs to be removed is the current config.
              selected_configs_array.forEach(config => {
                if (config.toUpperCase() == current_config.toUpperCase()) {
                  is_current_config = true;
                }
              });
              // get the serialized form data.
              var config_form_data = $("#manage_configs_form").serialize();
              // append the array of selected configs to the form data.
              config_form_data += serialize_string("selected_configs", JSON.stringify(selected_configs_array));
              // append the clicked button to the form data.
              config_form_data += serialize_string(clicked_button_name, clicked_button_value);
              // submit the form data.
              $.post($("#manage_configs_form").attr("action"), config_form_data,
                function () {
                  // refresh the div containing the text area.
                  $("#select_configs_div").load(location.href + " #select_configs_div",
                    function () {
                      // re-build config selection after refresh.
                      $("#select_configs_div").fileTree({
                        root: "/boot/config/plugins/vmbackup/configs/",
                        multiSelect: true,
                        filter: "HIDE_FILES_FILTER",
                        folderEvent: "nothing"
                      });
                    });
                    // if current config was removed, change to default config.
                  if (is_current_config) {
                    $("#current_config").children("option:selected").val("default");
                    config_changed();
                  }
                });
            }
          });
      }
    });
  }
/** end functions for Vmbackup5ManageConfigs **/
