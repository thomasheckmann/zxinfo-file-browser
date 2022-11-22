/**
 * SCL disk support
 * - https://sinclair.wiki.zxnet.co.uk/wiki/SCL_format#Files_data
 *
 */
const log = require("electron-log");
const Jimp = require("jimp");
const screenZX = require("./handleSCR");

function createDIRScreen(dirdata) {
  const dir_info = dirdata.dir_info;
  const disk_info = dirdata.disk_info;

  // create a SCR preview of DIR
  let image = new Jimp(320, 240, Jimp.cssColorToHex("#D7D7D7"), (err, image) => {
    if (err) throw err;
  });

  var line = 0;
  for (var file = 0; file < dir_info.length; file++) {
    const item = dir_info[file];
    const text = `${item.filename} <${item.ext}> ${item.file_len_sectors}`;
    if (line < 21) {
      screenZX.printAt(image, 0, line, text);
      line += 1;
    }
  }

  const endText2 = `SCL image: ${disk_info.no_files} File(s)`;
  screenZX.printAt(image, 0, line + 1, endText2);

  // image.write("./file.png");
  return image.getBase64Async(Jimp.MIME_PNG);
}

function detectSCL(data) {
  const mylog = log.scope("detectSCL");

  const disk_info = {
    signature: String.fromCharCode.apply(null, data.slice(0, 8)),
    no_files: data[8],
  };

  if (disk_info.signature !== "SINCLAIR") {
    mylog.error(`UNKNOWN SCL format: ${disk_info.signature}`);
    return null;
  }

  mylog.debug(disk_info);
  return disk_info;
}

function readDir(data, disk_info) {
  const mylog = log.scope("readDIR");

  const dirOffset = 9;
  const dirOffsetEnd = dirOffset + disk_info.no_files * 14;

  const dirBlock = data.slice(dirOffset, dirOffsetEnd);

  var directory = [];
  for (var index = 0; index < disk_info.no_files; index++) {
    const entry = dirBlock.slice(index * 14, index * 14 + 14);
    const file_descriptor = {
      filename: String.fromCharCode.apply(null, entry.slice(0, 8)),
      ext: String.fromCharCode.apply(null, entry.slice(8, 9)),
      file_len_sectors: entry[0xd],
    };
    directory.push(file_descriptor);
  }

  return directory;
}

function readSCL(data) {
  const mylog = log.scope("readSCL");
  mylog.debug(`input: ${data.length}`);

  var snapshot = { type: "SCL", error: [], scrdata: null, data: [] };
  snapshot.scrdata = null;

  const disk_info = detectSCL(data);

  const dir_info = readDir(data, disk_info);

  snapshot.text = `SCL - Number of files: ${disk_info.no_files}`;
  snapshot.dir_scr = { dir_info: dir_info, disk_info: disk_info };

  return snapshot;
}

exports.readSCL = readSCL;
exports.createDIRScreen = createDIRScreen;
