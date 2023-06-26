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
  var bgColor = "#D7D7D7";
  if(data.versn === 255) {
    bgColor = "#000000";
  }
  let image = new Jimp(320, 50000, Jimp.cssColorToHex(bgColor), (err, image) => {
    if (err) throw err;
  });
  return listBasic(image, data, true);
}

function createPreviewSCR(data) {
  var bgColor = "#D7D7D7";
  if(data.versn === 255) {
    bgColor = "#000000";
  }
  let image = new Jimp(320, 240, Jimp.cssColorToHex(bgColor), (err, image) => {
    if (err) throw err;
  });
  return listBasic(image, data, false);
}

function listBasic(image, zx81, showFullList) {
  const mylog = logger().scope("listBasic");
  mylog.debug(`input: ${zx81.data.length}`);
  mylog.debug(`full list: ${showFullList}`);
  mylog.info(`${zx81.versn === 0 ? "ZX81" : "Lambda 8300"}`);

  // create BASIC listning
  var x = 0;
  var y = 0; // start upper left
  const mem = zx81.data;

  var cnt = 16509; // 0x407d - start of BASIC in memory
  if (zx81.versn === 255) {
    // Lambda 8300
    cnt = 0x4396;
    mylog.debug(`Lambda 8300: d_file -> program (0x${zx81.d_file.toString(16)}) - should be 0x407d`);
  }

  var keepGoing = true;
  if (zx81.versn === 0) {
    keepGoing = cnt < zx81.d_file - 1;
  } else {
  }

  while (keepGoing) {
    const i = cnt - 16509 + 116;
    const lineNo = mem[i] * 256 + mem[i + 1];
    cnt += 2;
    const lineLen = mem[i + 2] + mem[i + 3] * 256;
    cnt += 2;
    cnt += lineLen;

    // create lineno
    var lineNoTXT = ("    " + lineNo).slice(-4) + " ";
    var lineTxt = ""; // String using ZX81 chars (0 = space)
    for (var l = 0; l < lineNoTXT.length; l++) {
      if (lineNoTXT.charCodeAt(l) === 32) {
        lineTxt += String.fromCharCode(0); // space
      } else {
        lineTxt += String.fromCharCode(lineNoTXT.charCodeAt(l) - 48 + 0x1c);
      }
    }

    mylog.debug(`${lineNo} - len: ${lineLen}, adr: ${cnt} (d_file: ${zx81.d_file})`);

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
      y = screenZX.printZX81(image, x, y, lineTxt, showFullList, inREMline, zx81.versn) + 1;
    }

    if (zx81.versn === 255) {
      // Lambda 8300: The BASIC program is terminated by an FFh byte (ZX81 has no such end byte).
      keepGoing = mem[cnt - 16509 + 116] !== 255;
      if(mem[cnt - 16509 + 116] === undefined ) keepGoing = false;
    } else {
      keepGoing = cnt < zx81.d_file - 1;
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
    d_file: data[0] === 0 ? data[3] + data[4] * 256 : 0x407d, // D_FILE is hardcoded at 407Dh, D_FILE is always expanded (full 1+33*24 bytes). BASIC program is located after D_FILE (ie. always at 4396h since D_FILE has fixed size)
    vars: data[7] + data[8] * 256,
    e_line: data[11] + data[12] * 256,
    len: data[11] + data[12] * 256 - 0x4009,
  };

  mylog.debug(`versn: ${data[0]} - 0 for ZX81 Basic, 255 for Lambda 8300`);
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
    zxObject.data_ext = { ...zx81data, data: data.slice(i + 1, zx81data.len) };
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

  if(zx81data.versn === 255) {
    zxObject.hwmodel = "Lambda 8300";
    zxObject.scrdata_ext = { ...zx81data, data: data.slice(0, 792+768) };
  }

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
