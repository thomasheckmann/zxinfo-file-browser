/**
 * Desktop App with Electron and React: Part 1 - Getting Started with Electron
 *
 * https://youtu.be/Cdu2O6o2DCg
 *
 * IPC - https://www.electronjs.org/docs/latest/tutorial/ipc
 * - one way (toMain), use ipcRenderer.send and ipcMain.on
 * - two way, use ipcRenderer.invoke and ipcMain.handle
 *
 * command line parameter: dir=<start folder>
 *
 * MacOS:
 *
 * open zxinfo-file-browser.app --args --dir="/Volumes/ZXTestData/ALL_FORMAT"
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const fs = require("fs");
const Jimp = require("jimp");
const sizeof = require('object-sizeof')

const cmdDir = app.commandLine.getSwitchValue("dir");

const handleFormats = require("./main/formats/handleFormats");
const pfmt = require("./main/formats/p_format");

const AdmZip = require("adm-zip");

const { logger } = require("./main/logger.js");

let win;

function createWindow() {
  const mylog = logger().scope("createWindow");
  app.commandLine.appendSwitch("disable-http-cache");

  mylog.info(`########### STARTING zxinfo-file-browser (${app.getVersion()})`);
  mylog.info(`nodeJS version: ${process.version}`);
  mylog.info(`mode: ${isDev ? "DEBUG mode" : "PROD mode"}`);
  mylog.info(`####################################`);
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    title: `ZXInfo - file browser v${app.getVersion()}`,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload.js"), // use a preload script
    },
  });

  // Open the DevTools.
  if (isDev) {
    mylog.debug("opening DevTools");
    mylog.debug("tmp path is:" + app.getPath("temp"));
    win.webContents.openDevTools();
  }

  win.loadURL(isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../build/index.html")}`);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
  });
});

/**
 * Uses settings
 */
const Store = require("electron-store");

const store = new Store();
const favoritesStore = new Store({ name: "favorites" });
const zxinfoSCRStore = new Store({ name: "zxinfoSCR" });
const zxdbIDStore = new Store({ name: "zxdb_id" });

ipcMain.handle("getStoreValue", (event, key) => {
  const mylog = logger().scope("getStoreValue");
  const value = store.get(key);
  mylog.debug(`key, value = {${key}, ${value}}`);

  if (key === "start-folder" && cmdDir && cmdDir.length > 0) {
    if (isDev) mylog.info(`start-folder from command line: ${cmdDir}`);
    return cmdDir;
  }
  return value;
});

ipcMain.handle("setStoreValue", (event, key, value) => {
  const mylog = logger().scope("setStoreValue");
  mylog.debug(`key, value = {${key}, ${value}}`);
  store.set(key, value);
});

ipcMain.handle("getFavorites", (event, key) => {
  const mylog = logger().scope("getFavorites");
  const value = favoritesStore.get(key);
  mylog.debug(`key, value = {${key}, ${value}}`);
  return value;
});

ipcMain.handle("setFavorites", (event, key, value) => {
  const mylog = logger().scope("setFavorites");
  mylog.debug(`key = {${key}}`);
  favoritesStore.set(key, value);
});

ipcMain.handle("getZxinfoSCR", (event, key) => {
  const mylog = logger().scope("getzxinfoSCR");
  const value = zxinfoSCRStore.get(key);
  mylog.debug(`key = {${key}}`);
  return value;
});

ipcMain.handle("setZxinfoSCR", (event, key, value) => {
  const mylog = logger().scope("setzxinfoSCR");
  mylog.debug(`key = {${key}}`);
  zxinfoSCRStore.set(key, value);
});

ipcMain.handle("get-zxdb-id-store", (event, key) => {
  const mylog = logger().scope("get-zxdb-id-store");
  const value = zxdbIDStore.get(key);
  mylog.debug(`key, value = {${key}, ${value}}`);
  return value;
});

ipcMain.handle("set-zxdb-id-store", (event, key, value) => {
  const mylog = logger().scope("set-zxdb-id-store");
  mylog.debug(`key, value = {${key}, ${value}}`);
  zxdbIDStore.set(key, value);
});

