const Jimp = require("jimp");

const log = require("electron-log");
const screenZX = require("../utilities/handleSCR");

const CPCEMU_INFO_OFFSET = 0x100;
const CPCEMU_TRACK_OFFSET = 0x100;

const NUM_SECTOR = 9;

function read_track_info(data, track, DPB) {
  const mylog = log.scope("read_track_info");

  mylog.debug(`reading track info for track: ${track}`);

  var SIZ_TRACK = CPCEMU_TRACK_OFFSET + NUM_SECTOR * (128 << DPB.psh);
  if (DPB.size_of_track) {
    SIZ_TRACK = DPB.size_of_track;
  }
  // READ TRACK INFORMATION BLOCK

  const offset_track = CPCEMU_INFO_OFFSET + track * SIZ_TRACK;
  mylog.debug(`offset for track: ${track} - ${offset_track}`);
  const track_info = {
    header: String.fromCharCode.apply(null, data.slice(offset_track, offset_track + 0x0c)),
    track_num: data[offset_track + 0x10],
    head_num: data[offset_track + 0x11],
    /* Format track parameters */
    sector_size: data[offset_track + 0x14], // BPS
    num_sectors: data[offset_track + 0x15], // SPT
    GAP3_length: data[offset_track + 0x16],
    filler_byte: data[offset_track + 0x17],
    sector_info_table: [], // 9 at most 18
    sector_data: [], // num_sectors * (sector_size * 256b)
  };

  mylog.debug(
    `Track Info: track: ${track_info.track_num}, side: ${track_info.head_num}, sector size: ${track_info.sector_size} (x 256b), no. of sectors: ${track_info.num_sectors}, filler: ${track_info.filler_byte}`
  );
  // READ SECTOR INFORMATION LIST
  var offset_sector = offset_track + 0x18;
  for (var i = 0; i < track_info.num_sectors; i++) {
    const sector_info = {
      track: data[offset_sector + 0x00],
      head: data[offset_sector + 0x01],
      sector_id: data[offset_sector + 0x02],
      sector_size: data[offset_sector + 0x03],
      FDC_status_reg1: data[offset_sector + 0x04],
      FDC_status_reg2: data[offset_sector + 0x05],
      ext_length: data[offset_sector + 0x06] + data[offset_sector + 0x07] * 256,
    };
    mylog.debug(
      `reading sector info: track: ${sector_info.track}, head: ${sector_info.head}, sector_id: ${sector_info.sector_id}, sector size: ${sector_info.sector_size}, length: ${sector_info.ext_length}`
    );
    offset_sector += 0x08;
    track_info.sector_info_table.push(sector_info);
  }

  // READ SECTOR DATA
  var offset_sector_data = offset_track + 0x0100;
  for (var i = 0; i < track_info.num_sectors; i++) {
    const sector_data = data.slice(offset_sector_data, offset_sector_data + 256 * track_info.sector_size);
    track_info.sector_data.push(sector_data);
    offset_sector_data += 256 * track_info.sector_size;
  }

  return track_info;
}

function valid_filename(filename) {
  const mylog = log.scope("valid_filename");
  // returns true, if filename contains only valid ASCII characters 32 - 127
  for (var i = 0; i < filename.length; i++) {
    if (filename.charCodeAt(i) < 32 || filename.charCodeAt(i) > 127) {
      mylog.debug(`ops, illegal character: ${filename.charCodeAt(i)}`);
      return false;
    }
  }
  return true;
}

// removes 7th bit of chars in string
function cleanString(filename) {
  const mylog = log.scope("cleanString");
  var cleanedFilename = "";
  for (var i = 0; i < filename.length; i++) {
    var char = filename.charCodeAt(i) & 0x7f;
    if (char < 32 || char > 127) char = 63;
    cleanedFilename = cleanedFilename + String.fromCharCode(char);
  }
  mylog.debug(`cleaned: ${cleanedFilename}`);
  return cleanedFilename;
}

