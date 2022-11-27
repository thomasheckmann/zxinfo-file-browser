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
  this.block = { error: [] };
  this.blockName = "Standard Speed Data Block";
  this.length = getWord(data[0x02], data[0x03]);
  this.pause = getWord(data[0], data[1]);
  // const dataLen = getWord(data[2], data[3]);
  this.blockType = data[0x04] === 0 ? "Header" : "Data";
  this.data = data.subarray(0x04, 0x04 + data.length);
  this.text = `Type: ${this.blockType}, Pause: ${this.pause}, Block len: ${len}`;
  mylog.debug(`Data length: ${this.length}`);
  if (this.data[0] === 0) {
    this.block = util.createHeader(this.data, this.id);
  } else if (this.data[0] === 255) {
    this.block = util.createData(this.data, this.id);
    this.block.type = "...data";
  } else {
    mylog.warn(`found unknown block: ${this.data[0]}`);
    this.block = { flag: this.data[0], data: null, error: [] };
    this.block.error.push({ type: "warning", message: `found unknown block: ${this.data[0]}` });
  }
}

// ID 0x11
function TurboSpeedDataBlock(len, data) {
  const mylog = log.scope("TurboSpeedDataBlock");
  this.id = 0x11;
  this.blockName = "Turbo Speed Data Block";
  this.length = getWord(data[0x0f], data[0x10], data[0x11]);
  this.pause = getWord(data[0x0d], data[0x0e]);
  this.blockType = data[0x12] === 0 ? "Header" : "Data";
  this.data = data.slice(0x12, 0x12 + data.length);
  this.text = `Type: ${this.blockType}, Pause: ${this.pause}, Block len: ${len}`;
  mylog.debug(`Data length: ${this.length}`);
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
  this.blockName = "Direct Recording Block";
  this.length = len;
  this.block = { type: "Direct Recording Block", name: "" };
}
// ID 0x18 TODO: CSW
function CSWRecordingBlock(len, data) {
  const mylog = log.scope("CSWRecordingBlock");
  this.id = 0x18;
  this.blockName = "CSW Recording Block";
  this.length = len;
  this.block = { type: "CSW Recording Block", name: "" };
}

