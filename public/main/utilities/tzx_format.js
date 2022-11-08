/**
 *
 * https://worldofspectrum.net/features/TZXformat.html
 *
 *    data,
 *    srcdata,
 *    type,
 *    error,
 * }
 */

const log = require("electron-log");
const util = require("./tape_util");

function getWord(low, high) {
  return high * 256 + low;
}

function getDWord(n1, n2, n3, n4) {
  return n4 * 16777216 + n3 * 65556 + n2 * 256 + n1;
}

function getNWord(low, med, high) {
  return (high << 16) + (med << 8) + low;
}

function TZXObject(major, minor) {
  this.major = major;
  this.minor = minor;
  this.blocks = [];
}

/**
 *
 * TZX Block Structure
 *
 */

// ID 0x10
function StandardSpeedDataBlock(len, data) {
  const mylog = log.scope("StandardSpeedDataBlock");
  this.id = 0x10;
  this.blockName = "Standard Speed Data Block";
  this.length = getWord(data[0x02], data[0x03]);
  this.pause = getWord(data[0], data[1]);
  // const dataLen = getWord(data[2], data[3]);
  this.blockType = data[0x04] === 0 ? "Header" : "Data";
  this.data = data.subarray(0x04, 0x04 + data.length);
  this.text = `Type: ${this.blockType}, Pause: ${this.pause}, Block len: ${len}`;
  mylog.info(`Data length: ${this.length}`);
  if (this.data[0] === 0) {
    this.block = util.createHeader(this.data);
  } else if (this.data[0] === 255) {
    this.block = util.createData(this.data);
    this.block.type = "...data";
  } else {
    mylog.warn(`found unknown block: ${this.data[0]}`);
    this.block = { flag: this.data[0], data: null, error: `found unknown block: ${this.data[0]}` };
  }
}

// ID 0x11
function TurboSpeedDataBlock(len, data) {
  const mylog = log.scope("TurboSpeedDataBlock");
  this.id = 0x10;
  this.blockName = "Turbo Speed Data Block";
  this.length = getWord(data[0x0f], data[0x10], data[0x11]);
  this.pause = getWord(data[0x0d], data[0x0e]);
  this.blockType = data[0x12] === 0 ? "Header" : "Data";
  this.data = data.slice(0x12, 0x12 + data.length);
  this.text = `Type: ${this.blockType}, Pause: ${this.pause}, Block len: ${len}`;
  mylog.info(`Data length: ${this.length}`);
  if (this.data[0] === 0 && this.length === 19) {
    this.block = util.createHeader(this.data);
  } else {
    this.block = util.createRAWData(this.data);
    this.block.type = "...data";
    this.block.name = "Turbo Speed Data";
  }
}

// ID 0x12
function PureTone(len, data) {
  const mylog = log.scope("PureTone");
  this.id = 0x12;
  this.blockName = "Pure Tone";
  this.length = len;
  this.pulseLen = getWord(data[0], data[1]);
  this.pulseCount = getWord(data[2], data[3]);
  this.text = `Count: ${this.pulseCount}, Length: ${this.pulseLen} T-states`;
}

// ID 0x13
function PulseSequence(len, data) {
  const mylog = log.scope("PulseSequence");
  this.id = 0x13;
  this.blockName = "Pulse sequence";
  this.length = len;
  this.pulseCount = data[0];
  this.pulseLen = getWord(data[1], data[2]);
  this.text = `Count: ${this.pulseCount}, Length: ${this.pulseLen}`;
}

// ID 0x14
function PureDataBlock(len, data) {
  const mylog = log.scope("PureDataBlock");
  this.id = 0x14;
  this.blockName = "Pure Data Block";
  this.length = len;
  this.zeroLen = getWord(data[0], data[1]);
  this.oneLen = getWord(data[2], data[3]);
  this.lastByte = data[4];
  this.pause = getWord(data[5], data[6]);
  const datalen = getNWord(data[7], data[8], data[9]);
  this.data = data.slice(0x0a, 0x0a + datalen);
  this.text = `0-bit length: ${this.zeroLen}, 1-bit length: ${this.oneLen}, last byte: ${this.lastByte}, Pause: ${this.pause}`;
}

// ID 0x15 TODO: Direct
function DirectRecordingBlock(len, data) {
  const mylog = log.scope("DirectRecordingBlock");
  this.id = 0x14;
  this.blockName = "Direct Rercodring Block";
  this.length = len;
  this.block = { type: "Direct Rercodring Block", name: "" };
}
// ID 0x18 TODO: CSW

