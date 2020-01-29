
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

  // set the disabled state for compression drop downs.
  function set_compression_drop_down_states() {
    if ($("#pigz_compress").val() == "0") {
      change_prop("#pigz_level", "disabled", true);
      change_prop("#pigz_threads", "disabled", true);
    } else {
      change_prop("#pigz_level", "disabled", false);
      change_prop("#pigz_threads", "disabled", false);
    }
    if ($("#inline_zstd_compress").val() == "0") {
      change_prop("#zstd_level", "disabled", true);
      change_prop("#zstd_threads", "disabled", true);
    } else {
      change_prop("#zstd_level", "disabled", false);
      change_prop("#zstd_threads", "disabled", false);
    }
  }

  // function to set all the config drop-down values based on the passed config.
  function set_current_config_values(config) {
    $("#current_config_settings").val(config);
    $("#current_config_upload_scripts").val(config);
    $("#current_config_other_settings").val(config);
    $("#current_config_danger_zone").val(config);
    $("#current_config_manage_configs").val(config);
  }

  // function to update form inputs based on current config.
  function update_form_config(config) {
    if (config.trim().length === 0) {
      config = get_cookie("current_config");
    }
    if (config.toUpperCase() != "default".toUpperCase()) {
      // change config file passed with form.
      $("#vmbackup_settings_file").val("vmbackup/configs/" + config + "/user.cfg");
      $("#vmbackup_other_settings_file").val("vmbackup/configs/" + config + "/user.cfg");
      $("#vmbackup_danger_zone_file").val("vmbackup/configs/" + config + "/user.cfg");
    } else {
      // change config file passed with form.
      $("#vmbackup_settings_file").val("vmbackup/user.cfg");
      $("#vmbackup_other_settings_file").val("vmbackup/user.cfg");
      $("#vmbackup_danger_zone_file").val("vmbackup/user.cfg");
    }
    // append current config to forms.
    $("#vmbackup_settings_form").append('<input type="hidden" name="#arg[2]" value="' + config + '">');
    $("#backup_now_form").append('<input type="hidden" name="#args[2]" value="' + config + '">');
    $("#upload_form").append('<input type="hidden" name="#current_config" value="' + config + '">');
    $("#vmbackup_other_settings_form").append('<input type="hidden" name="#arg[2]" value="' + config + '">');
    $("#vmbackup_danger_zone_form").append('<input type="hidden" name="#arg[2]" value="' + config + '">');
  }

  // function to set the current config.
  function config_changed(config, show_swal = false) {
    if (show_swal) {
      swal({
        title: 'Changing configs...',
        type: "info",
        showCancelButton: false,
        showConfirmButton: false,
        allowOutsideClick: false
      });
    }
    set_variable_cookie("current_config", config);
    // refresh page content.
    refresh_data_tabs(false, true);
    // refresh settings tab a second time to make sure that file tree is updated correctly.
    refresh_vmbackup_settings(false, true);
    // update form inputs based on current config.
    set_variable_cookie("refresh_settings", true);
    if (show_swal) {
      setTimeout(function () { swal.close(); }, 1000);
    }
  }

  // set the change event for current_config.
  function current_config_change() {
    current_config_settings_change();
    current_config_upload_scripts_change(); 
    current_config_other_settings_change();
    current_config_danger_zone_change();
    current_config_manage_configs_change();
  }

  // function to set the width of the first grid columns based on content.
  function set_width() {
    set_width_vmbackup_settings(false);
    set_width_vmbackup_upload_scripts(false);
    set_width_vmbackup_other_settings(false);
    set_width_vmbackup_danger_zone(false);
    set_width_vmbackup_manage_configs(false);
    set_width_configs();
  }

  // function to set the width of all the config drop downs based on their content.
  function set_width_configs() {
    // var widths = [];
    // widths.push($("#current_config_settings_div .input_description").width());
    // widths.push($("#current_config_upload_scripts_div .input_description").width());
    // widths.push($("#current_config_other_settings_div .input_description").width());
    // widths.push($("#current_config_danger_zone_div .input_description").width());
    // widths.push($("#current_config_manage_configs_div .input_description").width());

    // get the largest width from the array.
    // var max_width = Math.max.apply(null, widths);
    // var max_width = $("#current_config_settings_div .input_description").width();
    // console.log("config width", max_width);

    // set each element to the max width using the supplied selector.
    $("#current_config_settings_div .input_description").css({ "width": 0 });
    $("#current_config_upload_scripts_div .input_description").css({ "width": 0 });
    $("#current_config_other_settings_div .input_description").css({ "width": 0 });
    $("#current_config_danger_zone_div .input_description").css({ "width": 0 });
    $("#current_config_manage_configs_div .input_description").css({ "width": 0 });
  }

  /* assign event handlers to element events. */

  // add custom click function to Settings tab.
  function tab_click_events() {
    $("#tab1").on('click', function () {
      set_width_vmbackup_settings();
      // refresh the form.
      if (refresh_settings) {
        refresh_vmbackup_settings(false, true);
        // $.ajax({
        //   url: "",
        //   context: document.body,
        //   success: function (s, x) {
        //     $(this).html(s);
        //   }
        // });
      }
    });
    // add custom click function to Other Settings tab.
    $("#tab3").on('click', function () {
      set_compression_drop_down_states();
      set_width_vmbackup_other_settings();
    });
    // add custom click function Danger Zone tab.
    $("#tab4").on('click', function () {
      set_compression_drop_down_states();
      set_width_vmbackup_danger_zone();
    });
  }

  // function to refresh all data tabs.
  function refresh_data_tabs(attach_file_tree = false, update_current_config = false) {
    // update_current_config_var();
    refresh_vmbackup_upload_scripts(update_current_config);
    refresh_vmbackup_other_settings(update_current_config);
    refresh_vmbackup_danger_zone(update_current_config);
    refresh_vmbackup_settings(attach_file_tree, update_current_config);
    update_current_config_var();
    // update form inputs based on current config.
    update_form_config(current_config);
  }

  // update the config based on the cookie.
  function update_current_config_var(config = null) {
    if (config) {
      set_current_config_values(config);
    } else {
      current_config = get_cookie("current_config");
      set_current_config_values(current_config);
    }
  }

  // function to hide/show inline help.
  function toggle_inline_help() {
    toggle_inline_help_vmbackup_settings();
    toggle_inline_help_vmbackup_upload_scripts();
    toggle_inline_help_vmbackup_other_settings();
    toggle_inline_help_vmbackup_danger_zone();
    toggle_inline_help_vmbackup_manage_configs();
  }

  // function assigns actions to forms for changes and add click events.
  function assign_functions() {
    // monitor form input changes.
    vmbackup_settings_form_input_change();
    vmbackup_other_settings_form_input_change();
    vmbackup_danger_zone_form_input_change();
    // handle compression type changes.
    compression_type_change();
    // handle current config changes.
    current_config_change();
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
    save_pre_script_click();
    remove_pre_script_click();
    save_post_script_click();
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
      $("label[name=vms_to_backup_label]").text("List VMs to backup:");
    } else if ($("#backup_all_vms").val() == "1") {
      $("label[name=vms_to_backup_label]").text("List VMs to exclude:");
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

  // set the change event for compression types.
  function compression_type_change() {
    $("#inline_zstd_compress").on("change", function () {
      if ($("#inline_zstd_compress").val() == "1") {
        $("#pigz_compress").val("0");
      }
      set_compression_drop_down_states();
    });
    $("#pigz_compress").on("change", function () {
      if ($("#pigz_compress").val() == "1") {
        $("#inline_zstd_compress").val("0");
      }
      set_compression_drop_down_states();
    });
  }

  // set the change event for current_config.
  function current_config_settings_change() {
    $("#current_config_settings").on("change", function(e) {
      e.preventDefault();
      e.stopPropagation();
      var config = $("#current_config_settings").children("option:selected").val();
      config_changed(config, true);
    });
  }

  // set the width of the first grid column based on content.
  function set_width_vmbackup_settings(set_config_width = true) {
    // get an array of all element widths using the supplied selector.
    var widths = $("#vmbackup_settings_div .input_description").map(function () {
      return $(this).width();
    }).get();

    // get the largest width from the array.
    var max_width = Math.max.apply(null, widths);

    // set each element to the max width using the supplied selector.
    $("#vmbackup_settings_div .input_description").css({ "width": max_width });

    // set config dropdown width for consistency.
    if (set_config_width) {
      set_width_configs();
    }
  }

  // function to hide/show inline help.
  function toggle_inline_help_vmbackup_settings() {
    $('#vmbackup_settings_div').off('click', '#current_config_settings_div .input_description');
    $('#vmbackup_settings_div').on('click', '#current_config_settings_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
    $('#vmbackup_settings_div').off('click', '#basic_settings_div .input_description');
    $('#vmbackup_settings_div').on('click', '#basic_settings_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
    $('#vmbackup_settings_div').off('click', '#schedule_div .input_description');
    $('#vmbackup_settings_div').on('click', '#schedule_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
    $('#vmbackup_settings_div').off('click', '#advanced_settings .input_description');
    $('#vmbackup_settings_div').on('click', '#advanced_settings .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
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
    $("#default_vmbackup_settings").on("click", function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // ask if user is certain they want to abort scripts.
      swal({
        title: 'Reset to defaults?',
        text: 'Are you sure you want to reset to defaults?',
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, reset to defaults",
        cancelButtonText: "Cancel",
        closeOnConfirm: false,
        closeOnCancel: true,
        showLoaderOnConfirm: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // reset to defaults.
            $.ajax({
              url: '/plugins/vmbackup/include/functions.php',
              type: 'POST',
              data: {
                "#set_config_defaults": "set_config_defaults",
                "#current_config": current_config
              }
            }).done(function () {
              // build data object.
              if (current_config == "default") {
                var data = { "#script": "/usr/local/emhttp/plugins/vmbackup/scripts/commands.sh", "#args[1]": "create_vm_lists", "#args[2]": "rebuild_text_files" };
              } else {
                var data = { "#script": "/usr/local/emhttp/plugins/vmbackup/scripts/commands.sh", "#args[1]": "create_vm_lists" };
              }
              // rebuild text files.
              $.ajax({
                url: '/plugins/vmbackup/include/functions.php',
                type: 'POST',
                data: data
              }).done(function () {
                // refresh all tabs.
                refresh_data_tabs(false);
                // refresh settings tab a second time to make sure that file tree is updated correctly.
                refresh_vmbackup_settings(false, false);
                swal.close();
              });
            });
          }
        });
    });
  }

  // add click event handler to apply button.
  function apply_vmbackup_settings_click() {
    $("#apply_vmbackup_settings").on('click', function (e) {
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
      // disable the apply button.
      change_prop("#apply_vmbackup_settings", "disabled", true);
      // grab the settings from the form and prepare it.
      var vmbackup_settings_form = document.getElementById("vmbackup_settings_form");
      prepare_form(vmbackup_settings_form);
      // disable current_config to prevent submission with form.
      change_prop("#current_config_settings", "disabled", true);
      // check to see if text files should be rebuilt.
      if (rebuild_text_files) {
        // append input to form submission to force text files to be re-created.
        $("#vmbackup_settings_form").append('<input type="hidden" name="#arg[3]" value="rebuild_text_files">');
        set_variable_cookie("rebuild_text_files", false);
      }
      // submit the form with the clicked button appended.
      $.post($("#vmbackup_settings_form").attr("action"), $("#vmbackup_settings_form").serialize() + "&" + $(this).attr("name") + "=" + $(this).val(),
        function () {
          // check to see if the Settings tab should be refreshed.
          if (refresh_settings) {
            // refresh settings.
            refresh_vmbackup_settings(false, true);
          }
          // make sure done button value is done.
          $("#done_vmbackup_settings").val("Done");
          // re-enable the current config drop-down.
          change_prop("#current_config_settings", "disabled", false);
        });
    });
  }

  // add click event handler to done button.
  function done_vmbackup_settings_click() {
    $("#done_vmbackup_settings").on("click", function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      if ($("#done_vmbackup_settings").val() == "Reset") {
        // refresh the form.
        refresh_vmbackup_settings(false, true);
        // set the disabled state for compression drop downs.
        set_compression_drop_down_states();
      } else {
        // perform normal done action.
        done();
      }
    });
  }

  // add click event handler to show log button.
  function show_log_click() {
    $("#show_log").on("click", function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      // open the log in a new window.
      openWindow('/usr/local/emhttp/plugins/vmbackup/runscript.php&arg1=show_log&arg2=' + current_config, 'Backup Log', 800, 1200);
    });
  }

  // add click event handler to backup now button.
  function backup_now_click() {
    $("#backup").on("click", function (e) {
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
        closeOnConfirm: false,
        closeOnCancel: true,
        showLoaderOnConfirm: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // check to see if the form is invalid.
            if (!$("#vmbackup_settings_form")[0].checkValidity()) {
              swal.close();
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
                $.post($("#backup_now_form").attr("action"), $("#backup_now_form").serialize());
                // check to see if the Settings tab should be refreshed.
                if (refresh_settings) {
                  refresh_vmbackup_settings(false, true);
                  set_variable_cookie("refresh_settings", false);
                }
                // make sure done button value is done.
                $("#done_vmbackup_settings").val("Done");
                setTimeout(function () { swal.close(); }, 1000);
              });
          }
        });
    });
  }

  // function to monitor form inputs for changes and set the done button click function.
  function vmbackup_settings_form_input_change() {
    // remove any existing change event handlers for inputs.
    $("#vmbackup_settings_div :input").off("change");
    // add new change event handlers for inputs.
    $("#vmbackup_settings_div :input").on("change", function () {
      // check to see if the element is current_config.
      if ($(this).attr("id") == "current_config_settings") {
        // if so, disable the apply button.
        change_prop("#apply_vmbackup_settings", "disabled", true);
      } else {
        // if not, remove the disabled attribute.
        $("#apply_vmbackup_settings").removeAttr("disabled");
        // use the property value to set the apply button as not disabled.
        change_prop("#apply_vmbackup_settings", "disabled", false);
        // change the value of the done button to "Reset".
        $("#done_vmbackup_settings").val("Reset");
      }

      // remove any existing click events from the done button.
      $("#done_vmbackup_settings").off("click");
      // add a click event to the done button.
      $("#done_vmbackup_settings").on("click", function (e) {
        // prevent normal button actions.
        e.preventDefault();
        e.stopPropagation();
        // check if the button value is Reset.
        if ($("#done_vmbackup_settings").val() == "Reset") {
          // if so, refresh the form.
          refresh_vmbackup_settings(false, true);
        } else {
          // perform normal done action.
          done();
        }
      });
    });
  }

  //configure page elements.
  function configure_set_backup_location(attach_file_tree = true) {
    // set validation message, as well as a custom error message.
    add_validation_events('backup_location', 'Path must be located in /mnt/, or disable restrictive validation. Cannot be blank.');
    if ($("#disable_restrictive_regex").val() == "0") {
      // set backup location drop-down list folder root.
      change_attr("#backup_location", "data-pickroot", "/mnt/user/");
      // add file tree to backup location.
      if (attach_file_tree) {
        $("#backup_location").fileTreeAttach();
      }
      // set regex patterns for validation.
      change_attr("#backup_location", "pattern", "^\\/mnt\\/(([\\w.-]+)( [\\w.-]+)*)*(\\/(([\\w.-]+)( [\\w.-]+)*)*)*$");
    } else if ($("#disable_restrictive_regex").val() == "1") {
      // set backup location drop-down list folder root.
      change_attr("#backup_location", "data-pickroot", "/mnt/");
      // add file tree to backup location.
      if (attach_file_tree) {
        $("#backup_location").fileTreeAttach();
      }
      // set regex patterns for validation.
      change_attr("#backup_location", "pattern", "^\\/(([\\w.-]+)( [\\w.-]+)*)*(\\/(([\\w.-]+)( [\\w.-]+)*)*)*$");
    }
  }

  function configure_vms_to_backup() {
    $("#vms_to_backup").dropdownchecklist({ emptyText: 'None', width: 166, explicitClose: '...close' });
  }

  function configure_vdisks_to_skip() {
    $("#vdisks_to_skip").dropdownchecklist({ emptyText: 'None', width: 166, explicitClose: '...close' });
  }

  // rebuild the current_config dropdown lists.
  function rebuild_current_configs(new_config, old_config, use_new_config = false, element_id = "all") {
    // get the currently selected config.
    var selected_config = get_cookie("current_config");

    // append the new config to the element.
    if (new_config.length > 0) {
      append_new_config(element_id, new_config);
    }

    // remove the old config from the element.
    if (old_config.length > 0) {
      // if the config about to be removed is the currently selected config, change to default.
      if (old_config == selected_config) {
        selected_config = "default";
      }
      remove_old_config(element_id, old_config);
    }

    // remove the default value from the element.
    remove_old_config(element_id, "default");

    // sort the configs.
    sort_configs(element_id);

    // select the current config.
    if (use_new_config) {
      // if we should be using the new config, then select that.
      update_current_config_var(selected_config);
    } else {
      // otherwise, re-select the current config.
      update_current_config_var(selected_config);
    }
  }

  function append_new_config(element_id, new_config) {
    if (element_id != "all") {
      $('#' + element_id).append('<option value="' + new_config + '">' + new_config + '</option>');
    } else if (element_id == "all") {
      $('#current_config_settings').append('<option value="' + new_config + '">' + new_config + '</option>');
      $('#current_config_upload_scripts').append('<option value="' + new_config + '">' + new_config + '</option>');
      $('#current_config_other_settings').append('<option value="' + new_config + '">' + new_config + '</option>');
      $('#current_config_danger_zone').append('<option value="' + new_config + '">' + new_config + '</option>');
      $('#current_config_manage_configs').append('<option value="' + new_config + '">' + new_config + '</option>');
    }
  }

  function remove_old_config(element_id, old_config) {
    if (element_id != "all") {
      $("#" + element_id + " option[value='" + old_config + "']").remove();
    } else if (element_id == "all") {
      $("#current_config_settings option[value='" + old_config + "']").remove();
      $("#current_config_upload_scripts option[value='" + old_config + "']").remove();
      $("#current_config_other_settings option[value='" + old_config + "']").remove();
      $("#current_config_danger_zone option[value='" + old_config + "']").remove();
      $("#current_config_manage_configs option[value='" + old_config + "']").remove();
    }
  }

  function sort_configs(element_id) {
    if (element_id != "all") {
      // get the current config element.
      var current_config_select = $('#' + element_id);
      // remove the default value from the element.
      remove_old_config(element_id, "default");
      // get a list of the remaining configs.
      var configs_list = current_config_select.find('option');
      // sort the list of configs alphabetically.
      configs_list.sort(function (a, b) { return $(a).text().toUpperCase() > $(b).text().toUpperCase() ? 1 : -1; });
      // clear the array and append the default value.
      current_config_select.empty().append('<option value="default">default</option>');
      // append the sorted configs.
      current_config_select.append(configs_list);
    } else if (element_id == "all") {
      sort_configs("current_config_settings");
      sort_configs("current_config_upload_scripts");
      sort_configs("current_config_other_settings");
      sort_configs("current_config_danger_zone");
      sort_configs("current_config_manage_configs");
    }
  }

  /* functions to refresh page elements */
  // refresh current config drop down.
  function refresh_current_config_div() {
    $("#current_config_settings_div").load(location.href + " #current_config_settings_div");
  }

  // function to refresh content for settings tab.
  function refresh_vmbackup_settings(attach_file_tree = true, update_current_config = true){
    $("#vmbackup_settings_div").load(location.href + " #vmbackup_settings_div",
      function () {
        if (update_current_config) {
          update_current_config_var();
        }
        configure_set_backup_location(attach_file_tree);
        configure_vms_to_backup();
        configure_vdisks_to_skip();
        toggle_cron_regex();
        toggle_restrictive_regex();
        set_validation();
        backup_frequency();
        set_vms_to_backup_lbl();
        assign_vmbackup_settings_functions();
        set_width_vmbackup_settings();
        // update form inputs based on current config.
        update_form_config(current_config);
      });
    // set refresh settings to false since it was just performed.
    set_variable_cookie("refresh_settings", false);
  }

  // function assigns actions to vmbackup settings form for changes and add click events.
  function assign_vmbackup_settings_functions() {
    // monitor form input changes.
    vmbackup_settings_form_input_change();
    compression_type_change();
    current_config_settings_change();
    // monitor specific Vmbackup1Settings inputs for changes and click events.
    vdisk_extensions_to_skip_change();
    default_vmbackup_settings_click();
    apply_vmbackup_settings_click();
    done_vmbackup_settings_click();
    show_log_click();
    backup_now_click();
  }
