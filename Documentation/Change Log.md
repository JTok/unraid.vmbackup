## Change Log

### v0.3.0 - 2024/05/05
**Margaritaville**

- update: formatting for changelogs

### v0.2.9 - 2024/05/02
**Widdershins**

- add: a more detailed VM description to the empty vdisk_path notification (@realizelol)
- add: a flexible variable to the sleep-timer before ACPI VM shutdown so VM can recognize the "power-button-shutdown" (@realizelol)

### v0.2.8 - 2024/04/23
**Forks and Spoons Only**

- fix: backup of VM names containing spaces (@realizelol)
- fix: indentation (@realizelol)
- fix: disk_prefix in $vdisk_path variable (@realizelol)
- fix: counting vDisks by using Disks instead of "file sources" + Silence: STDERR output to /dev/null (@realizelol)
- add: ability for the script to handle OS suspended VMs (@realizelol)
- update: loops to break the row via semicolon (@realizelol)

### v0.2.7 - 2024/04/21a
**Loud Sounds in the Night**

- fix: added details v0.2.6 update notes
- fix: config directory not being created automatically

### v0.2.6 - 2024/04/21
**Booger Nights**

- fix: workaround for issue with empty path with unassigned devices (thanks to @juugis)
- fix: issue with plugin requiring internet at server boot (thanks to @realizelol)
- fix: respect existing installed packages that might be used by other plugins (thanks to @realizelol)
- update: moved old cronjob removal to pre-install step (thanks to @realizelol)

### v0.2.5 - 2022/12/25
**The Last Dancer**

- fix: typo in import for jquery filetree
- fix: issue with renaming and deleting configs not showing configurations
- add: enabled beta for backup extra files
- add: brought back option to backup vms while they are running
- update: cleaned up code

### v0.2.4 - 2021/03/12
**Fettuccine Afraido**

- fix: issue with legacy options not being updated correctly
- fix: issue with old package files not being removed
- fix: plugin package removal
- fix: moved txt and json files from usb to /tmp to reduce writes to usb
- add: option to backup configs
- add: option to backup pre and post scripts
- remove: pigz and reverted back to standard gzip to reduce complexity

### v0.2.3 - 2021/03/11
**Firetown**

- fix: for graphic issues related to broken EOL characters
- remove: max unraid version

### v0.2.2 - 2021/02/03
**Raz of the SAZ**

- add: checks to kill stuck scripts
- add: version number to bottom of Settings tab
- update: pigz to pigz-2.3-x86_64-2_slonly
- update: set max unraid version to 6.8.3 until 6.9 testing is done

### v0.2.1 - 2020/02/20
**Pika Pika**

- add: changes from unraid-vmbackup script v1.3.1
- add: seconds to logs
- add: option to use zstandard compression
- add: option to create a vm specific log in each vm's subfolder
- add: config drop-down selection to the top of each tab
- update: method used to determine cpu thread count

### v0.2.0 - 2020/01/21
**The Resistance**

- fix: new config options not always getting added to user config
- fix: parenthesis in vm names
- add: ability to run pre and post scripts
- add: option to run backup without array started
- add: confirmation dialogs to destructive or dangerous buttons
- add: support for multiple configs/schedules
- add: option to allow multiple configs to run simultaneously
- add: option to set compression level
- add: option to set the number of threads used during compression
- update: compression program from gzip to pigz to support multi-threading
- update: alert dialogs to use sweet alerts
- update: help for custom cron

### v0.1.9 - 2019/12/31
**Flame Broiled**

- fix: snapshot extension form validation
- add: file versions to reduce writes to thumb drive
- add: option to run backup even during parity check
- add: alert if enable backups is set to 'No' when apply button is hit
- add: ability to view latest log file
- add: md5 hash checks for package files during install
- update: buttons and pages to use XHR (ajax) for asynchronous loading to reduce page refreshes
- update: code to reduce page load times
- remove: "vms to backup while running" option due to difficulties with the menu item

### v0.1.8 - 2019/12/24
**Penny Wise and Pound Stupid**

- fix: weekly cronjob
- fix: validation to allow spaces in paths
- fix: cronjob not being removed during uninstall
- fix: extension matching case sensitivity
- fix: stuck snapshots
- add: ability to abort running scripts
- update: default folder start location based on restrictive validation setting
- update: help
- update: lists to be sorted alphabetically

### v0.1.7 - 2019/12/22
**Ms. Frizzle**

- fix: minor issues
- fix: paths requiring trailing slashes
- fix: backup location drop-down color when using black theme
- add: additional logging
- add: donate button
- add: backup now button
- update: backup location drop-down start folder to /mnt/
- update: help
- update: readme

### v0.1.6 - 2019/12/18b
**Powered by Caffeine**

- fix: spacing in tmp log file
- fix: issue with xml plugin url

### v0.1.5 - 2019/12/18a
**This Beer is Tasty**

- fix: issue with runscript.php not being included in plugin package
- update: how logging is handled when running the script

### v0.1.4 - 2019/12/18
**Aging Gracelessly**

- initial beta release
- based on unraid-vmbackup script v1.2.2 at https://github.com/JTok/unraid-vmbackup
