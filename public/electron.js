/**
 * Desktop App with Electron and React: Part 1 - Getting Started with Electron
 *
 * https://youtu.be/Cdu2O6o2DCg
 *
 * IPC - https://www.electronjs.org/docs/latest/tutorial/ipc
 * - one way (toMain), use ipcRenderer.send and ipcMain.on
 * - two way, use ipcRenderer.invoke and ipcMain.handle
 */
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const axios = require("axios");
const Jimp = require("jimp");
const { GifFrame, GifUtil, GifCodec } = require("gifwrap");
const snafmt = require("../src/background/utilities/sna_format");
const z80fmt = require("../src/background/utilities/z80_format");
const log = require("electron-log");

log.transports.console.level = "debug";

async function handleFolderOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (canceled) {
    return;
  } else {
    return filePaths[0];
  }
}

function createWindow() {
  const mylog = log.scope("createWindow");

  mylog.debug("creating window");
  const win = new BrowserWindow({
    width: 1280,
    height: 768,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload.js"), // use a preload script
    },
  });

  win.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  // Open the DevTools.
  if (isDev) {
    mylog.debug("opening DevTools");
    win.webContents.openDevTools();
  }
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

const supportedExts = [".sna", ".z80"];

/**
 *
 * Recursively scans a directory for known files, returns a list of directories with valid files.
 *
 * @param {*} dirPath
 * @param {*} obj
 * @returns
 */
function scanDirectory(dirPath, obj) {
  let filesInDir = 0;
  fs.readdirSync(dirPath).forEach(function (file) {
    let filepath = path.join(dirPath, file);
    let stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      let totalFiles = scanDirectory(filepath, obj).c;
      if (totalFiles > 0) {
        obj.set(filepath, totalFiles);
      }
    } else {
      let extension = path.extname(filepath).toLowerCase();
      if (supportedExts.indexOf(extension) >= 0) {
        filesInDir++;
      }
    }
  });
  if (filesInDir > 0) {
    obj.set(dirPath, filesInDir);
  }
  return { r: obj, c: filesInDir };
}

/**
 * Returns an arrray with names of folders containing known files, sorted
 */
ipcMain.handle("dialog:openFolder", async (event, arg) => {
  const mylog = log.scope("dialog:openFolder");

  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (canceled) {
    mylog.debug(`handle('dialog:openFolder'): CANCEL`);
    return [];
  } else {
    const files = new Map([...scanDirectory(filePaths[0], new Map()).r].sort());

    var result = [];

    files.forEach((value, key) => {
      result.push(key);
    });
    return result;
  }
});

/**
 * Scan a folder for known files, and return sorted array
 */
ipcMain.handle("scan-folder", (event, arg) => {
  const mylog = log.scope("scan-folder");
  mylog.log(`input: ${arg}`);
  var result = [];

  const dirPath = arg; // TODO: Validate input

  let filesInDir = 0;
  fs.readdirSync(dirPath).forEach(function (folder) {
    let filepath = path.join(dirPath, folder);
    let stat = fs.statSync(filepath);
    if (!stat.isDirectory()) {
      let extension = path.extname(filepath).toLowerCase();
      if (supportedExts.indexOf(extension) >= 0) {
        filesInDir++;
        mylog.log(`found a file: ${filepath}, count=${filesInDir}`);
        result.push(filepath);
      }
    }
  });

  return result.sort();
});

/****************************************************************
 * HANDLING SNAPSHOT FILES
 ****************************************************************/