ipcMain.handle("convertSCR", (event, img) => {
  const mylog = logger().scope("convertSCR");
  mylog.debug(`convertSCR(): ` + img);
  // create a SCR preview of DIR
  let mainImage = new Jimp(320, 240, Jimp.cssColorToHex("#D7D7D7"), (err, image) => {
    if (err) throw err;
  });

  return mainImage.getBase64Async(Jimp.MIME_PNG);
});

ipcMain.handle("create-zx81-basic-list", async (event, data) => {
  const mylog = logger().scope("create-zx81-basic-list");
  mylog.debug(`data.length = ${data.length}`);

  const res = await pfmt.createBASICListAsScr(data);
  if (res.buffer) {
    return "data:image/gif;base64," + res.buffer.toString("base64");
  } else {
    return res;
  }
});

// supportedExts must be synced with startFolder.fileFilters in App.js
const supportedExts = [".sna", ".z80", ".slt", ".dsk", ".trd", ".scl", ".mdr", ".tap", ".tzx", ".p", ".p81", ".81", ".zip"];

/**
 *
 * Recursively scans a directory for known files, returns a list of directories with valid files.
 *
 * @param {*} dirPath
 * @param {*} obj
 * @returns
 */
function scanDirectory(dirPath, obj) {
  const mylog = logger().scope("scanDirectory");
  mylog.log(`scanning dir: ${dirPath}`);
  var hrstart = process.hrtime();

  //win.webContents.send('update-status-text', `scanning dir: ${dirPath}`);

  let filesInDir = 0;
  try {
    fs.readdirSync(dirPath).forEach(function (file) {
      mylog.debug(`found this, have a look: ${file}`);
      let filepath = path.join(dirPath, file);
      try {
        let stat = fs.lstatSync(filepath);
        if (stat.isDirectory()) {
          let totalFiles = scanDirectory(filepath, obj).totalFiles;
          if (totalFiles > 0) {
            obj.set(filepath, totalFiles);
          }
        } else {
          let extension = path.extname(filepath).toLowerCase();
          if (supportedExts.indexOf(extension) >= 0) {
            filesInDir++;
            mylog.debug(`counting ${filepath}`);
          }
        }
      } catch (error) {
        mylog.error(error);
      }
    });
  } catch (error) {
    mylog.error(error);
  }

  if (filesInDir > 0) {
    obj.set(dirPath, filesInDir);
  }
  const hrend = process.hrtime(hrstart);
  mylog.log(`time() ms: ${hrend[0] * 1000 + hrend[1] / 1000000}`);
  return { folders: obj, totalFiles: filesInDir };
}

/**
 * Opens folder dialog, or preload with folder given as input.
 * Returns an arrray with names of folders containing known files or null, if user cancels dialog
 *
 */
ipcMain.handle("open-folder-dialog", async (event, arg) => {
  const mylog = logger().scope("open-folder-dialog");
  mylog.info(`starting at folder: ${arg}`);

  function initFolderView(startFolder) {
    var startTime = performance.now();

    const foldersWithFiles = scanDirectory(startFolder, new Map());
    const files = new Map([...foldersWithFiles.folders]);
    var result = [...files.keys()];

    let totalFiles = 0;

    files.forEach((value) => {
      totalFiles += value;
    });

    var endTime = performance.now();

    mylog.debug(`time: ${(endTime - startTime) / 1000} sec.`);
    return { root: startFolder, folders: result, total: totalFiles, time: ((endTime - startTime) / 1000).toFixed(2) };
  }

  if (arg && fs.existsSync(arg)) {
    mylog.debug(`open folder from input: ${arg}`);
    return initFolderView(arg);
  } else if (arg && !fs.existsSync(arg)) {
    mylog.warn(`folder does not exist... ${arg}`);
    return null;
  }

  mylog.debug(`asking user which folder to open...`);
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (canceled) {
    mylog.debug(`handle('open-folder-dialog'): CANCEL`);
    return null;
  } else {
    return initFolderView(filePaths[0]);
  }
});

