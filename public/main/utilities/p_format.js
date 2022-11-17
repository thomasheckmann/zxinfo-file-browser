/**
 * .P data loaded at 0x4009 = 16393
 * 0x4014 - 16404
 *
 */
const log = require("electron-log");
const Jimp = require("jimp");
const screenZX = require("./handleSCR");

const charset = ' ??????????"`$:?()><=+-*/;,.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function createDIRScreen(dirdata) {
  // create a SCR preview of DIR
  let image = new Jimp(320, 240, Jimp.cssColorToHex("#D7D7D7"), (err, image) => {
    if (err) throw err;
  });

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

  mylog.debug(`program name: ` + program_name);
  const zx81data = readZX81(data.slice(i+1));
  mylog.debug(JSON.stringify(zx81data));

  var snapshot = {};
  snapshot.type = "P81";
  snapshot.hwModel = "ZX81";
  snapshot.scrdata = null;
  snapshot.text = `ZX81 Program: ${program_name}, length = ${zx81data.len}`;

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
  snapshot.scrdata = null;
  snapshot.text = "ZX81 Program: length = " + zx81data.len;

  return snapshot;
}

exports.readP = readP;
exports.readP81 = readP81;
exports.createDIRScreen = createDIRScreen;
