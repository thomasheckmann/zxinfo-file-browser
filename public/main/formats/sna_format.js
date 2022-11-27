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
  mylog.debug(`input: ${data.length}`);

  var snapshot = { error: [], scrdata: null, data: [] };

  var is128K = false;
  // 48K or 128K?
  var fileSize = data.length;
  if (fileSize === 49179) {
    mylog.debug(`processing SNA 48K file...`);
    snapshot.type = "SNA 48K";
    is128K = false;
  } else if (fileSize === 131103 || fileSize === 147487) {
    mylog.debug(`processing SNA 128K file...`);
    snapshot.type = "SNA 128K";
    is128K = true;
  } else {
    snapshot.error.push({ type: "error", message: "Corrupt or unknown SNA format" });
    mylog.warn(`Corrupt or unknown SNA format`);
    return snapshot;
  }

  var regs = {};
  regs.I = data[0];
  regs.HLalt = data[1] + data[2] * 256;
  regs.DEalt = data[3] + data[4] * 256;
  regs.BCalt = data[5] + data[6] * 256;
  regs.AFalt = data[7] + data[8] * 256;

  regs.HL = data[9] + data[10] * 256;
  regs.DE = data[11] + data[12] * 256;
  regs.BC = data[13] + data[14] * 256;
  regs.IY = data[15] + data[16] * 256;
  regs.IX = data[17] + data[18] * 256;

  regs.INT = data[19];
  regs.R = data[20];

  regs.AF = data[21] + data[22] * 256;
  regs.SP = data[23] + data[24] * 256;

  regs.INTmode = data[25];
  regs.is128K = is128K;
  snapshot.border = data[26];
  regs.border = snapshot.border;

  if (is128K) {
    regs.PC = data[49179] + data[49180] * 256;
    regs.port_0x7ffd = data[49181];
    regs.TRDOS = data[49182];
  }

  regs.filesize = fileSize;

  snapshot.data = regs; // data.subarray(27);
  snapshot.scrdata = data.subarray(27, 6912 + 27);

  return snapshot;
}

exports.readSNA = readSNA;