/**
 * Scan a folder for known files and return array with filenames, NOT including subfolders.
 */
ipcMain.handle("scan-folder", async (event, arg) => {
  const mylog = logger().scope("scan-folder");
  mylog.log(`input folder: ${arg}`);
  var hrstart = process.hrtime();
  var result = [];

  const dirPath = arg; // TODO: Validate input

  let filesInDir = 0;
  try {
    fs.readdirSync(dirPath).forEach(function (folder) {
      let filepath = path.join(dirPath, folder);
      let stat = fs.statSync(filepath);
      mylog.info(`processing: ${filepath}`);
      //win.webContents.send('update-status-text', `processing: ${filepath}`);
      if (!stat.isDirectory()) {
        mylog.debug(`file, looking at extension: ${filepath}`);
        let extension = path.extname(filepath).toLowerCase();
        if (supportedExts.indexOf(extension) >= 0) {
          filesInDir++;
          mylog.debug(`file with valid extension: ${filepath}, count=${filesInDir}`);
          result.push(filepath);
        }
      } else {
        mylog.debug(`directory, ignoring: ${filepath}`);
      }
    });
  } catch (error) {
    mylog.error(error);
  }
  mylog.debug(`Returning: total files: ${filesInDir}`);
  const hrend = process.hrtime(hrstart);
  mylog.log(`time() ms: ${hrend[0] * 1000 + hrend[1] / 1000000}`);
  return result;
});

/**
 *  identify metadata about file
 *
 * .SNA and 49179 bytes = SNA 48K
 * .SNA and 131103 OR 147487 bytes = SNA 128K
 * .Z80 and ...
 */
ipcMain.handle("load-file", async (event, filename, isPreview) => {
  const mylog = logger().scope("load-file");
  mylog.debug(`loading details for file: ${filename}, isPreview: ${isPreview}`);
  var hrstart = process.hrtime();

  let result; // either object or array (zip)

  const filename_base = path.basename(filename);;
  const filename_ext = path.extname(filename).toLocaleLowerCase();

  mylog.debug(`filename (base): ${filename_base}`);
  mylog.debug(`filename (ext): ${filename_ext}`);

  let buf;
  try {
    buf = fs.readFileSync(filename);
  } catch (error) {
    mylog.error(`File NOT found: ${filename}`);
    return null;
  }

  let fileObj = handleFormats.getZXFormat(filename, null, buf, isPreview);
  mylog.log(`INPUT : size of file\t - ${sizeof(buf)} bytes, ${filename}`);
  mylog.log(`OUTPUT: size of ZX Obj\t - ${sizeof(fileObj)} bytes`);
  mylog.debug(`hash: ${fileObj.sha512}`);

  if (filename_ext === ".sna" || filename_ext === ".z80") {
  } else if (filename_ext === ".tap" || filename_ext === ".tzx") {
  } else if (filename_ext === ".dsk" || filename_ext === ".trd" || filename_ext === ".scl") {
  } else if (filename_ext === ".mdr") {
  } else if (filename_ext === ".p" || filename_ext === ".p81" || filename_ext === ".81") {
  } else if (filename_ext === ".zip") {
    result = [fileObj];
    var zipCount = 0;
    try {
      var zip = new AdmZip(filename);
      var zipEntries = zip.getEntries();
      mylog.info(`ZIP file detected, ${zipEntries.length} entries`);

      zipEntries.forEach(async function (zipEntry) {
        if (!zipEntry.isDirectory) {
          try {
            let zxObj = handleFormats.getZXFormat(filename, zipEntry.name, zipEntry.getData());
            if (zxObj !== null) {
              mylog.debug(`addind zip entry (${zipEntry.name}) to list...`);
              zipCount++;
              result.push(zxObj);
            } else {
              mylog.warn(`${zipEntry.name} - not recognized, skipping...`);
            }
          } catch (error) {
            fileObj.error.push({ type: "error", message: `ZIP Entry: ${zipEntry.name} - error, message = ${error}` });
            mylog.error(fileObj.error.push({ type: "error", message: `ZIP Entry: ${zipEntry.name} - error, message = ${error}` }));
          }
        }
      });
    } catch (error) {
      mylog.error(`error reading ZIP file: ${filename}, skipping...`);
      fileObj.error.push({ type: "error", message: `ZIP error, message = ${error}` });
      zipCount = 1;
    }

    mylog.debug(`entries found in ZIP: ${zipCount}`);
    if (zipCount === 0) {
      mylog.warn(`NO known files found in ZIP, removing from list...`);
      return [];
    }
  } else {
    fileObj.type = "?" + filename_ext.substring(1).toLowerCase();
    mylog.warn(`Can't identify file format: ${fileObj.type}`);
    fileObj.scr = "./images/no_image.png";
  }

  const hrend = process.hrtime(hrstart);
  mylog.log(`time() ms: ${hrend[0] * 1000 + hrend[1] / 1000000}`);

  if (fileObj.error.length > 0) {
    mylog.debug(`Problems loading file: ${JSON.stringify(fileObj.error)}`);
    return [fileObj];
  }

  if (result && result.length > 0) {
    mylog.debug(`returning multiple entries: ${result.length}`);
    return result;
  } else {
    mylog.debug(`returning one entry`);
    return [fileObj];
  }
});

