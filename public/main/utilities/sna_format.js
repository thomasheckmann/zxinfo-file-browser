/**
 *
 * https://worldofspectrum.org/faq/reference/formats.htm
 *
 * 
 * snapshot = {
 *    I, HLalt,....
 *    HL, ... IX, IY
 *    data,
 *    srcdata,
 *    type,
 *    error,
 * }
 */
const log = require("electron-log");
//log.transports.console.level = 'debug';

function readSNA(data) {
  const mylog = log.scope("readSNA48K");
  mylog.info(`input: ${data.length}`);

  var snapshot = {};

  // 48K or 128K?
  var fileSize = data.length;
  if(fileSize === 49179) {
    snapshot.type = "SNA 48K";
  } else if (fileSize === 131103 || fileSize === 147487) {
    snapshot.type = "SNA 128K";
  } else {
    snapshot.error = "Corrupt or unknown SNA format"
    return snapshot;
  }

  snapshot.I = data[0];
  snapshot.HLalt = data[1] + data[2] * 256;
  snapshot.DEalt = data[3] + data[4] * 256;
  snapshot.BCalt = data[5] + data[6] * 256;
  snapshot.AFalt = data[7] + data[8] * 256;

  snapshot.HL = data[9] + data[10] * 256;
  snapshot.DE = data[11] + data[12] * 256;
  snapshot.BC = data[13] + data[14] * 256;
  snapshot.IY = data[15] + data[16] * 256;
  snapshot.IX = data[17] + data[18] * 256;

  snapshot.INT = data[19];
  snapshot.R = data[20];

  snapshot.AF = data[21] + data[22] * 256;
  snapshot.SP = data[23] + data[24] * 256;

  snapshot.INTmode = data[25];
  snapshot.border = data[26];

  snapshot.data = data.subarray(27);
  snapshot.scrdata = snapshot.data.subarray(0, 6912);

  return snapshot;
}

exports.readSNA = readSNA;