// init disk
function readEDSK(data) {
  const mylog = log.scope("readEDSK");
  const disk_info_block = {
    signature: String.fromCharCode.apply(null, data.slice(0, 0x22)),
    name_of_creator: String.fromCharCode.apply(null, data.slice(0x22, 0x30)),
    cpc_format: null,
    number_of_tracks: data[0x30], // 40, 42, 80
    number_of_sides: data[0x031], // 1 or 2
    size_of_track: data[0x032] + data[0x33] * 256,
    size_of_tracks: [data[0x034]], // high bytes of track sizes for all tracks
    error: [],
  };

  mylog.debug(`DISK INFO BLOCK`);
  mylog.debug(`${JSON.stringify(disk_info_block)}`);

  // find directory
  // Assume +3/PCW DPB
  var DPB = {
    // PCW/Spectrum system
    spt: 0x24, // Number of 128-byte records per track
    bsh: 0x03, // Block shift. 3 => 1k, 4 => 2k, 5 => 4k...
    blm: 0x07, // Block mask. 7 => 1k, 0Fh => 2k, 1Fh => 4k...
    exm: 0x00, // Extent mask, see later
    dsm: 0xae, // (no. of blocks on the disc)-1
    drm: 0x3f, // (no. of directory entries)-1
    al0: 0xc0, // Directory allocation bitmap, first byte
    al1: 0x00, // Directory allocation bitmap, second byte
    off: 0x01, // Offset, number of reserved tracks
    psh: 0x02, // Physical sector shift, 0 => 128-byte sectors, 1 => 256-byte sectors  2 => 512-byte sectors...
    phm: 0x03, // Physical sector mask,  0 => 128-byte sectors, 1 => 256-byte sectors, 3 => 512-byte sectors...
  };

  // detect additional +3 disk info
  // 16-byte record on track 0, head 0, physical sector 1
  mylog.debug("Reading 16 byte record to detect additional +3 disk info");
  const sector0 = read_track_info(data, 0, DPB);

  if (sector0.track_num === undefined && sector0.head_num === undefined && sector0.head_num === undefined && sector0.sector_size === undefined) {
    disk_info_block.error.push({ type: "error", message: `Error reading sector 0` });
    mylog.warn(`Error reading sector 0`);
    return disk_info_block;
  }
  const fpsId = sector0.sector_info_table[0].sector_id;

  mylog.debug(`First physical sector id: ${fpsId} (0x${fpsId.toString(16)})`);
  if (fpsId >= 0xc0 && fpsId <= 0xff) {
    // CPM_DATA_DISK
    mylog.debug("CPC Data format");
    disk_info_block.cpc_format = "CPC Data format";
    DPB.dsm = 0xb3;
    DPB.off = 0x00;
  } else if (fpsId === 0x41) {
    // CPM_DATA_DISK
    mylog.debug("CPC System format");
    disk_info_block.cpc_format = "CPC System format";
    DPB.dsm = 0xaa;
    DPB.off = 0x02;
  } else if (fpsId === 0xe5) {
    // If all bytes of the spec are 0E5h, it should be assumed that the disc is a 173k PCW/Spectrum +3 disc
    mylog.debug("PCW/Spectrum +3");
    disk_info_block.cpc_format = "PCW/Spectrum +3";
    DPB.dsm = 0xae;
    const plus3info = {
      format: sector0.sector_data[0][0],
      sideness: sector0.sector_data[0][1],
      tracks: sector0.sector_data[0][2],
      sectors: sector0.sector_data[0][3],
      psh: sector0.sector_data[0][4],
      off: sector0.sector_data[0][5],
      bsh: sector0.sector_data[0][6],
      no_of_dir_blocks: sector0.sector_data[0][7],
    };
    DPB.size_of_track = plus3info.size_of_track;
    DPB.off = plus3info.off;
    mylog.debug(`+3 DISK INFO: ${JSON.stringify(plus3info)}`);
  } else {
    // This can be read on part 27 of the +3 manual:
    mylog.debug(`Non stadard format: fpsId: ${fpsId}`);
    disk_info_block.cpc_format = "CPC Format";
    const disk_specification = {
      format: sector0.sector_data[0][0],
      sideness: sector0.sector_data[0][1],
      tracks: sector0.sector_data[0][2],
      sectors: sector0.sector_data[0][3],
      psh: sector0.sector_data[0][4],
      off: sector0.sector_data[0][5],
      bsh: sector0.sector_data[0][6],
      no_of_dir_blocks: sector0.sector_data[0][7],
    };
    DPB.size_of_track = disk_specification.size_of_track;
    DPB.off = disk_specification.off;

    mylog.debug(`Disk Specifications: ${JSON.stringify(disk_specification)}`);
  }

  const dir_sector = DPB.off; // first non-reserved track

  // each DIR entry = 32 bytes
  // drm + 1 * 32 = 2048 / 128<<psh (512) = 4 sectors
  const track_data = read_track_info(data, dir_sector, DPB);

  const no_of_dir_sectors = ((DPB.drm + 1) * 32) / (128 << DPB.psh);
  const no_of_files_per_sector = (128 << DPB.psh) / 32;
  mylog.debug(`got ${track_data.sector_data.length} sectors, need first ${no_of_dir_sectors}`); // check against al0 and al1

  const dir_entries = Buffer.concat(track_data.sector_data.slice(0, no_of_dir_sectors));
  var file_map = new Map();
  for (var i = 0; i < no_of_files_per_sector * no_of_dir_sectors; i++) {
    const entry = String.fromCharCode.apply(null, dir_entries.slice(i * 32, (i + 1) * 32));
    const current_filename = cleanString(entry.slice(1, 9));
    const current_ext = cleanString(entry.slice(9, 12));
    const current_rc = entry.charCodeAt(15);

    const file_entry = {
      ua: entry.charCodeAt(0),
      filename: current_filename,
      ext: current_ext,
      read_only: (entry.charCodeAt(9) & 0b10000000) > 0,
      hidden: (entry.charCodeAt(10) & 0b10000000) > 0,
      archived: (entry.charCodeAt(11) & 0b10000000) > 0,
      rc_sum: 0,
      file_size: 0,
    };

    // MOSTLY USED FOR DEBUG
    var al = "";
    for (var j = 16; j < 32; j++) {
      al = al + (entry.charCodeAt(j) + ", ");
    }
    mylog.debug(
      `${file_entry.ua}, ${file_entry.filename}.${file_entry.ext} ex=${entry.charCodeAt(12)}, s1=${entry.charCodeAt(13)}, s2=${entry.charCodeAt(
        14
      )}, rc=${entry.charCodeAt(15)} - ${file_entry.read_only ? "read_only" : ""} ${file_entry.hidden > 0 ? "hidden" : ""} ${
        file_entry.archived ? "archived" : ""
      }`
    );
    mylog.debug(`\t\tAL: ${al}`);
    // MOSTLY USED FOR DEBUG

    var item = file_map.get(current_filename + current_ext);
    if (valid_filename(entry.slice(1, 9))) {
      if (item && file_entry.ua < 16) {
        item.rc_sum = item.rc_sum + current_rc;
        item.file_size = Math.ceil((item.rc_sum * 128) / (128 << DPB.bsh));
        // mylog.debug(`updating: ${JSON.stringify(item)}`);
        file_map.set(current_filename + current_ext, item);
      } else if (!item && file_entry.ua < 16) {
        file_entry.rc_sum = current_rc;
        file_entry.file_size = Math.ceil((file_entry.rc_sum * 128) / (128 << DPB.bsh));
        // mylog.debug(`creating new: ${JSON.stringify(file_entry)}`);
        file_map.set(current_filename + current_ext, file_entry);
      } else if (file_entry.ua === 0xe5) {
        // mylog.debug(`DELETED: ${current_filename}.${current_ext}`);
        file_map.delete(current_filename + current_ext);
      } else {
        mylog.warn(`Unknown UA: ${file_entry.ua} for file: ${current_filename}${current_ext}`);
      }
    }
  }

  // calculate total size used by files
  var total_size = 0;
  for (let [key, value] of file_map) {
    total_size += value.file_size;
  }

  disk_info_block.total_size_used = total_size;
  disk_info_block.total_size = DPB.dsm - ((DPB.drm + 1) * 32) / 2048; // (DPB.drm * 32) / 1024; dsm = 1024K blocks
  disk_info_block.total_size_free = disk_info_block.total_size - disk_info_block.total_size_used;
  disk_info_block.dir = new Map([...file_map].sort());
  return disk_info_block;
}