// ID 19
function GeneralizedDataBlock(len, data) {
  const mylog = log.scope("GeneralizedDataBlock");
  this.id = 0x19;
  this.blockName = "Generalized Data Block";
  this.length = getDWord(data[0x00], data[0x01], data[0x02], data[0x03]);
  this.pause = getWord(data[0x04], data[0x05]);
  this.totp = getDWord(data[0x06], data[0x07], data[0x08], data[0x09]);
  this.npp = data[0x0a];
  this.asp = data[0x0b];
  this.totd = getDWord(data[0x0c], data[0x0d], data[0x0e], data[0x0f]);
  this.npd = data[0x10];
  this.asd = data[0x11];

  this.text = `len:${this.length}, totp:${this.totp}, npp:${this.npp}, asp:${this.asp}, totd:${this.totd}, npd:${this.npd}, asd:${this.asd}, Pause: ${this.pause}`;

  if (this.totd > 0) {
    const offSet = 0x12 + (2 * this.npp + 1) * this.asp + this.totp * 3 + (2 * this.npd + 1) * this.asd;
    this.data = data.slice(offSet);
    mylog.debug(`${offSet} - ${this.data[0]}, len: ${this.data.length}`);
  }

  mylog.debug(`${this.text}`);
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
  this.length = data.length;
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

const HWTYPE = new Map([
  [
    0,
    {
      type: "Computer",
      hardware: [
        "ZX Spectrum 16k",
        "ZX Spectrum 48k, Plus",
        "ZX Spectrum 48k ISSUE 1",
        "ZX Spectrum 128k +(Sinclair)",
        "ZX Spectrum 128k +2 (grey case)",
        "ZX Spectrum 128k +2A, +3",
        "Timex Sinclair TC-2048",
        "Timex Sinclair TS-2068",
        "Pentagon 128",
        "Sam Coupe",
        "Didaktik M",
        "Didaktik Gama",
        "ZX-80",
        "ZX-81",
        "ZX Spectrum 128k, Spanish version",
        "ZX Spectrum, Arabic version",
        "Microdigital TK 90-X",
        "Microdigital TK 95",
        "Byte",
        "Elwro 800-3",
        "ZS Scorpion 256",
        "Amstrad CPC 464",
        "Amstrad CPC 664",
        "Amstrad CPC 6128",
        "Amstrad CPC 464+",
        "Amstrad CPC 6128+",
        "Jupiter ACE",
        "Enterprise",
        "N/A",
        "N/A",
        "Inves Spectrum+",
        "Profi",
        "GrandRomMax",
        "Kay 1024",
        "Ice Felix HC 91",
        "Ice Felix HC 2000",
        "Amaterske RADIO Mistrum",
        "Quorum 128",
        "MicroART ATM",
        "MicroART ATM Turbo 2",
        "Chrome",
        "ZX Badaloc",
        "TS-1500",
        "Lambda",
        "TK-65",
        "ZX-97",
      ],
    },
  ],
  [
    1,
    {
      type: "External storage",
      hardware: [
        "ZX Microdrive",
        "Opus Discovery",
        "MGT Disciple",
        "MGT Plus-D",
        "Rotronics Wafadrive",
        "TR-DOS (BetaDisk)",
        "Byte Drive",
        "Watsford",
        "FIZ",
        "Radofin",
        "Didaktik disk drives",
        "BS-DOS (MB-02)",
        "ZX Spectrum +3 disk drive",
        "JLO (Oliger) disk interface",
        "Timex FDD3000",
        "Zebra disk drive",
        "Ramex Millenia",
        "Larken",
        "Kempston disk interface",
        "Sandy",
        "ZX Spectrum +3e hard disk",
        "ZXATASP",
        "DivIDE",
        "ZXCF",
      ],
    },
  ],
  [
    2,
    {
      type: "ROM/RAM type add-ons",
      hardware: [
        "Sam Ram",
        "Multiface ONE",
        "Multiface 128k",
        "Multiface +3",
        "MultiPrint",
        "MB-02 ROM/RAM expansion",
        "SoftROM",
        "1k",
        "16k",
        "48k",
        "Memory in 8-16k used",
      ],
    },
  ],
  [
    3,
    {
      type: "Sound devices",
      hardware: [
        "Classic AY hardware (compatible with 128k ZXs)",
        "Fuller Box AY sound hardware",
        "Currah microSpeech",
        "SpecDrum",
        "AY ACB stereo (A+C=left, B+C=right); Melodik",
        "AY ABC stereo (A+B=left, B+C=right)",
        "RAM Music Machine",
        "Covox",
        "General Sound",
        "Intec Electronics Digital Interface B8001",
        "Zon-X AY",
        "QuickSilva AY",
        "Jupiter ACE",
      ],
    },
  ],
  [4, { type: "Joysticks", hardware: ["Kempston", "Cursor, Protek, AGF", "Sinclair 2 Left (12345)", "Sinclair 1 Right (67890)", "Fuller"] }],
  [5, { type: "Mice", hardware: [] }],
  [6, { type: "Other controllers", hardware: [] }],
  [7, { type: "Serial ports", hardware: [] }],
  [8, { type: "Parallel ports", hardware: [] }],
  [9, { type: "Printers", hardware: [] }],
  [10, { type: "Modems", hardware: [] }],
  [11, { type: "Digitizers", hardware: [] }],
  [12, { type: "Network adapters", hardware: [] }],
  [13, { type: "Keyboards & keypads", hardware: [] }],
  [14, { type: "AD/DA converters", hardware: [] }],
  [15, { type: "EPROM programmers", hardware: [] }],
  [16, { type: "Graphics", hardware: [] }],
]);

const HWINFO = new Map([
  [0, "The tape RUNS on this machine or with this hardware, but may or may not use the hardware or special features of the machine."],
  [1, "The tape USES the hardware or special features of the machine, such as extra memory or a sound chip."],
  [2, "The tape RUNS but it DOESN'T use the hardware or special features of the machine."],
  [3, "The tape DOESN'T RUN on this machine or with this hardware."],
]);

// ID 0x33 TODO: Hardware type
function HardwareBlock(len, data) {
  const mylog = log.scope("HardwareBlock");
  this.id = 0x33;
  this.blockName = "Hardware Info Block";
  this.length = data[0];
  this.hw = [];

  mylog.info(`Number of entries: ${this.length}`);
  const hwData = data.slice(1);
  for (var i = 0; i < this.length; i++) {
    const hardwareType = hwData[i * 3];
    const hardwareId = hwData[i * 3 + 1];
    const hardwareInfo = hwData[i * 3 + 2];
    mylog.info(`${hardwareType}, ${hardwareId}, ${hardwareInfo} => ${HWTYPE.get(hardwareType).hardware[hardwareId]} - ${HWINFO.get(hardwareInfo)}`);
    if (HWINFO.get(hardwareInfo)) {
      this.hw.push(HWTYPE.get(hardwareType).hardware[hardwareId]);
    }
  }

  this.block = { type: "Hardware Info Block", name: "" };
}

// ID 0x35 TODO: Custom info block

function processTZXData(data) {
  const mylog = log.scope("processTZXData");
  mylog.debug(`processing...`);

  var tapeData = [];

  var i = 0x0a; // first entry, after header
  while (i < data.length) {
    const id = data[i++];
    var length = 0;
    var block = { error: [] };
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
        length = getNWord(data[i + 0x01], data[i + 0x02], data[i + 0x03], data[i + 0x04]) + 4;
        mylog.debug(`ID 18 - CSW recording block: length=${length}`);
        block = new CSWRecordingBlock(length, data.slice(i, i + length));
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
        mylog.debug(`ID 23 - Jump to block: length=${length}`);
        mylog.error("Unhandled... abort...");
        block.error.push({ type: "error", message: `Unhandled block ID: 0x${id.toString(16)} - Jump to block` });
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
        block.error.push({ type: "error", message: `Unhandled block ID: 0x${id.toString(16)} - Call sequence` });
        break;
      case 0x27: // ID 27 - Return from sequence
        length = 9999;
        mylog.debug(`ID 27 - Return from sequence: length=${length}`);
        mylog.error("Unhandled... abort...");
        block.error.push({ type: "error", message: `Unhandled block ID: 0x${id.toString(16)} - Return from sequence` });
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
        block.error.push({ type: "error", message: `Unhandled block ID: 0x${id.toString(16)} - Stop the tape if in 48K mode` });
        break;
      case 0x2b: // ID 2B - Set signal level
        length = 9999;
        mylog.debug(`ID 2B - Set signal level: length=${length}`);
        mylog.error("Unhandled... abort...");
        block.error.push({ type: "error", message: `Unhandled block ID: 0x${id.toString(16)} - Set signal level` });
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
        block.error.push({ type: "error", message: `Unhandled block ID: 0x${id.toString(16)} - Message block` });
        break;
      case 0x32: // ID 32 - Archive info
        length = getWord(data[i], data[i + 1]) + 2;
        mylog.debug(`ID 32 - Archive info: length=${length}`);
        block = new ArchiveInfo(length, data.slice(i + 2, i + length));
        break;
      case 0x33: // ID 33 - Hardware type
        length = data[i] * 3 + 1;
        mylog.info(`ID 33 - Hardware type: length=${length}`);
        block = new HardwareBlock(length, data.slice(i, i + length));
        break;
      case 0x35: // ID 35 - Custom info block
        length = 9999;
        mylog.debug(`ID 35 - Custom info block: length=${length}`);
        mylog.error("Unhandled... abort...");
        block.error.push({ type: "error", message: `Unhandled block ID: 0x${id.toString(16)} - Custom info block` });
        break;
      default:
        mylog.error(`Unknown block ID: 0x${id.toString(16)}`);
        block.error.push({ type: "error", message: `Unknown block ID: 0x${id.toString(16)}` });
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
  mylog.debug(`processing TZX file...`);

  const signature = String.fromCharCode.apply(null, data.slice(0, 7));
  if (signature !== "ZXTape!") {
    mylog.warn(`NOT a TZX file, skipping...`);
    return null;
  }
  const TZXMajorVersion = data[8];
  const TZXMinorVersion = data[9];

  mylog.debug(`TZX version: ${TZXMajorVersion}.${TZXMinorVersion}`);

  var snapshot = { type: null, error: [], scrdata: null, data: [] };
  snapshot.type = `TZX ${TZXMajorVersion}.${TZXMinorVersion}`;

  var regs = {};
  regs.filesize = data.length;

  const tzxData = processTZXData(data);

  snapshot.hwModel;
  // create pseudo TAP structure & find hwinfo and add error messages from blocks
  var tap = tzxData.filter((d) => {
    if(d.error) {
      snapshot.error.push(...d.error);
    }
    if (d && d.block) {
      const block = d.block;
      if (block.error && block.error.length > 0) {
        snapshot.error.push(...block.error);
      }
    }

    if (d && d.id === 0x10) {
      mylog.debug("Adding Standard Block to tape....");
      return d.block;
    }
    if (d && d.id === 0x33) {
      snapshot.hwModel = d.hw[0];
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
    if (zx81.length >= 3) {
      mylog.debug(`found 3 blocks, OK`);
      snapshot.text = zx81programName;
      snapshot.hwModel = "ZX81";
      snapshot.zx81 = zx81[2].data;
      regs.tape = tzxData;
      snapshot.data = regs;
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

  regs.tape = tzxData;
  snapshot.data = regs;

  return snapshot;
}

exports.readTZX = readTZX;