// ID 19
function GeneralizedDataBlock(len, data) {
  const mylog = log.scope("GeneralizedDataBlock");
  this.id = 0x19;
  this.blockName = "Generalized Data Block";
  this.length = len;
  this.pause = getWord(data[0x04], data[0x05]);
  this.totp = getDWord(data[0x06], data[0x07], data[0x08], data[0x09]);
  this.npp = data[0x0a];
  this.asp = data[0x0b];
  this.totd = getDWord(data[0x0c], data[0x0d], data[0x0e], data[0x0f]);
  this.npd = data[0x10];
  this.asd = data[0x11];

  this.text = `totp:${this.totp}, npp:${this.npp}, asp:${this.asp}, totd:${this.totd}, npd:${this.npd}, asd:${this.asd}, Pause: ${this.pause}`;
  this.data = data;
}

// ID 20
function PauseStopTape(len, pause) {
  const mylog = log.scope("PauseStopTape");
  this.id = 0x20;
  this.blockName = "Pause (silence) or 'Stop the Tape' command";
  this.length = len;
  this.data = pause;
}

// ID 21
function GroupStart(len, data) {
  const mylog = log.scope("GroupStart");
  this.id = 0x21;
  this.blockName = "Group start";
  this.text = String.fromCharCode.apply(null, data);
  this.length = len;
  this.data = String.fromCharCode.apply(null, data);
}

// ID 22
function GroupEnd() {
  const mylog = log.scope("GroupEnd");
  this.id = 0x22;
  this.blockName = "Group end";
}

// ID 23 TODO: Jump to block

// ID 24
function LoopStart(len, data) {
  const mylog = log.scope("LoopStart");
  this.id = 0x24;
  this.blockName = "Loop start";
  this.text = `Loops: ${getWord(data[0], data[1])}`;
  this.length = len;
  this.data = getWord(data[0], data[1]);
}

// ID 25
function LoopEnd() {
  const mylog = log.scope("LoopEnd");
  this.id = 0x25;
  this.blockName = "Loop end";
}

// ID 26 TODO: Call sequence
// ID 27 TODO: Return from sequence
// ID 28 TODO: Select block
function SelectBlock(len, data) {
  this.id = 0x28;
  this.blockName = "Select Block";
  this.length = len;
  this.block = { type: "Select Block", name: "" };
}

// ID 2A TODO: Stop tape if 48K
// ID 2B TODO: Set signal level

// ID 0x30
function TextDescription(len, data) {
  const mylog = log.scope("TextDescription");
  this.id = 0x30;
  this.blockName = "Text Description";
  this.text = String.fromCharCode.apply(null, data);
  this.length = len;
  this.data = String.fromCharCode.apply(null, data);
  mylog.debug(this.text);
}

// ID 0x31 TODO: Message block

// ID 32
function ArchiveInfo(len, data) {
  const mylog = log.scope("ArchiveInfo");
  this.id = 0x32;
  this.blockName = "Archive info";
  this.noStrings = data[0];
  this.text = `No. of strings: ${this.noStrings}`;
  this.length = len;
  this.data = [];
  this.stringTypes = new Map();
  this.stringTypes.set(0x00, "Full title");
  this.stringTypes.set(0x01, "Software house/publisher");
  this.stringTypes.set(0x02, "Author(s)");
  this.stringTypes.set(0x03, "Year of publication");
  this.stringTypes.set(0x04, "Language");
  this.stringTypes.set(0x05, "Game/utility type");
  this.stringTypes.set(0x06, "Price");
  this.stringTypes.set(0x07, "Protection scheme/loader");
  this.stringTypes.set(0x08, "Origin");
  this.stringTypes.set(0xff, "Comment(s)");

  data = data.slice(1, data.length);
  for (var i = 0; i < this.noStrings; i++) {
    const stringType = data[0];
    const stringLen = data[1];
    const stringText = String.fromCharCode.apply(null, data.slice(2, 2 + stringLen));
    this.data.push({ typeId: stringType, type: this.stringTypes.get(stringType), text: stringText });
    mylog.debug(`${this.stringTypes.get(stringType)}: ${stringText}`);
    data = data.slice(2 + stringLen, data.length);
  }
}

// ID 0x33 TODO: Hardware type
// ID 0x35 TODO: Custom info block

