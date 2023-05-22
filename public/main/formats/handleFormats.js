const {logger} = require("../logger.js");
const crypto = require("crypto");
const path = require("path");

const snafmt = require("./sna_format");
const z80fmt = require("./z80_format");
const tapfmt = require("./tap_format");
const tzxfmt = require("./tzx_format");
const dskfmt = require("./dsk_format");
const trdfmt = require("./trd_format");
const sclfmt = require("./scl_format");
const mdrfmt = require("./mdr_format");
const pfmt = require("./p_format");

const screenZX = require("../utilities/handleSCR");

function getZXFormat(fileName, subFileName, data) {
  const mylog = logger().scope("getZXFormat");
  mylog.debug(`${fileName}, ${subFileName}, size = ${data.length}`);

  // test if file within zip is supported
  const supportedExts = [".sna", ".z80", ".slt", ".dsk", ".trd", ".scl", ".mdr", ".tap", ".tzx", ".p", ".p81", ".81", ".zip"];
  if (subFileName && subFileName.length > 0) {
    let fileExt = path.extname(subFileName).toLowerCase();
    if (supportedExts.indexOf(fileExt) < 0) return null;
  }

  // Calculate sha512 value
  let sum = crypto.createHash("sha512");
  sum.update(data);

  let ZXFileInfo = {
    filepath: fileName,
    filename: path.basename(fileName),
    subfilename: subFileName,
    text: null,
    version: null,
    type: null,
    sha512: sum.digest("hex"),
    scr: null,
    error: [],
  };

  var filename;
  var fileext;
  if (subFileName && subFileName.length > 0) {
    mylog.info(`processing: ${subFileName}`);
    mylog.debug(`File inside archive`);
    filename = subFileName.toLowerCase();
    fileext = path.extname(filename).substring(1);
  } else {
    mylog.info(`processing: ${fileName}`);
    mylog.debug(`Single file`);
    filename = fileName.toLowerCase();
    fileext = path.extname(filename).substring(1);
  }

  let obj;

  const fLookup = new Map([
    ["sna", { f: snafmt.readSNA, t: "snafmt" }],
    ["z80", { f: z80fmt.readZ80, t: "z80fmt" }],
    ["tap", { f: tapfmt.readTAP, t: "tapfmt" }],
    ["tzx", { f: tzxfmt.readTZX, t: "tzxfmt" }],
    ["dsk", { f: dskfmt.readDSK, fscr: dskfmt.createDIRScreen, t: "dskfmt" }],
    ["trd", { f: trdfmt.readTRD, fscr: trdfmt.createDIRScreen, t: "trdfmt" }],
    ["scl", { f: sclfmt.readSCL, fscr: sclfmt.createDIRScreen, t: "sclfmt" }],
    ["mdr", { f: mdrfmt.readMDR, fscr: mdrfmt.createDIRScreen, t: "mdrfmt" }],
    ["p", { f: pfmt.readP, fscr: pfmt.createPreviewSCR, t: "pfmt" }],
    ["p81", { f: pfmt.readP81, fscr: pfmt.createPreviewSCR, t: "pfmt" }],
    ["81", { f: pfmt.readP, fscr: pfmt.createPreviewSCR, t: "pfmt" }],
  ]);

  const fn = fLookup.get(fileext);
  if (fileext === "sna" || fileext === "z80" || fileext === "tap" || fileext === "tzx") {
    mylog.debug(`handling ${fileext}`);
    obj = fn.f(data);
    ZXFileInfo.version = obj.type;
    ZXFileInfo.data = obj.data;
    ZXFileInfo.type = fn.t;
    ZXFileInfo.text = obj.text; // not found in sna & z80
    ZXFileInfo.border = obj.border; // not found in tap

    if (obj.hwModel === "ZX81" && fn.t === "tzxfmt") {
      mylog.info(`TZX detected as ZX81 format... processing as P81`);
      const orgType = obj.type;
      obj = pfmt.readP81(obj.zx81);
      ZXFileInfo.version = orgType;
      // keep filesize and data.tape from TZX, but add zx81data
      ZXFileInfo.data.zx81data = obj.data.zx81data;
      ZXFileInfo.type = "tzxfmt";
      ZXFileInfo.text = obj.text;
      pfmt.createPreviewSCR(obj.data.zx81data).then((res) => {
        if (res.buffer) {
          ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
        } else {
          ZXFileInfo.scr = res;
        }
      });
    }
  } else if (fileext === "dsk" || fileext === "trd" || fileext === "scl" || fileext === "mdr") {
    mylog.debug(`handling ${fileext}`);
    obj = fn.f(data);
    ZXFileInfo.version = obj.type;
    ZXFileInfo.data = obj.data;
    ZXFileInfo.type = fn.t;
    ZXFileInfo.text = obj.text;
    ZXFileInfo.protection = obj.protection;
    ZXFileInfo.diskdata = obj.dir_scr;
    fn.fscr(obj.dir_scr).then((res) => {
      if (res.buffer) {
        ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
      } else {
        ZXFileInfo.scr = res;
      }
    });
  } else if (fileext === "p" || fileext === "p81" || fileext === "81") {
    mylog.debug(`handling ${fileext}`);
    obj = fn.f(data);
    ZXFileInfo.version = obj.type;
    ZXFileInfo.data = obj.data;
    ZXFileInfo.type = fn.t;
    ZXFileInfo.text = obj.text;
    fn.fscr(obj.data.zx81data).then((res) => {
      if (res.buffer) {
        ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
      } else {
        ZXFileInfo.scr = res;
      }
    });
  } else if (fileext === "zip") {
    if (subFileName && subFileName.length > 0) {
      mylog.info(`ZIP inside ZIP, skippiung...`);
      return null;
    } else {
      mylog.debug(`handling ZIP`);
      obj = { version: null, type: null, scrdata: null, error: null };
      ZXFileInfo.type = "zip";
      ZXFileInfo.data = { filesize: data.length };
      ZXFileInfo.version = "ZIP file: " + ZXFileInfo.filename;
    }
  } else {
    obj = { version: null, type: null, error: "Unhandled file format" };
    ZXFileInfo.type = "?" + path.extname(filename).toLowerCase().substring(1);
    mylog.warn(`Unfandled file format: ${filename}`);
    ZXFileInfo.scr = "./images/no_image.png";
  }

  if (obj.version) {
    ZXFileInfo.version = obj.version;
  }
  if (obj.hwModel) {
    ZXFileInfo.hwmodel = obj.hwModel;
  }

  if (obj.error) {
    ZXFileInfo.error = obj.error;
  }

  if (obj.scrdata) {
    screenZX.createSCR(obj.scrdata, ZXFileInfo.border).then((res) => {
      if (res.buffer) {
        ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
      } else {
        ZXFileInfo.scr = res;
      }
    });
  } else if (obj.dir_scr) {
  } else if (!ZXFileInfo.scr) {
    ZXFileInfo.scr = "./images/no_image.png";
  }

  return ZXFileInfo;
}

exports.getZXFormat = getZXFormat;
