const { logger } = require("../logger.js");
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
const { ZXInfoCard } = require("../ZXInfoCard");

function getZXFormat(fileName, subFileName, data, isPreview) {
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

  // let ZXFileInfo = {
  //   filepath: fileName, // full filepath
  //   filename: path.basename(fileName), // base filename incl. extension
  //   subfilename: subFileName, // filename, if within ZIP archive
  //   text: null, // additional text/info to display, e.g. Program name
  //   type: null, // dskfmt, tapfmt etc...
  //   version: null,  //
  //   sha512: sum.digest("hex"),
  //   scr: null,  // screenshot as base64
  //   error: [],
  // };

  let ZXFileInfo = null;

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
  if (
    fileext === "scl" ||
    fileext === "trd" ||
    fileext === "dsk" ||
    fileext === "mdr" ||
    fileext === "81" ||
    fileext === "p81" ||
    fileext === "p" ||
    fileext === "sna" ||
    fileext === "z80" ||
    fileext === "tap" ||
    fileext === "tzx"
  ) {
    mylog.debug(`handling ${fileext}`);
    ZXFileInfo = fn.f(fileName, subFileName, sum.digest("hex"), data, isPreview);
    ZXFileInfo.type = fn.t;

    // process TZX as P81 format
    if (ZXFileInfo.hwmodel === "ZX81" && fn.t === "tzxfmt") {
      mylog.info(`TZX detected as ZX81 format... processing as P81`);
      const sha512 = ZXFileInfo.sha512;
      ZXFileInfo = pfmt.readP81(fileName, subFileName, sha512, ZXFileInfo.zx81, isPreview);
      ZXFileInfo.type = fn.t;
      pfmt.createPreviewSCR(ZXFileInfo.scrdata_ext).then((res) => {
        if (res.buffer) {
          ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
        } else {
          ZXFileInfo.scr = res;
        }
      });
      ZXFileInfo.scrdata_ext = null;
    }

    // for SNA, Z80 and TAP - generated SCR from ZX Spectrum layout
    if (ZXFileInfo.scrdata) {
      screenZX.createSCR(ZXFileInfo.scrdata, ZXFileInfo.border).then((res) => {
        if (res.buffer) {
          ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
        } else {
          ZXFileInfo.scr = res;
        }
      });
      ZXFileInfo.scrdata = null;
    } else if (ZXFileInfo.scrdata_ext) {
      fn.fscr(ZXFileInfo.scrdata_ext).then((res) => {
        if (res.buffer) {
          ZXFileInfo.scr = "data:image/gif;base64," + res.buffer.toString("base64");
        } else {
          ZXFileInfo.scr = res;
        }
      });
      ZXFileInfo.scrdata_ext = null;
    }
  } else if (fileext === "zip") {
    if (subFileName && subFileName.length > 0) {
      mylog.info(`ZIP inside ZIP, skippiung...`);
      return null;
    } else {
      mylog.debug(`handling ZIP`);
      ZXFileInfo = new ZXInfoCard(filename, subFileName, sum.digest("hex"));
      ZXFileInfo.type = "zip";
      ZXFileInfo.data = { filesize: data.length };
      ZXFileInfo.version = null;
    }
  } else {
    ZXFileInfo = new ZXInfoCard(filename, subFileName, sum.digest("hex"));
    ZXFileInfo.error.push({error: "Unhandled file format"});
    ZXFileInfo.type = "?" + path.extname(filename).toLowerCase().substring(1);
    mylog.warn(`Unfandled file format: ${filename}`);
  }

  // catch all image
  if (!ZXFileInfo.scr) {
    ZXFileInfo.scr = "./images/no_image.png";
    ZXFileInfo.scrdata = null;
    ZXFileInfo.scrdata_ext = null;
  }

  return ZXFileInfo;
}

exports.getZXFormat = getZXFormat;
