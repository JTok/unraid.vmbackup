# unraid-vmbackup-plugin

v0.1.1 - Development

Plugin for backing up VMs in unRAID including vdisks, configuration files, and nvram.

Currently the plugin is in beta. Most of the features have been implemented. I have tested them as well as I can, but I cannot guarantee they will work correctly for everyone, so be sure to test thoroughly on your system before depending on this plugin for backups. Please review the Change Log and To-Do List if you would like to know more.

## Important

The virtual disks attached to a single VM must have unique names regardless of their location since during the backup they will be placed into the same folder.
i.e. VM1 cannot have /mnt/diskX/vdisk1.img and /mnt/users/domains/VM1/vdisk1.img since the vdisks will overwrite the each other during the backup. However, VM1 and VM2 can both have a vdisk1.img since they will be backed up to different folders.

## Installation

- Install the plugin using Community Applications, or the link below:

  - [https://raw.githubusercontent.com/jtok/unraid.vmbackup/development/vmbackup.plg](https://raw.githubusercontent.com/jtok/unraid.vmbackup/development/vmbackup.plg "unraid.vmbackups plugin")

- Choose your settings by going to Settings -> VM Backup.

  - make certain to read the help for each setting you want to change before changing it.

  - be sure to set "Enable backups?" to 'Yes' to ensure that your backups will run.

  - also make certain to disable the script version in user.scripts if you are still using that version.

  - currently the plugin cannot be configured to run a backup while parity is running.

  - set a schedule.

### Settings

#### Basic Settings

- Enable backups.

- Choose a backup location.

- Choose to backup all VMs, or list specific VMs to be backed up.

  - If backup all VMs is enabled, the list of VMs to backup is used as an exclusion list instead.

- Choose the number of days to keep backups.

- Choose the number backups to keep.

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

- Option to enable reconstruct write during backups.

### Other Settings

#### Logging

- Option to keep log files from successful backups.

- Change the number of log files to keep.

- Change the log file subfolder, or choose not to use one.

- Change the number of error log files to keep.

#### Notifications

- Option to send notifications through unRAID notification system.

  - Option to receive detailed notifications.

    - sends notifications when vm backups are started and stopped.

    - sends notifications when old backups are deleted.

  - Option to only receive error notifications.

#### Advanced Features

- Option to timestamp backups.

- Option to compare files and retry backup in the event of failure.

- Option to disable delta syncs.

- Option to only use rsync.

- Change the number of times to check if a VM is shut down.

- Change the number of seconds to wait between checks to see if a VM is shut down.

#### Danger Zone

- Option to keep log files from failed backups.

- Option to kill a VM that won't shutdown cleanly.

- Option to have VMs start after backup based on their previous state.

- Change the extension used for snapshots.

- Option to fallback to standard backups if snapshot creation fails.

- Option to pause VMs instead of shutting them down during standard backups. Could result in unusable backups.

- List specific VMs to keep running during backup. Not recommended.

- Option to skip backing up xml configuration.

- Option to skip backing up nvram.

- Option to skip backing up vdisks.

- Option to have VMs start after successful backup regardless of previous state.

- Option to have VMs start after failed backup regardless of previous state.

- Option to perform a dry-run backup.

- Disable validation for the custom cron text box.

- Disable restrictive validation for the other text fields.

##### Disclaimer

I do not make any guarantees as to the function of this plugin. It is provided as-is. Use at your own risk.

###### Based on unraid-vmbackup by JTok [here](https://github.com/JTok/unraid-vmbackup "unraid-vmbackup JTok's script")

###### Big thanks to all the other plugin developers in the unRAID community, especially (but not limited to) [Squid](https://forums.unraid.net/profile/10290-squid/ "Squid"), [bonienl](https://forums.unraid.net/profile/2736-bonienl/ "bonienl"), [dlandon](https://forums.unraid.net/profile/6013-dlandon/ "dlandon"), and [dmacias](https://forums.unraid.net/profile/11874-dmacias/ "dmacias"); without whose efforts I might not have been able to complete this project