function createSCR(data, border) {
  // console.log(`[createSCR] - border: ${border}`);

  // 76543210
  // FBPPPIII
  // Flash: approx. every 0.64 sec.
  const colors = [
    /* bright 0 */
    "#000000",
    "#0000D7",
    "#D70000",
    "#D700D7",
    "#00D700",
    "#00D7D7",
    "#D7D700",
    "#D7D7D7",
    /* brigth 1 */
    "#000000",
    "#0000FF",
    "#FF0000",
    "#FF00FF",
    "#00FF00",
    "#00FFFF",
    "#FFFF00",
    "#FFFFFF",
  ];

  const offsetX = 32,
    offsetY = 24;

  let frame0 = new Jimp(
    320,
    240,
    Jimp.cssColorToHex(colors[border]),
    (err, image) => {
      if (err) throw err;
    }
  );

  let frame1 = new Jimp(
    320,
    240,
    Jimp.cssColorToHex(colors[border]),
    (err, image) => {
      if (err) throw err;
    }
  );

  var useFlash = false;
  for (let index = 0; index < 6144; index++) {
    const adr = 0x4000 + index;
    const y =
      ((adr & 0b0000011100000000) >> 8) +
      ((adr & 0b0000000011100000) >> 2) +
      ((adr & 0b0001100000000000) >> 5);
    const x = adr & 0b00011111;
    let byte = data[index];

    let attrY = y >> 3;

    let attr = data[6144 + (attrY * 32 + x)];
    let ink = attr & 0b00000111;
    let pap = (attr >> 3) & 0b00000111;
    let flash = attr & 0b10000000;
    let bright = attr & 0b01000000;
    if (bright) {
      ink += 8;
      pap += 8;
    }
    if (flash) {
      useFlash = true;
      //
    }

    for (let b = 0; b < 8; b++) {
      if (byte & (128 >> b)) {
        frame0.setPixelColor(
          Jimp.cssColorToHex(colors[ink]),
          offsetX + x * 8 + b,
          offsetY + y
        );
        if (flash) {
          frame1.setPixelColor(
            Jimp.cssColorToHex(colors[pap]),
            offsetX + x * 8 + b,
            offsetY + y
          );
        } else {
          frame1.setPixelColor(
            Jimp.cssColorToHex(colors[ink]),
            offsetX + x * 8 + b,
            offsetY + y
          );
        }
      } else {
        frame0.setPixelColor(
          Jimp.cssColorToHex(colors[pap]),
          offsetX + x * 8 + b,
          offsetY + y
        );
        if (flash) {
          frame1.setPixelColor(
            Jimp.cssColorToHex(colors[ink]),
            offsetX + x * 8 + b,
            offsetY + y
          );
        } else {
          frame1.setPixelColor(
            Jimp.cssColorToHex(colors[pap]),
            offsetX + x * 8 + b,
            offsetY + y
          );
        }
      }
    }
  }

  if (useFlash) {
    const frames = [];
    let frame = new GifFrame(320, 240, { delayCentisecs: 50 });
    frame.bitmap.data = frame0.bitmap.data;
    frames.push(frame);
    frame = new GifFrame(320, 240, { delayCentisecs: 50 });
    frame.bitmap.data = frame1.bitmap.data;
    frames.push(frame);
    // GifUtil.write("screen.gif", frames, { loops: 0 }).then((gif) => {});
    const codec = new GifCodec();
    return codec.encodeGif(frames, { loops: 0 });
  } else {
    // frame0.write("screen.png");
    return frame0.getBase64Async(Jimp.MIME_PNG);
  }
  return useFlash;
}

/**
 *  identify metadata about file
 *
 * .SNA and 49179 bytes = SNA 48K
 * .SNA and 131103 OR 147487 bytes = SNA 128K
 * .Z80 and ...
 */
ipcMain.handle("load-file", async (event, arg) => {
  const mylog = log.scope("load-file");
  mylog.log(`input: ${arg}`);

  var result = {
    filename: "",
    type: "",
    zxdbID: null,
    zxdbTitle: null,
    data: [],
    scr: null,
    error: null,
  };

  const filename = arg; // TODO: Validate input

  var file = path.basename(filename);
  var directory = path.dirname(filename);
  var extension = path.extname(filename).toLowerCase();

  mylog.log(`file: ${file}, extension: ${extension}, dir: ${directory}`);

  let sum = crypto.createHash("sha512");
  let buf = fs.readFileSync(filename);
  sum.update(buf);
  const sha512 = sum.digest("hex");
  mylog.debug(`sha512: ${sha512}`);

  // lookup filehash from API - https://api.zxinfo.dk/v3/filecheck/{hash}
  let zxdbID = null;
  const dataURL = `https://api.zxinfo.dk/v3/filecheck/${sha512}`;
  mylog.info(`looking sha512 in ZXInfo API - ${file}`);
  await axios
    .get(dataURL)
    .then((response) => {
      result.zxdbID = response.data.entry_id;
      result.zxdbTitle = response.data.title;
      mylog.debug(`YES - found: ${response.data.title}`);
    })
    .catch((error) => {
      result.zxdbID = null;
      result.zxdbTitle = null;
      mylog.warn(`OH NO, NOT found in ZXInfo API: ${sha512}`);
    })
    .finally(() => {});

  result.filename = file;

  var obj;
  if (extension === ".sna") {
    result.type = "snafmt";
    obj = snafmt.readSNA(filename);
  } else if (extension === ".z80") {
    result.type = "z80fmt";
    obj = z80fmt.readZ80(filename);
  } else {
    obj = { version: null, type: null, error: "Unknown file format" };
    result.type = null;
    mylog.warn(`Can't identify file format for: ${file}`);
    mylog.debug(
      `FILE INFO: ${file}, extension: ${extension}, dir: ${directory}`
    );
    result.scr = "https://zxinfo.dk/media/images/placeholder.png";
  }

  if (obj.error) {
    result.error = obj.error;
    result.scr = "https://zxinfo.dk/media/images/placeholder.png";
    return result;
  }

  result.version = obj.type;
  result.hwmodel = obj.hwModel;
  mylog.debug(`snapshot type: ${obj.type}`);

  if (result.type !== null && obj.scrdata !== null) {
    createSCR(obj.scrdata, obj.border).then((res) => {
      if (res.buffer) {
        result.scr = "data:image/gif;base64," + res.buffer.toString("base64");
      } else {
        result.scr = res;
      }
    });
  }

  return result;
});
