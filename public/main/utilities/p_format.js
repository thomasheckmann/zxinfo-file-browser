/**
 * .P data loaded at 0x4009 = 16393
 * 0x4014 - 16404
 *
 */
const log = require("electron-log");
const Jimp = require("jimp");
const screenZX = require("./handleSCR");

const charset = ' ??????????"`$:?()><=+-*/;,.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function createDIRScreen(zx81) {
  const mylog = log.scope("createDIRScreen");
  mylog.debug(`input: ${zx81.data.length}`);

  // create a SCR preview of DIR
  let image = new Jimp(320, 240, Jimp.cssColorToHex("#D7D7D7"), (err, image) => {
    if (err) throw err;
  });

  // create BASIC listning
  var x = 0;
  var y = 0; // start upper left
  const mem = zx81.data;
  var cnt = 16509; // start of BASIC in memory
  // var i = 116;
  while (cnt < zx81.d_file) {
    const i = cnt - 16509 + 116;
    const lineNo = mem[i] * 256 + mem[i + 1];
    cnt += 2;
    const lineLen = mem[i + 2] + mem[i + 3] * 256;
    cnt += 2;
    cnt += lineLen;

    const inREMline = mem[i + 4] === 0xea;

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

    for (var v = 0; v < lineLen-1; v++) { // omit final newline
      const c = mem[i + 4 + v];
      if (inREMline) {
        lineTxt += String.fromCharCode(c);
      } else if (c === 126) { // number
        v += 5;
      } else if (c === 118) { // newline
      } else { // just print
        lineTxt += String.fromCharCode(c);
      }
    }
    if (y < 22) y = screenZX.printAtZX81(image, x, y, lineTxt) + 1;
  }

  // image.write("file.png");
  return image.getBase64Async(Jimp.MIME_PNG);
}

function readZX81(data) {
  const mylog = log.scope("readZX81");
  mylog.debug(`input: ${data.length}`);

  const zx81_sys_vars = {
    versn: data[0], // 0 for ZX81 basic
    e_ppc: data[1] + data[2] * 256,
    d_file: data[3] + data[4] * 256,
    vars: data[7] + data[8] * 256,
    e_line: data[11] + data[12] * 256,
    len: data[11] + data[12] * 256 - 0x4009,
  };

  return zx81_sys_vars;
}

function readP81(data) {
  const mylog = log.scope("readP81");
  mylog.debug(`input: ${data.length}`);

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

  var snapshot = {};
  snapshot.type = "P81";
  snapshot.hwModel = "ZX81";
//  snapshot.data = { ...zx81data, data: data.slice(i+1,  i+1 +zx81data.len) };
  snapshot.data = { ...zx81data, data: data.slice(i+1,  i+1 +zx81data.len) };
  snapshot.text = `ZX81 Program: ${program_name}, length = ${zx81data.len}`;

  mylog.debug(snapshot.text);
  return snapshot;
}

function readP(data) {
  const mylog = log.scope("readP");
  mylog.debug(`input: ${data.length}`);

  const zx81data = readZX81(data);
  mylog.debug(JSON.stringify(zx81data));

  var snapshot = {};
  snapshot.type = "P";
  snapshot.hwModel = "ZX81";
  snapshot.data = { ...zx81data, data: data.slice(0, zx81data.len) };
  snapshot.text = "ZX81 Program: length = " + zx81data.len;

  return snapshot;
}

exports.readP = readP;
exports.readP81 = readP81;
exports.createDIRScreen = createDIRScreen;
