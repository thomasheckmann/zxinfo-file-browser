# FAQ - frequently asked questions

## Why does SCR preview looks like random data?

For snapshot files SNA and Z80, the screen memory is part of the data - but for tape files TAP and TZX, there is no way to identify a screen 100%. For these files, the app tries at best to find a suitable SCR preview.
- The code starts at 16384 (screen memory)
- The code is of length 6912
- For headerless data, it tries to find a data block with size 6912 bytes or just uses the first block with size > 16000 bytes.

In many cases this leads to a nice SCR preview, in others it just shows whatever data is in the file - which might look randon on the screen.

## Where do I find the apps logfile?

By default zxinfo-file-browser writes logs to the following locations:

* on macOS: ~/Library/Logs/zxinfo-file-browser/main.log
* on Windows: %USERPROFILE%\AppData\Roaming\zxinfo-file-browser\logs\main.log
* on Linux: ~/.config/zxinfo-file-browser/logs/main.log

## How do I reset the startup folder?

Delete the 'start-folder' property in the config file and restart the app.

By default zxinfo-file-browser uses the config.json on the following locations:

* on macOS: ~/Library/Application Support/zxinfo-file-browser/config.json
* on Windows: %USERPROFILE%\AppData\Roaming\zxinfo-file-browser\config.json
* on Linux: ~/.config/zxinfo-file-browser/config.json
