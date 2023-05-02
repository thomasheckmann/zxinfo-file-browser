
# ZXINFO File Browser
Browse your ZX Spectrum emulator files, powered by the web - kind of a "Picasa for ZX Spectrum emulator files" :-) - Now with JSSpeccy 3 integrated to play games right away.

<img width="1024" alt="main" src="doc/mainscreen.png">

# Download
Download latest build for macOS, Windows and Linx on [release page](https://github.com/thomasheckmann/zxinfo-file-browser/releases)
Please note all builds are unsiged, so you might need to give persmisson to run - depending on what OS you are running.

* zxinfo-file-browser-Vnn-arm64-mac.zip - macOS on Apple Silicon
* zxinfo-file-browser-Vnn-mac.zip - macOS on Intel
* zxinfo-file-browser-Vnn.exe - Windows
* zxinfo-file-browser-Vnn.AppImage - Linux

Favorites list | Details TZX | Details P (ZX81)
------------ | ------------- | -------------
<img width="320" alt="Favorites" src="doc/favorites.png"> | <img width="320" alt="details tzx" src="doc/details_tzx.png"> | <img width="320" alt="details p(zx81)" src="doc/details_p.png">
Grid view | JSSpeccy 3
<img width="320" alt="Grid View" src="doc/gridview.png"> | <img width="320" alt="JSSpeccy 3" src="doc/jsspeccy.png">

# Features
* Scan files local on your harddisk
* Display files in the following formats: SNA, Z80, TAP, TZX, P, P81, 81, DSK, TRD, SCL, MDR
* Handles files in ZIP archives (to one level)
* Generates SCR preview and other details for various formats: SNA, Z80, TAP, TZX
* Generates DISK/MDR SCR preview showing files for DSK, TRD, SCL & MDR
* Generates ZX81 SCR preview with BASIC list for P, P81, 81 & TZX (ZX81)
* Integrates with ZXDB via ZXInfo API, using sha512 hash on files, to lookup title, ZXDB id and SCR
* Direct link to detail page, if found in ZXDB, to ZXInfo.dk
* Ability to choose SCR preview from ZXInfo, if known
* Keep track of your favorite games with your own favorites list
* Quick access to folders
* [JSSpeccy 3](https://github.com/gasman/jsspeccy3) by Matt Westcott integrated so games can be played right away. JSSpeccy 3 is licensed under the GPL version 3 - see [COPYING](https://raw.githubusercontent.com/gasman/jsspeccy3/main/COPYING).

# Questions?
See the [FAQ](FAQ.md)

# Build it yourself
Requirements:
* Git client - for example [GitHub Desktop](https://desktop.github.com/)
* Install node.js - find installation [here] - (https://nodejs.org/en/download/)

## Simple - just build the app ready to run
Clone the repository and run build
```
cd <some folder>
git clone git@github.com:thomasheckmann/zxinfo-file-browser.git
cd zxinfo-file-browser
npm i
npm run build
```
The app is then available in the 'dist' folder.

# Development
See [Development.md](Development.md) for details about how to build zxinfo-file-browser.
