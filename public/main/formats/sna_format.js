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
const { logger } = require("../logger.js");
const { ZXInfoCard } = require("../ZXInfoCard");

function readSNA(filename, subfilename, md5hash, data, isPreview) {
  const mylog = logger().scope("readSNA");
  mylog.debug(`input: ${data.length}`);
  mylog.info(`processing SNA file, preview only: ${isPreview}`);

  var zxObject = new ZXInfoCard(filename, subfilename, md5hash);

  var is128K = false;
  // 48K or 128K?
  var fileSize = data.length;
  if (fileSize === 49179) {
    mylog.debug(`processing SNA 48K file...`);
    zxObject.version = "SNA 48K";
    zxObject.hwmodel = "48k";
    is128K = false;
  } else if (fileSize === 131103 || fileSize === 147487) {
    mylog.debug(`processing SNA 128K file...`);
    zxObject.version = "SNA 128K";
    zxObject.hwmodel = "128k";
    is128K = true;
  } else {
    zxObject.error.push({ type: "error", message: "Corrupt or unknown SNA format" });
    mylog.warn(`Corrupt or unknown SNA format`);
    return zxObject;
  }
  zxObject.border = data[26];

  // set screen data
  zxObject.scrdata = data.subarray(27, 6912 + 27);

  if (!isPreview) {
    // fill out full object
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
    regs.border = zxObject.border;

    if (is128K) {
      regs.PC = data[49179] + data[49180] * 256;
      regs.port_0x7ffd = data[49181];
      regs.TRDOS = data[49182];
    }

    regs.filesize = fileSize;
    zxObject.data = regs; // data.subarray(27);
  }

  return zxObject;
}

exports.readSNA = readSNA;