/** end functions for Vmbackup1Settings **/


/** start functions for Vmbackup2UploadScripts **/

  // set the change event for current_config.
  function current_config_upload_scripts_change() {
    $("#current_config_upload_scripts").on("change", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var config = $("#current_config_upload_scripts").children("option:selected").val();
      config_changed(config, true);
    });
  }

  // set the width of the first grid column based on content.
  function set_width_vmbackup_upload_scripts(set_config_width = true) {
    // get an array of all element widths using the supplied selector.
    var widths = $("#upload_form_div .input_description").map(function () {
      return $(this).width();
    }).get();

    // get the largest width from the array.
    var max_width = Math.max.apply(null, widths);

    // set each element to the max width using the supplied selector.
    $("#upload_form_div .input_description").css({ "width": max_width });

    // set config dropdown width for consistency.
    if (set_config_width) {
      set_width_configs();
    }
  }

  // function to hide/show inline help.
  function toggle_inline_help_vmbackup_upload_scripts() {
    $('#upload_form_div').off('click', '#current_config_upload_scripts_div .input_description');
    $('#upload_form_div').on('click', '#current_config_upload_scripts_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
    $('#upload_form_div').off('click', '#scripts_div .input_description');
    $('#upload_form_div').on('click', '#scripts_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
  }

  /* add click events to script buttons*/
  function save_pre_script_click() {
    $("#save_pre_script").on("click", function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // get button that was clicked so it can be passed with the form later.
      var clicked_button = $(this).attr("name") + "=" + $(this).val();
      // ask if user is certain they want to Submit the pre-script.
      swal({
        title: 'Save pre-script?',
        text: 'Are you sure you want to save this pre-script?',
        type: "info",
        showCancelButton: true,
        confirmButtonText: "Yes, save pre-script",
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
                $("#pre_script_textarea_div").load(location.href + " #pre_script_textarea_div",
                  function () {
                    swal.close();
                  });
              });
          }
        });
    });
  }
  function remove_pre_script_click() {
    $("#remove_pre_script").on("click", function (e) {
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
  function save_post_script_click() {
    $("#save_post_script").on("click", function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // get button that was clicked so it can be passed with the form later.
      var clicked_button = $(this).attr("name") + "=" + $(this).val();
      // ask if user is certain they want to Submit the post-script.
      swal({
        title: 'Save post-script?',
        text: 'Are you sure you want to save this post-script?',
        type: "info",
        showCancelButton: true,
        confirmButtonText: "Yes, save post-script",
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
                $("#post_script_textarea_div").load(location.href + " #post_script_textarea_div",
                  function () {
                    swal.close();
                  });
              });
          }
        });
    });
  }
  function remove_post_script_click() {
    $("#remove_post_script").on("click", function (e) {
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

  // function to refresh content for settings tab.
  function refresh_vmbackup_upload_scripts(update_current_config = true) {
    $("#upload_form_div").load(location.href + " #upload_form_div",
      function () {
        if (update_current_config) {
          update_current_config_var();
        }
        assign_vmbackup_upload_scripts_functions();
        set_width_vmbackup_upload_scripts();
      });
  }

  // function assigns actions to forms for changes and add click events.
  function assign_vmbackup_upload_scripts_functions() {
    // monitor form input changes.
    current_config_upload_scripts_change();
    // monitor specific Vmbackup2UploadScripts inputs for changes and click events.
    save_pre_script_click();
    remove_pre_script_click();
    save_post_script_click();
    remove_post_script_click();
  }
/** end functions for Vmbackup2UploadScripts **/


/** start functions for Vmbackup3OtherSettings **/
  // function to monitor form inputs for changes and set the done button click function.
  function vmbackup_other_settings_form_input_change() {
    // remove any existing change event handlers for inputs.
    $("#vmbackup_other_settings_div :input").off("change");
    // add new change event handlers for inputs.
    $("#vmbackup_other_settings_div :input").on("change", function () {
      // check to see if the element is current_config.
      if ($(this).attr("id") == "current_config_other_settings") {
        // if so, disable the apply button.
        change_prop("#apply_vmbackup_other_settings", "disabled", true);
      } else {
        // remove the disabled attribute.
        $("#apply_vmbackup_other_settings").removeAttr("disabled");
        // use the property value to set the apply button as not disabled.
        change_prop("#apply_vmbackup_other_settings", "disabled", false);
        // change the value of the done button to "Reset".
        $("#done_vmbackup_other_settings").val("Reset");
      }

      // remove any existing click events from the done button.
      $("#done_vmbackup_other_settings").off("click");
      // add a click event to the done button.
      $("#done_vmbackup_other_settings").on("click", function (e) {
        // prevent normal button actions.
        e.preventDefault();
        e.stopPropagation();
        // check if the button value is Reset.
        if ($("#done_vmbackup_other_settings").val() == "Reset") {
          // if so, refresh the form.
          refresh_vmbackup_other_settings(true);
        } else {
          // perform normal done action.
          done();
        }
      });
    });
  }

  function assign_vmbackup_other_settings_functions() {
    // monitor form input changes.
    vmbackup_other_settings_form_input_change();
    current_config_other_settings_change();
    // monitor specific VmBackup3OtherSettings inputs for changes and click events.
    default_vmbackup_other_settings_click();
    apply_vmbackup_other_settings_click();
    done_vmbackup_other_settings_click();
  }

  // set the change event for current_config.
  function current_config_other_settings_change() {
    $("#current_config_other_settings").on("change", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var config = $("#current_config_other_settings").children("option:selected").val();
      config_changed(config, true);
    });
  }

  // set the width of the first grid column based on content.
  function set_width_vmbackup_other_settings(set_config_width = true) {
    // get an array of all element widths using the supplied selector.
    var widths = $("#vmbackup_other_settings_div .input_description").map(function () {
      return $(this).width();
    }).get();

    // get the largest width from the array.
    var max_width = Math.max.apply(null, widths);

    // set each element to the max width using the supplied selector.
    $("#vmbackup_other_settings_div .input_description").css({ "width": max_width });

    // set config dropdown width for consistency.
    if (set_config_width) {
      set_width_configs();
    }
  }

  // function to hide/show inline help.
  function toggle_inline_help_vmbackup_other_settings() {
    $('#vmbackup_other_settings_div').off('click', '#current_config_other_settings_div .input_description');
    $('#vmbackup_other_settings_div').on('click', '#current_config_other_settings_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
    $('#vmbackup_other_settings_div').off('click', '#logging_div .input_description');
    $('#vmbackup_other_settings_div').on('click', '#logging_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
    $('#vmbackup_other_settings_div').off('click', '#notifications_div .input_description');
    $('#vmbackup_other_settings_div').on('click', '#notifications_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
    $('#vmbackup_other_settings_div').off('click', '#advanced_features .input_description');
    $('#vmbackup_other_settings_div').on('click', '#advanced_features .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
  }

  /* add button click events */
  // add click event handler to default button.
  function default_vmbackup_other_settings_click() {
    $("#default_vmbackup_other_settings").on("click", function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // ask if user is certain they want to abort scripts.
      swal({
        title: 'Reset to defaults?',
        text: 'Are you sure you want to reset to defaults?',
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, reset to defaults",
        cancelButtonText: "Cancel",
        closeOnConfirm: false,
        closeOnCancel: true,
        showLoaderOnConfirm: true
      },
        function (isConfirm) {
          if (isConfirm) {
            // reset to defaults.
            $.ajax({
              url: '/plugins/vmbackup/include/functions.php',
              type: 'POST',
              data: {
                "#set_config_defaults": "set_config_defaults",
                "#current_config": current_config
              }
            }).done(function () {
              // build data object.
              if (current_config == "default") {
                var data = { "#script": "/usr/local/emhttp/plugins/vmbackup/scripts/commands.sh", "#args[1]": "create_vm_lists", "#args[2]": "rebuild_text_files" };
              } else {
                var data = { "#script": "/usr/local/emhttp/plugins/vmbackup/scripts/commands.sh", "#args[1]": "create_vm_lists" };
              }
              // rebuild text files.
              $.ajax({
                url: '/plugins/vmbackup/include/functions.php',
                type: 'POST',
                data: data
              }).done(function () {
                // refresh all tabs.
                refresh_data_tabs(false);
                // refresh settings tab a second time to make sure that file tree is updated correctly.
                refresh_vmbackup_settings(false, false);
                // switch to the main tab.
                $("#tab1").trigger("click");
                swal.close();
              });
            });
          }
        });
    });
  }

  // add click event handler to apply button.
  function apply_vmbackup_other_settings_click() {
    $("#apply_vmbackup_other_settings").on("click", function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // check to see if the form is invalid.
      if (!$("#vmbackup_other_settings_form")[0].checkValidity()) {
        return false;
      }
      // disable the apply button.
      change_prop("#apply_vmbackup_other_settings", "disabled", true);
      // grab the settings from the form and prepare it.
      var vmbackup_other_settings_form = document.getElementById("vmbackup_other_settings_form");
      prepare_form(vmbackup_other_settings_form);
      // submit the form with the clicked button appended.
      $.post($("#vmbackup_other_settings_form").attr("action"), $("#vmbackup_other_settings_form").serialize() + "&" + $(this).attr("name") + "=" + $(this).val());
      // make sure done button value is done.
      $("#done_vmbackup_other_settings").val("Done");
    });
  }

  // add click event handler to done button.
  function done_vmbackup_other_settings_click() {
    $("#done_vmbackup_other_settings").on("click", function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      if ($("#done_vmbackup_other_settings").val() == "Reset") {
        // refresh the form.
        refresh_vmbackup_other_settings(true);
      } else {
        // perform normal done action.
        done();
      }
    });
  }

  // function to refresh content for settings tab.
  function refresh_vmbackup_other_settings(update_current_config = true) {
    $("#vmbackup_other_settings_div").load(location.href + " #vmbackup_other_settings_div",
      function () {
        if (update_current_config) {
          update_current_config_var();
        }
        assign_vmbackup_other_settings_functions();
        set_compression_drop_down_states();
        set_width_vmbackup_other_settings();
      });
    // disable the apply button.
    change_prop("#apply_vmbackup_other_settings", "disabled", true);
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

  function assign_vmbackup_danger_zone_functions() {
    // monitor form input changes.
    vmbackup_danger_zone_form_input_change();
    current_config_danger_zone_change();
    // monitor specific Vmbackup4DangerZone inputs for changes and click events.
    snapshot_extension_change();
    disable_restrictive_regex_change();
    default_vmbackup_danger_zone_click();
    apply_vmbackup_danger_zone_click();
    done_vmbackup_danger_zone_click();
    abort_script_click();
    fix_snapshots_click();
  }

  // set the change event for current_config.
  function current_config_danger_zone_change() {
    $("#current_config_danger_zone").on("change", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var config = $("#current_config_danger_zone").children("option:selected").val();
      config_changed(config, true);
    });
  }

  // set the width of the first grid column based on content.
  function set_width_vmbackup_danger_zone(set_config_width = true) {
    // get an array of all element widths using the supplied selector.
    var widths = $("#vmbackup_danger_zone_div .input_description").map(function () {
      return $(this).width();
    }).get();

    // get the largest width from the array.
    var max_width = Math.max.apply(null, widths);

    // set each element to the max width using the supplied selector.
    $("#vmbackup_danger_zone_div .input_description").css({ "width": max_width });

    // set config dropdown width for consistency.
    if (set_config_width) {
      set_width_configs();
    }
  }

  // function to hide/show inline help.
  function toggle_inline_help_vmbackup_danger_zone() {
    $('#vmbackup_danger_zone_div').off('click', '#current_config_danger_zone_div .input_description');
    $('#vmbackup_danger_zone_div').on('click', '#current_config_danger_zone_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
    $('#vmbackup_danger_zone_div').off('click', '#danger_zone_div .input_description');
    $('#vmbackup_danger_zone_div').on('click', '#danger_zone_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
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
    $("#disable_restrictive_regex").on("change", function () {
      set_variable_cookie("refresh_settings", true);
    });
  }

  /* add button click events */
  // add click event handler to default button.
    function default_vmbackup_danger_zone_click() {
      $("#default_vmbackup_danger_zone").on("click", function (e) {
        // prevent normal form submission.
        e.preventDefault();
        e.stopPropagation();
        // ask if user is certain they want to abort scripts.
        swal({
          title: 'Reset to defaults?',
          text: 'Are you sure you want to reset to defaults?',
          type: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, reset to defaults",
          cancelButtonText: "Cancel",
          closeOnConfirm: false,
          closeOnCancel: true,
          showLoaderOnConfirm: true
        },
          function (isConfirm) {
            if (isConfirm) {
              // reset to defaults.
              $.ajax({
                url: '/plugins/vmbackup/include/functions.php',
                type: 'POST',
                data: {
                  "#set_config_defaults": "set_config_defaults",
                  "#current_config": current_config
                }
              }).done(function () {
                // build data object.
                if (current_config == "default") {
                  var data = { "#script": "/usr/local/emhttp/plugins/vmbackup/scripts/commands.sh", "#args[1]": "create_vm_lists", "#args[2]": "rebuild_text_files" };
                } else {
                  var data = { "#script": "/usr/local/emhttp/plugins/vmbackup/scripts/commands.sh", "#args[1]": "create_vm_lists" };
                }
                // rebuild text files.
                $.ajax({
                  url: '/plugins/vmbackup/include/functions.php',
                  type: 'POST',
                  data: data
                }).done(function () {
                  // refresh all tabs.
                  refresh_data_tabs(false);
                  // refresh settings tab a second time to make sure that file tree is updated correctly.
                  refresh_vmbackup_settings(false, false);
                  // switch to the main tab.
                  $("#tab1").trigger("click");
                  swal.close();
                });
              });
            }
          });
      });
    }

  // add click event handler to apply button.
  function apply_vmbackup_danger_zone_click() {
    $("#apply_vmbackup_danger_zone").on("click", function (e) {
      // prevent normal form submission.
      e.preventDefault();
      e.stopPropagation();
      // check to see if the form is invalid.
      if (!$("#vmbackup_danger_zone_form")[0].checkValidity()) {
        return false;
      }
      // disable the apply button.
      change_prop("#apply_vmbackup_danger_zone", "disabled", true);
      // grab the settings from the form and prepare it.
      var vmbackup_danger_zone_form = document.getElementById("vmbackup_danger_zone_form");
      prepare_form(vmbackup_danger_zone_form);
      // check to see if text files should be rebuilt.
      if (rebuild_text_files) {
        // append input to form submission to force text files to be re-created.
        $("#apply_vmbackup_danger_zone").append('<input type="hidden" name="#arg[3]" value="rebuild_text_files">');
        set_variable_cookie("rebuild_text_files", false);
      }
      // submit the form with the clicked button appended.
      $.post($("#vmbackup_danger_zone_form").attr("action"), $("#vmbackup_danger_zone_form").serialize() + "&" + $(this).attr("name") + "=" + $(this).val());
      // make sure done button value is done.
      $("#done_vmbackup_danger_zone").val("Done");
    });
  }

  // add click event handler to done button.
  function done_vmbackup_danger_zone_click(){
    $("#done_vmbackup_danger_zone").on("click", function (e) {
      // prevent normal button actions.
      e.preventDefault();
      e.stopPropagation();
      if ($("#done_vmbackup_danger_zone").val() == "Reset") {
        // refresh the form.
        refresh_vmbackup_danger_zone(true);
      } else {
        // perform normal done action.
        done();
      }
    });
  }

  // add click event handler to abort script button.
  function abort_script_click() {
    $("#abort_script").on("click", function (e) {
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
    $("#fix_snapshots").on("click", function (e) {
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
    // remove any existing change event handlers for inputs.
    $("#vmbackup_danger_zone_form :input").off("change");
    // add new change event handlers for inputs.
    $("#vmbackup_danger_zone_form :input").on("change", function () {
      // check to see if the element is current_config.
      if ($(this).attr("id") == "current_config_danger_zone") {
        // if so, disable the apply button.
        change_prop("#apply_vmbackup_danger_zone", "disabled", true);
      } else {
        // if not, remove the disabled attribute.
        $("#apply_vmbackup_danger_zone").removeAttr("disabled");
        // use the property value to set the apply button as not disabled.
        change_prop("#apply_vmbackup_danger_zone", "disabled", false);
        // change the value of the done button to "Reset".
        $("#done_vmbackup_danger_zone").val("Reset");
      }

      // remove any existing click events from the done button.
      $("#done_vmbackup_danger_zone").off("click");
      // add a click event to the done button.
      $("#done_vmbackup_danger_zone").on("click", function (e) {
        // prevent normal button actions.
        e.preventDefault();
        e.stopPropagation();
        // check if the button value is Reset.
        if ($("#done_vmbackup_danger_zone").val() == "Reset") {
          // if so, refresh the form.
          refresh_vmbackup_danger_zone(true);
        } else {
          // perform normal done action.
          done();
        }
      });
    });
  }

  // function to refresh content for settings tab.
  function refresh_vmbackup_danger_zone(update_current_config = true) {
    $("#vmbackup_danger_zone_div").load(location.href + " #vmbackup_danger_zone_div",
      function () {
        if (update_current_config) {
          update_current_config_var();
        }
        assign_vmbackup_danger_zone_functions();
        set_compression_drop_down_states();
        set_width_vmbackup_danger_zone();
      });
    // disable the apply button.
    change_prop("#apply_vmbackup_danger_zone", "disabled", true);
  }
/** end functions for Vmbackup4DangerZone **/


/** start functions for Vmbackup5ManageConfigs **/
  // build config selection.
  function build_configs_file_tree() {
    $("#select_configs_div").fileTree({
      root: "/boot/config/plugins/vmbackup/configs/",
      multiSelect: true,
      filter: "HIDE_FILES_FILTER",
      folderEvent: "nothing"
    });
  }
  /* add click event handlers for config management buttons. */
  function add_config_button_click() {
    $("#add_config_button").on("click", function (e) {
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
            // get the name of the config being added.
            add_config_name = $("#add_config").val();
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
            // rebuild the dropdown to select a config.
            rebuild_current_configs(add_config_name, "", false);
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
    $("#rename_config_button").on("click", function (e) {
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
            // create is_current_config variable and assume the config being replaced is not the current config.
            var is_current_config = false;
            // make sure that the new config does not already exist.
            configs_array.forEach(config => {
              if (String(inputValue).trim().toUpperCase() == config.toUpperCase()) {
                config_exists = true;
              }
              // see if the config to be renamed is the current config.
              if (current_config.toUpperCase() == config.toUpperCase()) {
                is_current_config = true;
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
                  // if current config was removed, change to default config.
                  if (is_current_config) {
                    //$("#current_config_settings").children("option:selected").val(new_config_name);
                    // rebuild the dropdown to select a config.
                    rebuild_current_configs(new_config_name, selected_configs_array[0], true);
                    // run the config changed function.
                    config_changed(new_config_name, false);
                  } else {
                    // rebuild the dropdown to select a config.
                    rebuild_current_configs(new_config_name, selected_configs_array[0], false);
                  }
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
    $("#copy_config_button").on("click", function (e) {
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
                  // rebuild the dropdown to select a config.
                  rebuild_current_configs(copy_config_name, "", false)
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
    $("#remove_configs_button").on("click", function (e) {
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
              // create is_current_config variable and assume the config being replaced is not the current config.
              var is_current_config = false;
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
                    // set the current config to the default.
                    // $("#current_config_settings").children("option:selected").val("default");
                    // remove the selected configs from the dropdown.
                    selected_configs_array.forEach(config => {
                      // rebuild the dropdown to select a config.
                      rebuild_current_configs("", config, false);
                      // $("#current_config_settings option[value='" + config + "']").remove();
                    })
                    // run the config changed function and set the config to default.
                    config_changed("default", false);
                  } else {
                    // remove the selected configs from the dropdown.
                    selected_configs_array.forEach(config => {
                      // rebuild the dropdown to select a config.
                      rebuild_current_configs("", config, false);
                    })
                  }
                });
            }
          });
      }
    });
  }

  // set the change event for current_config.
  function current_config_manage_configs_change() {
    $("#current_config_manage_configs").on("change", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var config = $("#current_config_manage_configs").children("option:selected").val();
      config_changed(config, true);
    });
  }

  // function to refresh content for settings tab.
  function refresh_vmbackup_manage_configs(update_current_config = true) {
    $("#vmbackup_settings_div").load(location.href + " #vmbackup_settings_div",
      function () {
        if (update_current_config) {
          update_current_config_var();
        }
        assign_vmbackup_manage_configs_functions();
        set_width_vmbackup_manage_configs();
      });
    // set refresh settings to false since it was just performed.
    set_variable_cookie("refresh_settings", false);
  }

  // set the width of the first grid column based on content.
  function set_width_vmbackup_manage_configs(set_config_width = true) {
    // get an array of all element widths using the supplied selector.
    var widths = $("#current_config_manage_configs_div .input_description").map(function () {
      return $(this).width();
    }).get();

    // get the largest width from the array.
    var max_width = Math.max.apply(null, widths);

    // set each element to the max width using the supplied selector.
    $("#current_config_manage_configs_div .input_description").css({ "width": max_width });

    // set config dropdown width for consistency.
    if (set_config_width) {
      set_width_configs();
    }
  }

  // function to hide/show inline help.
  function toggle_inline_help_vmbackup_manage_configs() {
    $('#manage_configs_div').off('click', '#current_config_manage_configs_div .input_description');
    $('#manage_configs_div').on('click', '#current_config_manage_configs_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
    $('#manage_configs_div').off('click', '#add_config_div .input_description');
    $('#manage_configs_div').on('click', '#add_config_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
    $('#manage_configs_div').off('click', '#manage_configs_div .input_description');
    $('#manage_configs_div').on('click', '#manage_configs_div .input_description', function (e) {
      e.preventDefault();
      $(this).nextAll('.custom_inline_help:first').toggle('slow');
    });
  }

  // function assigns actions to forms for changes and add click events.
  function assign_vmbackup_manage_configs_functions() {
    // monitor form input changes.
    current_config_manage_configs_change();
    // monitor specific Vmbackup5ManageConfigs inputs for changes and click events.
    add_config_button_click();
    rename_config_button_click();
    copy_config_button_click();
    remove_configs_button_click();
  }
/** end functions for Vmbackup5ManageConfigs **/