function createDIRScreen(dirdata) {
  const offsetX = 32,
    offsetY = 24;

  // create a SCR preview of DIR
  let frame0 = new Jimp(320, 240, Jimp.cssColorToHex("#D7D7D7"), (err, image) => {
    if (err) throw err;
  });

  if (dirdata === undefined || dirdata.entries === undefined) {
    return frame0.getBase64Async(Jimp.MIME_PNG); // corrupt disk
  }

  const dirMap = dirdata.entries;
  const disk = dirdata.disk_info;

  var line = 0;
  for (let [key, value] of dirMap) {
    var text = `${value.filename}.${value.ext} - ${value.file_size}K `;
    if (value.read_only) text += "RO ";
    if (value.hidden) text += "SYS ";
    if (value.archived) text += "ARC ";
    if (line < 21) {
      screenZX.printAtSpectrum(frame0, 0, line, text, 22);
      line += 1;
    }
  }

  const endText = disk.total_size + "K total, " + disk.total_size_used + "K used, " + disk.total_size_free + "K free";
  screenZX.printAtSpectrum(frame0, 0, line + 1, endText, 999999);

  // frame0.write("./file.png");

  return frame0.getBase64Async(Jimp.MIME_PNG);
}

function readDSK(data) {
  const mylog = log.scope("readDSK");
  mylog.debug(`input: ${data.length}`);

  var snapshot = { type: "DSK", error: [], scrdata: null, data: [] };
  snapshot.scrdata = null;
  var regs = {};
  regs.filesize = data.length;

  const signature = String.fromCharCode.apply(null, data.slice(0, 34));
  if (signature === "EXTENDED CPC DSK File\r\nDisk-Info\r\n") {
    mylog.debug(`Extended DSK format...`);
    const disk = readEDSK(data);
    snapshot.error = disk.error;
    snapshot.text = `Ext. CPC DSK (${disk.cpc_format}) T:${disk.number_of_tracks}, S:${disk.number_of_sides} - ${disk.name_of_creator}`;
    mylog.debug(disk.total_size + "K total, " + disk.total_size_used + "K used, " + disk.total_size_free + "K free");
    snapshot.dir_scr = { entries: disk.dir, disk_info: disk };
    mylog.info(snapshot.text);
    mylog.info([...disk.dir.keys()]);
  } else if (signature === "MV - CPCEMU Disk-File\r\nDisk-Info\r\n") {
    mylog.warn(`Standard CPC DSK`);
    const disk = readEDSK(data);
    snapshot.error = disk.error;
    snapshot.text = `Std. CPC DSK (${disk.cpc_format}) T:${disk.number_of_tracks}, S:${disk.number_of_sides} - ${disk.name_of_creator}`;
    mylog.debug(disk.total_size + "K total, " + disk.total_size_used + "K used, " + disk.total_size_free + "K free");
    snapshot.dir_scr = { entries: disk.dir, disk_info: disk };
    mylog.info(snapshot.text);
    mylog.info([...disk.dir.keys()]);
  } else if (signature === "MV - CPC format Disk Image (DU54)\r") {
    mylog.warn(`Standard DSK DU54`);
    const disk = readEDSK(data);
    snapshot.error = disk.error;
    snapshot.text = `CPC (DU54): T:${disk.number_of_tracks}, S:${disk.number_of_sides} - ${disk.name_of_creator}`;
    mylog.debug(disk.total_size + "K total, " + disk.total_size_used + "K used, " + disk.total_size_free + "K free");
    snapshot.dir_scr = { entries: disk.dir, disk_info: disk };
  } else if (signature.startsWith("MV - CPCEMU /")) {
    mylog.warn(`CPC DSK`);
    const disk = readEDSK(data);
    snapshot.error = disk.error;
    snapshot.text = `CPC DSK (${disk.cpc_format}) T:${disk.number_of_tracks}, S:${disk.number_of_sides} - ${disk.name_of_creator}`;
    mylog.debug(disk.total_size + "K total, " + disk.total_size_used + "K used, " + disk.total_size_free + "K free");
    snapshot.dir_scr = { entries: disk.dir, disk_info: disk };
    mylog.info(snapshot.text);
    mylog.info([...disk.dir.keys()]);
  } else {
    snapshot.error.push({ type: "warning", message: `Unknown DSK format: ${signature}` });
    mylog.error(`Unknown DSK format: ${signature}`);
  }

  snapshot.data = regs;

  return snapshot;
}

exports.readDSK = readDSK;
exports.createDIRScreen = createDIRScreen;
