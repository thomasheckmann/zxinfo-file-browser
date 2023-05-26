/**
 * .P data loaded at 0x4009 = 16393
 * 0x4014 - 16404
 *
 */
const { logger } = require("../logger.js");
const { ZXInfoCard } = require("../ZXInfoCard");

const Jimp = require("jimp");
const screenZX = require("../utilities/zx81print");
//const screenZX = require("../utilities/handleSCR");

const charset = ' ??????????"`$:?()><=+-*/;,.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function createBASICListAsScr(data) {
  let image = new Jimp(320, 50000, Jimp.cssColorToHex("#D7D7D7"), (err, image) => {
    if (err) throw err;
  });
  return listBasic(image, data, true);
}

function createPreviewSCR(data) {
  let image = new Jimp(320, 240, Jimp.cssColorToHex("#D7D7D7"), (err, image) => {
    if (err) throw err;
  });
  return listBasic(image, data, false);
}

function listBasic(image, zx81, showFullList) {
  const mylog = logger().scope("listBasic");
  mylog.debug(`input: ${zx81.data.length}`);
  mylog.debug(`full list: ${showFullList}`);

  // create BASIC listning
  var x = 0;
  var y = 0; // start upper left
  const mem = zx81.data;
  var cnt = 16509; // start of BASIC in memory
  while (cnt < zx81.d_file) {
    const i = cnt - 16509 + 116;
    const lineNo = mem[i] * 256 + mem[i + 1];
    cnt += 2;
    const lineLen = mem[i + 2] + mem[i + 3] * 256;
    cnt += 2;
    cnt += lineLen;

    // create lineno
    var lineNoTXT = ("    " + lineNo).slice(-4) + " ";
    var lineTxt = "";
    for (var l = 0; l < lineNoTXT.length; l++) {
      if (lineNoTXT.charCodeAt(l) === 32) {
        lineTxt += String.fromCharCode(0); // space
      } else {
        lineTxt += String.fromCharCode(lineNoTXT.charCodeAt(l) - 48 + 0x1c);
      }
    }

    const inREMline = mem[i + 4] === 0xea;
    for (var v = 0; v < lineLen - 1; v++) {
      // omit final newline
      const c = mem[i + 4 + v];
      if (inREMline && c !== 126) {
        lineTxt += String.fromCharCode(c);
      } else if (c === 126) {
        // number
        v += 5;
      } else {
        // just print
        lineTxt += String.fromCharCode(c);
      }
    }

    if ((!showFullList && y < 22) || showFullList) {
      y = screenZX.printZX81(image, x, y, lineTxt, showFullList, inREMline) + 1;
    }
  }

  mylog.debug(`final line: ${y}`);
  // resize image 24 pixels top and bottom, y * 8 lines

  if (showFullList) {
    image.crop(0, 0, 320, 24 + y * 8 + 24);
  }
  // image.write("file.png");
  return image.getBase64Async(Jimp.MIME_PNG);
}

function readZX81(data) {
  const mylog = logger().scope("readZX81");
  mylog.debug(`input: ${data.length}`);

  const zx81_sys_vars = {
    versn: data[0], // 0 for ZX81 basic, 1 or 255
    e_ppc: data[1] + data[2] * 256,
    d_file: data[3] + data[4] * 256,
    vars: data[7] + data[8] * 256,
    e_line: data[11] + data[12] * 256,
    len: data[11] + data[12] * 256 - 0x4009,
  };

  return zx81_sys_vars;
}

function readP81(filename, subfilename, md5hash, data, isPreview) {
  const mylog = logger().scope("readP81");
  mylog.debug(`input: ${data.length}`);
  mylog.info(`processing P81 (ZX81) file, preview only: ${isPreview}`);

  var i = 0;
  var program_name = "";
  for (; data[i] < 128; i++) {
    program_name += charset[data[i] & 0x7f];
  }
  program_name += charset[data[i] & 0x7f];
  mylog.debug(`filename ended: ${i}`);
  mylog.debug(`program name: ` + program_name);
  const zx81data = readZX81(data.slice(i + 1));
  mylog.debug(JSON.stringify(zx81data));

  var zxObject = new ZXInfoCard(filename, subfilename, md5hash);
  // var snapshot = { type: "P81", error: [], scrdata: null, data: [] };
  var regs = {};
  regs.filesize = data.length;

  zxObject.hwmodel = "ZX81";
  //  snapshot.data = { ...zx81data, data: data.slice(i+1,  i+1 +zx81data.len) };
  zxObject.text = `Program: ${program_name}, length = ${zx81data.len}`;
  zxObject.version = "P81";
  zxObject.scrdata_ext = { ...zx81data, data: data.slice(i + 1, i + 1 + 768) };

  if (isPreview) {
    //regs.zx81data = { ...zx81data, data: data.slice(0, 384) };
    zxObject.data = null;
  } else {
    zxObject.data_ext = { ...zx81data, data: data.slice(i +1, zx81data.len) };
  }

  return zxObject;
}

function readP(filename, subfilename, md5hash, data, isPreview) {
  const mylog = logger().scope("readP");
  mylog.debug(`input: ${data.length}`);
  mylog.info(`processing P (ZX81) file, preview only: ${isPreview}`);

  const zx81data = readZX81(data);

  var zxObject = new ZXInfoCard(filename, subfilename, md5hash);

  var regs = {};
  regs.filesize = data.length;

  zxObject.hwmodel = "ZX81";
  zxObject.text = "Program: length = " + zx81data.len;
  zxObject.version = "P";
  zxObject.scrdata_ext = { ...zx81data, data: data.slice(0, 768) };

  if (isPreview) {
    //regs.zx81data = { ...zx81data, data: data.slice(0, 384) };
    zxObject.data = null;
  } else {
    zxObject.data_ext = { ...zx81data, data: data.slice(0, zx81data.len) };
  }

  return zxObject;
}

exports.readP = readP;
exports.readP81 = readP81;
exports.createPreviewSCR = createPreviewSCR;
exports.createBASICListAsScr = createBASICListAsScr;
