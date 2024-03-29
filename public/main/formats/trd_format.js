/**
 * TRD disk support
 * - https://sinclair.wiki.zxnet.co.uk/wiki/TR-DOS_filesystem
 *
 * 16 sectors per track, with 256-byte sectors
 */
const { logger } = require("../logger.js");
const { ZXInfoCard } = require("../ZXInfoCard");
const Jimp = require("jimp");
const screenZX = require("../utilities/handleSCR");

const disk_type_names = new Map([
  [0x16, "80 tracks, double side"],
  [0x17, "40 tracks, double side"],
  [0x18, "80 tracks, single side"],
  [0x19, "40 tracks, single side"],
]);

const ext_names = new Map([
  ["B", "Basic"],
  ["C", "Code"],
  ["D", "Data"],
  ["#", "Sequence"],
]);

function detectTRD(data) {
  const mylog = logger().scope("detectTRD");

  // read h0t0s9 (sectors 1-8, index 1)
  const infoOffset = 256 * 8;

  const infoBlock = data.slice(infoOffset, infoOffset + 256);
  const disk_info = {
    ffs: infoBlock[225],
    ffs_t: infoBlock[226],
    disk_type: infoBlock[227],
    disk_type_name: disk_type_names.get(infoBlock[227]),
    no_files: infoBlock[228],
    free_sectors: infoBlock[229] + infoBlock[230] * 256,
    trdos_id: infoBlock[231],
    no_del_files: infoBlock[244],
    disk_label: String.fromCharCode.apply(null, infoBlock.slice(245, 253)),
  };

  if (disk_info.disk_type_name === null) {
    mylog.error(`UNKNOWN disk type: ${disk_info.disk_type}`);
    return null;
  }

  mylog.debug(disk_info);
  return disk_info;
}

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
      screenZX.printAtSpectrum(image, 0, line, text, 22);
      line += 1;
    }
  }

  const endText = `Free sector ${disk_info.free_sectors} Title: ${disk_info.disk_label}`;
  screenZX.printAtSpectrum(image, 0, line + 1, endText, 22);

  const endText2 = `${disk_info.disk_type_name} - ${dir_info.length} File(s)`;
  screenZX.printAtSpectrum(image, 0, line + 2, endText2, 999999);

  // image.write("./file.png");
  return image.getBase64Async(Jimp.MIME_PNG);
}

function readDir(data, disk_info) {
  const mylog = logger().scope("readDir");

  // dir (h0t0s1..h0t0s8) length 16, max = 128 files
  const dirOffsetEnd = 256 * 8;
  const dirBlock = data.slice(0, dirOffsetEnd);

  var directory = [];
  for (var index = 0; index < disk_info.no_files; index++) {
    const entry = dirBlock.slice(index * 16, index * 16 + 16);
    const file_descriptor = {
      filename: String.fromCharCode.apply(null, entry.slice(0, 8)),
      ext: String.fromCharCode.apply(null, entry.slice(8, 9)),
      ext_name: ext_names.get(String.fromCharCode(entry[8])),
      file_len: entry[11] + entry[12] * 256,
      file_len_sectors: entry[13],
    };
    if (entry[0] !== 0x01) {
      directory.push(file_descriptor);
    }
  }

  return directory;
}

function readTRD(filename, subfilename, md5hash, data, isPreview) {
  const mylog = logger().scope("readTRD");
  mylog.debug(`input: ${data.length}`);
  mylog.info(`processing TRD file, preview only: ${isPreview}`);

  var zxObject = new ZXInfoCard(filename, subfilename, md5hash);
  var regs = {};
  regs.filesize = data.length;

  const disk_info = detectTRD(data);

  const dir_info = readDir(data, disk_info);

  zxObject.text = disk_info.disk_label + " - " + disk_info.disk_type_name;
  zxObject.scrdata_ext = { dir_info: dir_info, disk_info: disk_info };

  if (isPreview) {
    zxObject.data = null;
  } else {
    zxObject.data = regs;
    zxObject.data_ext = zxObject.scrdata_ext;
  }

  return zxObject;
}

exports.readTRD = readTRD;
exports.createDIRScreen = createDIRScreen;