function processTZXData(data) {
  const mylog = log.scope("processTZXData");
  mylog.debug(`processing...`);

  var tapeData = [];

  var i = 0x0a; // first entry, after header
  while (i < data.length) {
    const id = data[i++];
    var length = 0;
    var block;
    switch (id) {
      case 0x10: // ID 10 - Standard Speed Data Block
        length = getWord(data[i + 2], data[i + 3]) + 4;
        mylog.debug(`ID 10 - Standard Speed Data Block: length=${length}`);
        block = new StandardSpeedDataBlock(length, data.slice(i, i + length));
        break;
      case 0x11: // ID 11 - Turbo speed data block
        length = getWord(data[i + 0x0f], data[i + 0x10], data[i + 0x11]) + 0x12;
        mylog.debug(`ID 11 - Turbo speed data block: TZX block length=${length}`);
        block = new TurboSpeedDataBlock(length, data.slice(i, i + length));
        break;
      case 0x12: // ID 12 - Pure Tone
        length = 4;
        mylog.debug(`ID 12 - Pure Tone: length=${length}`);
        block = new PureTone(length, data.slice(i, i + length));
        break;
      case 0x13: // ID 13 - Pulse sequence
        length = data[i] * 2 + 1;
        mylog.debug(`ID 13 - Pulse sequence: length=${length}`);
        block = new PulseSequence(length, data.slice(i, i + length));
        break;
      case 0x14: // ID 14 - Pure Data Block
        length = getNWord(data[i + 7], data[i + 8], data[i + 9]) + 10;
        mylog.debug(`ID 14 - Pure Data Block: length=${length}`);
        block = new PureDataBlock(length, data.slice(i, i + length));
        break;
      case 0x15: // ID 15 - Direct recording block
        length = getNWord(data[i + 0x05], data[i + 0x06], data[i + 0x07]) + 8;
        mylog.debug(`ID 15 - Direct recording block: length=${length}`);
        block = new DirectRecordingBlock(length, data.slice(i, i + length));
        break;
      case 0x18: // ID 18 - CSW recording block
        length = 9999;
        mylog.debug(`ID 18 - CSW recording block: length=${length}`);
        mylog.error("Unhandled... abort...");
        break;
      case 0x19: // ID 19 - Generalized Data Block
        length = getDWord(data[i], data[i + 1], data[i + 2], data[i + 3]) + 4;
        mylog.debug(`ID 19 - Generalized Data Block: length=${length}`);
        block = new GeneralizedDataBlock(length, data.slice(i, i + length));
        break;
      case 0x20: // ID 20 - Pause (silence) or 'Stop the Tape' command
        length = 2;
        mylog.debug(`ID 20 - Pause (silence) or 'Stop the Tape' command: length=${length}`);
        block = new PauseStopTape(length, getWord(data[i], data[i + 1]));
        break;
      case 0x21: // ID 21 - Group start
        length = data[i] + 1;
        mylog.debug(`ID 21 - Group start: length=${length}`);
        block = new GroupStart(length, data.slice(i + 1, i + length));
        break;
      case 0x22: // ID 22 - Group end
        length = 0;
        mylog.debug(`ID 22 - Group end: length=${length}`);
        block = new GroupEnd();
        break;
      case 0x23: // ID 23 - Jump to block
        length = 9999;
        mylog.debug(`ID 18 - CSW recording block: length=${length}`);
        mylog.error("Unhandled... abort...");
        break;
      case 0x24: // ID 24 - Loop start
        length = 2;
        mylog.debug(`ID 24 - Loop start: length=${length}`);
        block = new LoopStart(length, data.slice(i, i + length));
        break;
      case 0x25: // ID 25 - Loop end
        length = 0;
        mylog.debug(`ID 25 - Loop end: length=${length}`);
        block = new LoopEnd();
        break;
      case 0x26: // ID 26 - Call sequence
        length = 9999;
        mylog.debug(`ID 26 - Call sequence: length=${length}`);
        mylog.error("Unhandled... abort...");
        break;
      case 0x27: // ID 27 - Return from sequence
        length = 9999;
        mylog.debug(`ID 27 - Return from sequence: length=${length}`);
        mylog.error("Unhandled... abort...");
        break;
      case 0x28: // ID 28 - Select block
        length = getWord(data[i + 0x00], data[i + 0x01]) + 2;
        mylog.debug(`ID 28 - Select block: length=${length}`);
        block = new SelectBlock(length, data.slice(i + 1, i + length));
        break;
      case 0x2a: // ID 2A - Stop the tape if in 48K mode
        length = 9999;
        mylog.debug(`ID 2A - Stop the tape if in 48K mode: length=${length}`);
        mylog.error("Unhandled... abort...");
        break;
      case 0x2b: // ID 2B - Set signal level
        length = 9999;
        mylog.debug(`ID 2B - Set signal level: length=${length}`);
        mylog.error("Unhandled... abort...");
        break;
      case 0x30: // ID 30 - Text description
        length = data[i] + 1;
        mylog.debug(`ID 30 - Text description: length=${length}`);
        block = new TextDescription(length, data.slice(i + 1, i + length));
        break;
      case 0x31: // ID 31 - Message block
        length = 9999;
        mylog.debug(`ID 31 - Message block: length=${length}`);
        mylog.error("Unhandled... abort...");
        break;
      case 0x32: // ID 32 - Archive info
        length = getWord(data[i], data[i + 1]) + 2;
        mylog.debug(`ID 32 - Archive info: length=${length}`);
        block = new ArchiveInfo(length, data.slice(i + 2, i + length));
        break;
      case 0x33: // ID 33 - Hardware type
        length = data[i] * 3 + 1;
        mylog.debug(`ID 33 - Hardware type: length=${length}`);
        mylog.error("Unhandled... abort...");
        break;
      case 0x35: // ID 35 - Custom info block
        length = 9999;
        mylog.debug(`ID 35 - Custom info block: length=${length}`);
        mylog.error("Unhandled... abort...");
        break;

      default:
        mylog.error(`UNKNOWN BLOCK ID: 0x${id.toString(16)}`);
        i = 100000000000;
        break;
    }

    tapeData.push(block);
    i += length;
  }

  mylog.debug(`TZX contains: ${tapeData.length} blocks`);
  return tapeData;
}

