/**
 * SCL disk support
 * - https://sinclair.wiki.zxnet.co.uk/wiki/SCL_format#Files_data
 *
 */
const { logger } = require("../logger.js");
const { ZXInfoCard } = require("../ZXInfoCard");
const Jimp = require("jimp");
const screenZX = require("../utilities/handleSCR");

function createDIRScreen(dirdata) {
  // create a SCR preview of DIR
  let image = new Jimp(320, 240, Jimp.cssColorToHex("#D7D7D7"), (err, image) => {
    if (err) throw err;
  });

  if (dirdata === undefined) {
    return image.getBase64Async(Jimp.MIME_PNG); // corrupt disk
  }

  const dir_info = dirdata.dir_info;
  const disk_info = dirdata.disk_info;

  var line = 0;
  for (var file = 0; file < dir_info.length; file++) {
    const item = dir_info[file];
    const text = `${item.filename} <${item.ext}> ${item.file_len_sectors}`;
    if (line < 21) {
      screenZX.printAtSpectrum(image, 0, line, text, 22);
      line += 1;
    }
  }

  const endText2 = `SCL image: ${disk_info.no_files} File(s)`;
  screenZX.printAtSpectrum(image, 0, line + 1, endText2, 999999);

  // image.write("./file.png");
  return image.getBase64Async(Jimp.MIME_PNG);
}

function detectSCL(data) {
  const mylog = logger().scope("detectSCL");

  const disk_info = {
    signature: String.fromCharCode.apply(null, data.slice(0, 8)),
    no_files: data[8],
    error: [],
  };

  if (disk_info.signature !== "SINCLAIR") {
    mylog.error(`Unknown SCL format: ${disk_info.signature}`);
    disk_info.error.push({ type: "error", message: `Unknown SCL format: ${disk_info.signature}` });
    return disk_info;
  }

  mylog.debug(disk_info);
  return disk_info;
}

function readDir(data, disk_info) {
  const mylog = logger().scope("readDIR");

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

function readSCL(filename, subfilename, md5hash, data, isPreview) {
  const mylog = logger().scope("readSCL");
  mylog.debug(`input: ${data.length}`);
  mylog.info(`processing SCL file, preview only: ${isPreview}`);

  var zxObject = new ZXInfoCard(filename, subfilename, md5hash);
  var regs = {};
  regs.filesize = data.length;

  const disk_info = detectSCL(data);
  if (disk_info.error.length > 0) {
    zxObject.error = disk_info.error;
    return zxObject;
  }

  const dir_info = readDir(data, disk_info);

  zxObject.text = `Number of files: ${disk_info.no_files}`;
  zxObject.scrdata_ext = { dir_info: dir_info, disk_info: disk_info };

  if (isPreview) {
    zxObject.data = null;
  } else {
    zxObject.data = regs;
    zxObject.data_ext = zxObject.scrdata_ext;
  }

  return zxObject;
}

exports.readSCL = readSCL;
exports.createDIRScreen = createDIRScreen;
