/**
 * O & .80 files, used by ZX80 emulators
 *
 * https://problemkaputt.de/zxdocs.htm#zx80zx81cassettefileimages
 *
 *
 */
const { logger } = require("../logger.js");
const { ZXInfoCard } = require("../ZXInfoCard");
const Jimp = require("jimp");
const screenZX = require("../utilities/zx80print");
const { mapFromASCII } = require("../utilities/zx80print");

function readO(filename, subfilename, md5hash, data, isPreview) {
  const mylog = logger().scope("readO");
  mylog.debug(`input: ${data.length}`);
  mylog.info(`processing O (ZX80) file, preview only: ${isPreview}`);

  const zx81data = {};
  const e_line = data[0x0a] + data[0x0b] * 256;
  zx81data.e_line = e_line;
  zx81data.vars = data[0x08] + data[0x09] * 256;
  zx81data.len = e_line - 16384;
  mylog.info(`E_LINE: ${e_line}, VARS: ${zx81data.vars} (${zx81data.len})`);

  var zxObject = new ZXInfoCard(filename, subfilename, md5hash);

  var regs = {};
  regs.filesize = data.length;

  zxObject.hwmodel = "ZX80";
  zxObject.text = "Program: length = " + zx81data.len;
  zxObject.version = "O";
  mylog.debug(zxObject);

  zxObject.scrdata_ext = { ...zx81data, data: data.slice(0, 768) };

  if (isPreview) {
    zxObject.data = null;
  } else {
    zxObject.data_ext = { ...zx81data, data: data.slice(0, zx81data.len) };
  }

  return zxObject;
}

function listBasic(image, zx81, showFullList) {
  const mylog = logger().scope("listBasic");
  mylog.debug(`input: ${zx81.data.length}`);
  mylog.debug(`full list: ${showFullList}`);

  // create BASIC listning
  var x = 0;
  var y = 0; // start upper left
  const mem = zx81.data;

  var memPtr = 0x4028 - 0x4000; //   4028..(4008)-1            Basic Program

  var keepGoing = true;
  while (keepGoing) {
    const lineNo = mem[memPtr] * 256 + mem[memPtr + 1];
    memPtr += 2;

    mylog.debug(`found lineno: ${lineNo}`);
    if(lineNo > 9999) {
      keepGoing = false;
      break;
    }
    // create lineno
    var lineNoTXT = ("    " + lineNo).slice(-4) + " ";
    var lineData = ""; // String using ZX81 chars (0 = space)
    for (var l = 0; l < lineNoTXT.length; l++) {
      if (lineNoTXT.charCodeAt(l) === 32) {
        lineData += String.fromCharCode(mapFromASCII.get(" ")); // space
      } else {
        lineData += String.fromCharCode(mapFromASCII.get(lineNoTXT[l]));
      }
    }

    // read until EOF 0x76 (unless in REM)
    var lineLen = 0;
    const inREMline = mem[memPtr] === 0xfe;
    if (inREMline) {
      mylog.debug(`${lineNoTXT} is REM statement...`);
    }
    while (mem[memPtr + lineLen] !== 0x76 && lineLen < 512) {
      const val = mem[memPtr + lineLen];
      lineData += String.fromCharCode(val);
      lineLen++;
    }
    memPtr += lineLen + 1;

    mylog.debug(`${lineNo} - len: ${lineLen}, adr: ${memPtr+0x4000} (vars: ${zx81.vars}) [${lineNoTXT}]`);

    if ((!showFullList && y < 22) || showFullList) {
      y = screenZX.printZX80(image, x, y, lineData, showFullList, inREMline) + 1;
    }

    keepGoing = memPtr < zx81.vars - 0x4000;
  }

  mylog.debug(`final line: ${y}`);
  // resize image 24 pixels top and bottom, y * 8 lines

  if (showFullList) {
    image.crop(0, 0, 320, 24 + y * 8 + 24);
  }
  // image.write("file.png");
  return image.getBase64Async(Jimp.MIME_PNG);
}

function createPreviewSCR(data) {
    var bgColor = "#D7D7D7";
    let image = new Jimp(320, 240, Jimp.cssColorToHex(bgColor), (err, image) => {
      if (err) throw err;
    });
    return listBasic(image, data, false);
  }
  
function createBASICListAsScr(data) {
  var bgColor = "#D7D7D7";
  let image = new Jimp(320, 50000, Jimp.cssColorToHex(bgColor), (err, image) => {
    if (err) throw err;
  });
  return listBasic(image, data, true);
}

exports.readO = readO;
exports.createPreviewSCR = createPreviewSCR;
exports.createBASICListAsScr = createBASICListAsScr;