function readTZX(data) {
  const mylog = log.scope("readTZX");
  mylog.debug(`input: ${data.length}`);
  mylog.info(`processing TZX file...`);

  const signature = String.fromCharCode.apply(null, data.slice(0, 7));
  if (signature !== "ZXTape!") {
    mylog.warn(`NOT a TZX file, skipping...`);
    return null;
  }
  const TZXMajorVersion = data[8];
  const TZXMinorVersion = data[9];

  mylog.debug(`TZX version: ${TZXMajorVersion}.${TZXMinorVersion}`);

  var snapshot = { type: null, error: null, scrdata: null, data: [] };
  snapshot.type = `TZX ${TZXMajorVersion}.${TZXMinorVersion}`;

  var tzx = new TZXObject(TZXMajorVersion, TZXMinorVersion);

  const tzxData = processTZXData(data);

  // create pseudo TAP structure
  var tap = tzxData.filter((d) => {
    if (d && d.id === 0x10) {
      mylog.debug("Adding Standard Block to tape....");
      return d.block;
    }
  });

  // ZX81 TZX v1.20 - ID 30 contains ZX81, ID 30 Starts with "Program Name:", ID 19
  if (tap.length === 0 && TZXMajorVersion === 1 && TZXMinorVersion === 20) {
    mylog.debug(`Not any standard blocks - TZX v${TZXMajorVersion}.${TZXMinorVersion}, maybe ZX81?`);
    var zx81programName;
    const zx81 = tzxData.filter((d) => {
      if (d.id === 0x30 && (d.text.includes("ZX81") || d.text.startsWith("Program Name:"))) {
        mylog.debug(`Correct text found: ${d.text} - adding...`);
        if (d.text.startsWith("Program Name:")) {
          zx81programName = d.text; // d.text.substring(d.text.indexOf(': ') + 1);
        }
        return d;
      }
      if (d.id === 0x19) {
        mylog.debug("Generalized Data Block found - adding...");
        return d;
      }
    });
    if (zx81.length === 3) {
      mylog.debug(`found 3 blocks, OK`);
      snapshot.text = zx81programName;
      snapshot.hwModel = "ZX81";
      return snapshot;
    } else {
      mylog.debug(`not 3 blocks, probaly not ZX81...`);
    }
  }

  if (tap.length > 0 && tap[0].block.type !== "...data") {
    snapshot.text = tap[0].block.type + ": " + tap[0].block.name;
  }

  mylog.debug(`tap structure length: ${tap.length}`);
  for (var i = 0; i < tap.length; i++) {
    const element = tap[i].block;
    mylog.debug(`${i}: ${element.type}, ${element.flag} - ${element.name}, ${element.len}`);
    if (element.type === "Code" && i < tap.length - 1) {
      if (element.startAddress === 16384) {
        mylog.debug(`Found code starting at 16384...(screen area)`);
        snapshot.scrdata = tap[i + 1].block.data;
        snapshot.border = 7;
        break;
      } else if (element.len === 6912) {
        mylog.debug(`Found code with length 6912...(screen length)`);
        snapshot.scrdata = tap[i + 1].block.data;
        snapshot.border = 7;
        break;
      } else if (element.len > 6912) {
        mylog.debug(`Found code with length(${element.len}) > 6912 - try using it as screen...`);
        snapshot.scrdata = tap[i + 1].block.data;
        snapshot.border = 7;
        break;
      }
    } else if (snapshot.scrdata === null && element.type === "...data") {
      // headerless data with length 6912 or bigger than 32768
      // mylog.debug(`${i} - data block: ${element.data.length}`);
      if (element.data.length > 16000 || element.data.length === 6912) {
        mylog.debug(`Headerless data with length(${element.data.length}) > 32767 - try using it as screen...`);
        snapshot.scrdata = element.data;
        snapshot.border = 7;
      }
    }
  }

  snapshot.data = tap;
  return snapshot;
}

exports.readTZX = readTZX;
