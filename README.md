
# ZXINFO File Manager
Manage your ZX Spectrum emulator files, powered by the web.

<img width="1024" alt="ZXInfoTV-home" src="doc/screenshot.png">

# Download
Download latest build for:
* Windows - [Windows Download](https://drive.google.com/drive/folders/1egnpMV1TWWqsOxIy3Vyt6gmkF_sdpxVK?usp=sharing)
* [MacOS]
* [Linux]

# Features
* Scan local files
* Non-Destructive - original files won't be touched
* Read various formats: SNA, Z80, TAP
* Integrates with ZXDB using ZXInfo API
* Browse by file formats (sna, z80, tap)
* Quick access to folders

# Build it yourself
Requirements:
* Git client - for example [GitHub Desktop](https://desktop.github.com/)
* Install node.js - find installation [here] - (https://nodejs.org/en/download/)

## Simple - just build the app ready to run
Clone the repository and run build
```
cd <some folder>
git clone git@github.com:thomasheckmann/zxinfo-file-manager.git
cd zxinfo-file-manager
npm i
npm run build
```
The app is then available in the 'dist' folder.

# Development
See [Development.md](Development.md) for details about how to build zxinfo-file-manager.
