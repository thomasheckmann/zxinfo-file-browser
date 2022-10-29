/**
 *
 * https://worldofspectrum.org/faq/reference/z80format.htm
 *
 * C_FORCE.Z80 - v1, compressed
 * CABAL.Z80 - v2, not compressed
 *
 */

const log = require("electron-log");
//log.transports.console.level = 'debug';

function readCompressed(data, length) {
  var zxram = [];

  var pos = 0;
  while (pos < length) {
    var d = data[pos];
    if (data[pos] === 0xed && data[pos + 1] === 0xed) {
      const c = data[pos + 3];
      const rep = data[pos + 2];
      for (let index = 0; index < rep; index++) {
        zxram.push(c);
      }
      pos += 4;
    } else {
      zxram.push(d);
      pos++;
    }
  }

  return zxram;
}

function readV1(data, compressed) {
  const mylog = log.scope("Z80 - readV1");
  mylog.log(`readV1 (${compressed})`);

  const mem = data.subarray(30);
  var zxram = [];

  if (compressed) {
    mylog.debug(`reading compressed v1`);
    return readCompressed(mem, 49152);
  } else {
    mylog.debug(`version NOT supported yet!`);
  }

  return zxram;
}

function readV2(data, compressed) {
  const mylog = log.scope("Z80 - readV2");
  mylog.debug(`(${compressed}), compression ignored`);

  const headerLength = data[30];

  /**
   *   find first memory block
    Byte    Length  Description
        ---------------------------
        0       2       Length of compressed data (without this 3-byte header)
                        If length=0xffff, data is 16384 bytes long and not compressed
        2       1       Page number of block
        3       [0]     Data
   * 
   */

  var zxram = [];

  var index = 32 + headerLength;
  var memBlock = data.subarray(index);
  const allDataLength = memBlock.length;

  while (index < allDataLength) {
    var memBlockLen = memBlock[0] + memBlock[1] * 256;
    var memBlockPage = memBlock[2];

    if (memBlockPage === 8 && memBlockLen !== 0xffff) {
      mylog.debug(`reading compressed page with screen....`);

      return readCompressed(memBlock.subarray(3), memBlockLen);
    }

    memBlock = memBlock.subarray(memBlockLen + 3);
    index += memBlockLen + 3;
  }

  return zxram;
}

function readZ80(data) {
  const mylog = log.scope("readZ80");
  mylog.log(`input: ${data.length}`);

  var snapshot = {};
  var version = 1;
  var compressed = false;

  snapshot.AF = data[0] + data[1] * 256;
  snapshot.BC = data[2] + data[3] * 256;
  snapshot.HL = data[4] + data[5] * 256;
  snapshot.PC = data[6] + data[7] * 256;

  snapshot.SP = data[8] + data[9] * 256;
  snapshot.I = data[10];
  snapshot.R = data[11];

  if (data[12] === 255) {
    data[12] = 1;
  }
  snapshot.border = (data[12] >> 1) & 0b00000111;
  if (data[12] & 0b00010000) {
    mylog.debug(`SAM ROM?`);
  }
  if (data[12] & 0b00100000) {
    compressed = true;
    mylog.debug(`image is compressed`);
  }
  snapshot.DE = data[13] + data[14] * 256;
  snapshot.BCalt = data[15] + data[16] * 256;
  snapshot.DEalt = data[17] + data[18] * 256;
  snapshot.HLalt = data[19] + data[20] * 256;
  snapshot.AFalt = data[21] + data[22] * 256;
  snapshot.IY = data[23] + data[24] * 256;
  snapshot.IX = data[25] + data[26] * 256;
  snapshot.INT = (data[28] < 1) & data[27];

  snapshot.INTmode = data[29] & 0b00000011;

  if (snapshot.PC === 0) {
    mylog.debug(`PC=0, version 2 or 3`);
    const v = data[30];
    if (v === 23) {
      version = 2;
      mylog.debug(`- - extra header length: 23, version 2`);
    } else if (v === 54 || v === 55) {
      version = 3;
      mylog.debug(`- - extra header length: 54 or 55, version 3`);
    }
  }

  snapshot.type = "Z80 v" + version;
  mylog.debug(`snapshot type: ${snapshot.type}`);

  const hwMode = data[34];
  if (version === 1) {
    const zxram = readV1(data, compressed);
    snapshot.data = zxram;
    snapshot.scrdata = new Uint8Array(zxram).subarray(0, 6912);
  } else if (version === 2) {
    const zxram = readV2(data, compressed);
    snapshot.data = zxram;
    snapshot.scrdata = new Uint8Array(zxram).subarray(0, 6912);
    switch (hwMode) {
      case 0:
        snapshot.hwModel = `48k`;
        break;
      case 1:
        snapshot.hwModel = `48k+ if.1`;
        break;
      case 2:
        snapshot.hwModel = `SamRam`;
        break;
      case 3:
        snapshot.hwModel = `128k`;
        break;
      case 4:
        snapshot.hwModel = `128k + if.1`;
        break;
      default:
        snapshot.hwModel = null;
        mylog.error(`unknown hw model: ${hwMode}`);
        break;
    }
  } else if (version === 3) {
    const zxram = readV2(data, compressed);
    snapshot.data = zxram;
    snapshot.scrdata = new Uint8Array(zxram).subarray(0, 6912);
    switch (hwMode) {
      case 0:
        snapshot.hwModel = `48k`;
        break;
      case 1:
        snapshot.hwModel = `48k+ if.1`;
        break;
      case 2:
        snapshot.hwModel = `SamRam`;
        break;
      case 3:
        snapshot.hwModel = `48k + M.G.T.`;
        break;
      case 4:
        snapshot.hwModel = `128k`;
        break;
      case 5:
        snapshot.hwModel = `128k + If.1`;
        break;
      case 6:
        snapshot.hwModel = `128k + M.G.T.`;
        break;
      default:
        snapshot.hwModel = null;
        mylog.error(`unknown hw model: ${hwMode}`);
        break;
    }
  }
  mylog.debug(`model: ${snapshot.hwModel}`);

  return snapshot;
}

exports.readZ80 = readZ80;
