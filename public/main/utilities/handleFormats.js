const log = require("electron-log");
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
const screenZX = require("./handleSCR");

function getZXFormat(fileName, subFileName, data) {
  const mylog = log.scope("getZXFormat");
  mylog.debug(`${fileName}, ${subFileName}, size = ${data.length}`);

  // test if file within zip is supported
  const supportedExts = [".sna", ".z80", ".slt", ".dsk", ".trd", ".scl", ".mdr", ".tap", ".tzx", ".zip"];
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
    error: null,
  };

  let extension;
  if (subFileName && subFileName.length > 0) {
    mylog.info(`processing: ${subFileName}`);
    mylog.debug(`File inside archive`);
    extension = subFileName;
  } else {
    mylog.info(`processing: ${fileName}`);
    mylog.debug(`Single file`);
    extension = fileName;
  }

  let obj;
  if (extension.toLowerCase().endsWith(".sna")) {
    mylog.debug(`handling SNA`);
    obj = snafmt.readSNA(data);
    ZXFileInfo.version = obj.type;
    ZXFileInfo.type = "snafmt";
  } else if (extension.toLowerCase().endsWith(".z80")) {
    mylog.debug(`handling Z80`);
    obj = z80fmt.readZ80(data);
    ZXFileInfo.version = obj.type;
    ZXFileInfo.type = "z80fmt";
  } else if (extension.toLowerCase().endsWith(".tap")) {
    mylog.debug(`handling TAP`);
    obj = tapfmt.readTAP(data);
    ZXFileInfo.version = obj.type;
    ZXFileInfo.type = "tapfmt";
    ZXFileInfo.text = obj.text;
  } else if (extension.toLowerCase().endsWith(".tzx")) {
    mylog.debug(`handling TZX`);
    obj = tzxfmt.readTZX(data);
    ZXFileInfo.version = obj.type;
    ZXFileInfo.type = "tzxfmt";
    ZXFileInfo.text = obj.text;
  } else if (extension.toLowerCase().endsWith(".dsk")) {
    mylog.debug(`handling DSK`);
    obj = dskfmt.readDSK(data);
    ZXFileInfo.version = obj.type;
    ZXFileInfo.type = "dskfmt";
    ZXFileInfo.text = obj.text;
    dskfmt.createDIRScreen(obj.dir_scr).then((res) => {
      if (res.buffer) {
        ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
      } else {
        ZXFileInfo.scr = res;
      }
    });
  } else if (extension.toLowerCase().endsWith(".trd")) {
    mylog.debug(`handling TRD`);
    obj = trdfmt.readTRD(data);
    ZXFileInfo.version = obj.type;
    ZXFileInfo.type = "trdfmt";
    ZXFileInfo.text = obj.text;
    trdfmt.createDIRScreen(obj.dir_scr).then((res) => {
      if (res.buffer) {
        ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
      } else {
        ZXFileInfo.scr = res;
      }
    });
  } else if (extension.toLowerCase().endsWith(".scl")) {
    mylog.debug(`handling SCL`);
    obj = sclfmt.readSCL(data);
    ZXFileInfo.version = obj.type;
    ZXFileInfo.type = "sclfmt";
    ZXFileInfo.text = obj.text;
    sclfmt.createDIRScreen(obj.dir_scr).then((res) => {
      if (res.buffer) {
        ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
      } else {
        ZXFileInfo.scr = res;
      }
    });
  } else if (extension.toLowerCase().endsWith(".mdr")) {
    mylog.debug(`handling MDR`);
    obj = mdrfmt.readMDR(data);
    ZXFileInfo.version = obj.type;
    ZXFileInfo.type = "mdrfmt";
    ZXFileInfo.text = obj.text;
    mdrfmt.createDIRScreen(obj.media_info).then((res) => {
      if (res.buffer) {
        ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
      } else {
        ZXFileInfo.scr = res;
      }
    });
  } else if (extension.toLowerCase().endsWith(".zip")) {
    if (subFileName && subFileName.length > 0) {
      mylog.info(`ZIP inside ZIP, skippiung...`);
      return null;
    } else {
      mylog.debug(`handling ZIP`);
      obj = { version: null, type: null, scrdata: null, error: null };
      ZXFileInfo.type = "zip";
    }
  } else {
    obj = { version: null, type: null, error: "Unhandled file format" };
    ZXFileInfo.type = "?" + path.extname(extension).toLowerCase().substring(1);
    mylog.warn(`Unfandled file format: ${extension}`);
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
    ZXFileInfo.scr = "./images/no_image.png";
    return ZXFileInfo;
  }

  if (obj.scrdata) {
    screenZX.createSCR(obj.scrdata, obj.border).then((res) => {
      if (res.buffer) {
        ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
      } else {
        ZXFileInfo.scr = res;
      }
    });
  } else if (obj.dir_scr) {
  } else if (!ZXFileInfo.scr){
    ZXFileInfo.scr = "./images/no_image.png";
  }

  return ZXFileInfo;
}

exports.getZXFormat = getZXFormat;
