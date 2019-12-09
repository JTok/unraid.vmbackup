# unraid-vmbackup-plugin

v0.1.1 - Development

Plugin for backing up VMs in unRAID including vdisks, configuration files, and nvram.

Currently the plugin is in a relatively stable state, and most of the features have been implemented. I have tested them as well as I can, but I cannot guarantee they will work correctly for everyone, so be sure to test thoroughly on your system before depending on this plugin for backups. Please review the Change Log and To-Do List if you would like to know more.

## Important

The virtual disks attached to a single VM must have unique names regardless of their location since during the backup they will be placed into the same folder.
i.e. VM1 cannot have /mnt/diskX/vdisk1.img and /mnt/users/domains/VM1/vdisk1.img since the vdisks will overwrite the each other during the backup. However, VM1 and VM2 can both have a vdisk1.img since they will be backed up to different folders.

## Installation

- Add the script and description files to the CA User Scripts plugin. No other files are necessary to make the script work.

- Set the variables in the script file.

  - be sure to set enabled = "1" to ensure that the script will run.

  - to enable the script while parity check is running change line 4 from "noParity=true" to "noParity=false"

- Choose a schedule in the CA User Scripts plugin.

### Script options

- Choose a backup location.

- Choose to backup all VMs, or list specific VMs to be backed up.

- List specific vdisks to skip, if any.

- List specific vdisk extensions to skip, if any (iso listed by default).

- Option to use snapshots to backup VMs without shutting down.

  - be sure to install the qemu guest agent on VMs to enable quiescence, which will improve the integrity of backups.

  - the disk path in the VM config cannot be /mnt/user, but instead must be /mnt/cache or /mnt/diskX.

- Option to kill a VM that won't shutdown cleanly.

#### VM restart options

- Option to have VMs start after backup based on their previous state.

- Advanced: Option to have VMs start after successful backup regardless of previous state.

- Advanced: Option to have VMs start after failed backup regardless of previous state.

#### Backup retention options

- Choose the number of days to keep backups.

- Choose the number backups to keep.

#### Logging and notification options

- Option to log to file.

- Choose the number of log files to keep.

- Option to log messages through unRAID notification system.

  - Option to only receive error notifications

  - Option to receive detailed notifications.

    - sends notifications when vm backups are started and stopped.

    - sends notifications when old backups are deleted.

#### Additional options

- Option to compress backups.

- Option to timestamp backups.

- Option to disable delta syncs.

- Option to only use rsync.

- Advanced: Choose the extension used for snapshots.

- Advanced: Option to fallback to standard backups if snapshot creation fails.

- Advanced: Option to pause VMs instead of shutting them down during standard backups. Could result in unusable backups.

- Advanced: Option to keep specific VMs running during backup. Not recommended.

- Advanced: Option to enable reconstruct write during backups.

- Advanced: Option to compare files and retry backup in the event of failure.

- Advanced: Option to skip backing up xml configuration.

- Advanced: Option to skip backing up nvram.

- Advanced: Option to skip backing up vdisks.

- Advanced: Choose the number of times to check if a VM is shut down.

- Advanced: Choose the number of seconds to wait between checks to see if a VM is shut down.

##### Disclaimer

I do not make any guarantees as to the function of this script. It is provided as-is. Use at your own risk.

###### Originally from unraid-autovmbackup by Daniel Jackson (danioj) [here](https://lime-technology.com/forums/topic/46281-unraid-autovmbackup-automate-backup-of-virtual-machines-in-unraid-v04/ "unraid-autovmbackup")

###### Includes additions for removing old backups added by Deeks [here](https://lime-technology.com/forums/topic/46281-unraid-autovmbackup-automate-backup-of-virtual-machines-in-unraid-v04/?do=findComment&comment=589821 "unraid-autovmbackup Deeks' script")

###### Includes additions for creating snapshots added by Dikkekop (thies88) [here](https://github.com/thies88/unraid-vmbackup "unraid-vmbackup Dikkekop's script")
