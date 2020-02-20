# unraid.vmbackup plugin

## currently in beta

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=NG5HGW4Q3CZU4&source=url "Donations are appreciated")

v0.2.1 - 2020/02/20

Plugin for backing up VMs in unRAID including vdisks, configuration files, and nvram.
This plugin installs [xmlstarlet](http://xmlstar.sourceforge.net/) to work with VM XML config files.
This plugin installs [pigz](https://zlib.net/pigz/) to allow for multi-threaded gzip compression.

Currently the plugin is in beta. I have tested them as well as I can, but I cannot guarantee they will work correctly for everyone, so be sure to test thoroughly on your system before depending on this plugin for backups. Please review the Change Log and To-Do List if you would like to know more.

This plugin does use cookies to allow user settings to persist across page refreshes. They do not do anything else! They expire as soon as unRAID browser window is closed.

## Important

The virtual disks attached to a single VM must have unique names regardless of their location since during the backup they will be placed into the same folder.
i.e. VM1 cannot have /mnt/diskX/vdisk1.img and /mnt/users/domains/VM1/vdisk1.img since the vdisks will overwrite the each other during the backup. However, VM1 and VM2 can both have a vdisk1.img since they will be backed up to different folders.

## Installation

- Install the plugin using Community Applications, or the link below:

  - [https://raw.githubusercontent.com/jtok/unraid.vmbackup/master/vmbackup.plg](https://raw.githubusercontent.com/jtok/unraid.vmbackup/master/vmbackup.plg "unraid.vmbackups plugin")

- Choose your settings by going to Settings -> User Utilities -> VM Backup.

  - make certain to read the help for each setting you want to change before changing it.

  - be sure to set "Enable backups?" to 'Yes' to ensure that your backups will run.

  - also make certain to disable the script version in user.scripts if you are still using that version.

  - currently the plugin cannot be configured to run a backup while parity is running.

  - set a schedule.

### Settings

#### Basic Settings

- Enable backups.

  - Must be set to 'Yes' to enable backups.

- Choose a backup location.

  - This should be a share you have already created.

  - Each VM will have a subfolder made for it in this location.

- Choose to backup all VMs, or list specific VMs to be backed up.

  - If backup all VMs is enabled, the list of VMs to backup is used as an exclusion list instead.

- Choose the number of days to keep backups.

- Choose the number backups to keep.

  - If a VM has multiple vdisks, the names of those vdisks must end in sequential numbers in order to be correctly backed up (i.e. vdisk1.img, vdisk2.img, etc.).

#### Schedule

- Choose a backup frequency.

  - Use dropdown boxes specify when backups should occur.

  - Use "Custom Cron" field to create a backup schedule based on [crontab](https://crontab.guru/ "crontab guru").

#### Advanced Settings

- List specific vdisks to skip, if any.

- List specific vdisk extensions to skip, if any (iso listed by default).

- Option to use snapshots to backup VMs without shutting down.

  - be sure to install the qemu guest agent on VMs to enable quiescence, which will improve the integrity of backups.

  - the disk path in the VM config cannot be /mnt/user, but instead must be /mnt/cache or /mnt/diskX.

- Option to compress backups.

  - Option to use Zstandard inline compression.

    - If turned on and there are already uncompressed or legacy compression backups, you will need to manually remove old versions of those backups until they are gone.

    - This can add to the amount of time the backup process takes depending on your hardware and configuration.

    - Uses Zstandard for multi-threaded compression.

    - Cannot be used with legacy compression.

  - Option to use legacy gzip compression.

    - Do not turn this on if you already have uncompressed backups. Move or delete existing uncompressed backups before enabling, because this will compress all files in the backup directory into one tarball.

    - This can add a significant amount of time to the backup.

    - Uses pigz for multi-threaded compression.

    - Cannot be used with Zstandard compression.

- Option to enable reconstruct write (a.k.a. turbo write) during backups.

  - Do not use this if reconstruct write is already enabled.

  - When set to 'Yes' reconstruct write will be disabled after the backup finishes.

- "Backup Now" button runs a backup using current settings. It will automatically apply changes before it starts.

### Upload Scripts

#### Pre-Script

- Option to create a pre-script that will run before the backup script.

#### Post-Script

- Option to create a post-script that will run after the backup script.

### Other Settings

#### Logging

- Option to keep log files from successful backups.

- Change the number of log files to keep.

- Change the number of error log files to keep.

- Change the log file subfolder, or choose not to use one.

- Option to enable per VM logs.

#### Notifications

- Option to send notifications through unRAID notification system.

  - Option to receive detailed notifications.

    - sends notifications when vm backups are started and stopped.

    - sends notifications when old backups are deleted.

  - Option to only receive error notifications.

#### Advanced Features

- Option to choose a Zstandard compression level.

- Option to choose a legacy compression level.

- Option to timestamp backups.

- Option to compare files and retry backup in the event of failure.

  - This can add a significant amount of time to the backup.

- Option to disable delta syncs.

  - When not using snapshots, delta syncs make a copy of the latest backup and then write just the changes since the last backup.

- Option to only use rsync.

  - Rsync was significantly slower in some scenarios, so other quicker options are used when possible by default.

- Change the number of times to check if a VM is shut down.

- Change the number of seconds to wait between checks to see if a VM is shut down.

#### Danger Zone

- Option to choose how many threads are used for Zstandard compression.

- Option to choose how many threads are used for legacy compression.

- Option to keep log files from backups with errors.

- Option to kill a VM that won't shutdown cleanly.

- Option to have VMs start after backup based on their previous state.

- Change the extension used for snapshots.

- Option to fallback to standard backups if snapshot creation fails.

  - When enabled, this will cause the backups to act as though "Enable snapshots" was set to 'No' for just the VM with the failed snapshot.

  - If a snapshot fails and this is enabled, VMs will be shutdown or paused based on standard backup settings.

- Option to pause VMs instead of shutting them down during standard backups. Could result in unusable backups.

- Option to skip backing up xml configuration.

- Option to skip backing up nvram.

- Option to skip backing up vdisks.

- Option to have VMs start after successful backup regardless of previous state.

- Option to have VMs start after failed backup regardless of previous state.

- Option to perform a dry-run backup.

  - Dry-run backups will still create empty files in your backup directory.

- Option to allow multiple configs to run simultaneously.

  - Does not allow the same config to run more than once.

- Option to allow backups to run during a parity check. This could cause significant slowdowns.

- Disable validation for the custom cron text box.

- Disable restrictive validation for the other text fields.

- "Abort Script" button will abort any running scripts. This may cause major issues. Use with caution!

- "Fix Snapshots" button to fix stuck snapshots that weren't removed. This could cause more issues than it fixes. Use with caution!

### Manage Configs

#### Add Config

- Option to create a separate config with its own settings and pre/post scripts.

#### Rename/Delete Configs

- Gives the ability to manage user created configs.

  - Option to rename an existing config.

  - Option to copy an existing config.

    - The copy will have its schedule disabled by default.

  - Option to remove existing configs.

##### Disclaimer

I do not make any guarantees as to the function of this plugin. It is provided as-is. Use at your own risk.

###### Based on unraid-vmbackup by JTok [here](https://github.com/JTok/unraid-vmbackup "unraid-vmbackup JTok's script")

###### Big thanks to all the other plugin developers in the unRAID community, especially (but not limited to) [Squid](https://forums.unraid.net/profile/10290-squid/ "Squid"), [bonienl](https://forums.unraid.net/profile/2736-bonienl/ "bonienl"), [dlandon](https://forums.unraid.net/profile/6013-dlandon/ "dlandon"), and [dmacias](https://forums.unraid.net/profile/11874-dmacias/ "dmacias"); without whose efforts I might not have been able to complete this project