ipcMain.handle("open-zxinfo-detail", (event, arg) => {
  const mylog = logger().scope("open-zxinfo-detail");
  mylog.debug(`opening external link: https://zxinfo.dk/details/${arg}`);
  require("electron").shell.openExternal(`https://zxinfo.dk/details/${arg}`);
});

ipcMain.handle("locate-file-and-folder", (event, arg) => {
  const mylog = logger().scope("locate-file-and-folder");
  mylog.debug(`locating folder: ${arg}`);
  shell.showItemInFolder(arg);
});

ipcMain.handle("get-file-jsspeccy", (event, arg) => {
  const mylog = logger().scope("get-file-jsspeccy");
  mylog.log(`prepare file: ${arg.file} - ${arg.subfilename}`);

  var jsspeccy_filename = null;

  if (arg.file && !arg.subfilename) {
    // single file only
    mylog.log(`handling single file: ${arg.file}`);
    var ext = path.parse(arg.file).ext;

    var destPath = null;

    if (isDev) {
      destPath = path.resolve(__dirname + "/tmp");
      mylog.log(`development mode, destPath: ${destPath}`);
      jsspeccy_filename = "./tmp/entryfile" + ext;
    } else {
      destPath = app.getPath("temp");
      mylog.log(`LIVE mode, destPath: ${destPath}`);
      jsspeccy_filename = destPath + "/entryfile" + ext;
    }
    const destFile = destPath + "/entryfile" + ext;
    mylog.log(`destination: ${jsspeccy_filename}`);
    fs.copyFileSync(arg.file, destFile);
  } else if (arg.file && arg.subfilename) {
    // within ZIP
    mylog.log(`handling file within ZIP: ${arg.file} - ${__dirname}`);
    var zip = new AdmZip(arg.file);
    ext = path.parse(arg.subfilename).ext;
    destPath = null;
    if (isDev) {
      destPath = path.resolve(__dirname + "/tmp");
      mylog.log(`development mode, destPath: ${destPath}`);
      jsspeccy_filename = "./tmp/entryfile" + ext;
    } else {
      destPath = app.getPath("temp");
      mylog.log(`LIVE mode, destPath: ${destPath}`);
      jsspeccy_filename = destPath + "/entryfile" + ext;
    }

    mylog.log(`extracting ${arg.subfilename} to '${destPath}/'`);
    zip.extractEntryTo(arg.subfilename, destPath, false, true, "entryfile" + ext);
    // This extract method ignores the outFileName, so perform a rename
    mylog.log(`renaming file to entry.<ext>`);
    fs.renameSync(`${destPath}/${arg.subfilename}`, `${destPath}/${"entryfile" + ext}`);
  } else {
    mylog.warn(`nothing to load...`);
  }

  mylog.log(`returning filename: ${jsspeccy_filename}`);
  return jsspeccy_filename;
});
