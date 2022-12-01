const Jimp = require("jimp");

const log = require("electron-log");
const screenZX = require("../utilities/handleSCR");

const CPCEMU_INFO_OFFSET = 0x100;
const CPCEMU_TRACK_OFFSET = 0x100;

const NUM_SECTOR = 9;

function read_track_info(data, track, DPB, disk_info_block) {
  const mylog = log.scope("read_track_info");

  mylog.debug(`reading track info for track: ${track}`);

  // var SIZ_TRACK = CPCEMU_TRACK_OFFSET + NUM_SECTOR * (128 << DPB.psh);
  // mylog.debug(`SIZ_TRACK: ${SIZ_TRACK}, disk_info_block.size_of_track: ${disk_info_block.size_of_track}`);

  var offset_track;
  // STD. FORMAT
  if (disk_info_block.size_of_track) {
    mylog.debug(`Track size STD format: DPB: ${DPB.size_of_track}`);
    offset_track = CPCEMU_INFO_OFFSET + track * disk_info_block.size_of_track;
  } else {
    // The location of a Track Information Block for a chosen track is found by summing the sizes of all tracks up to the chosen track plus the size of the Disc Information Block (&100 bytes). The first track is at offset &100 in the disc image.
    mylog.debug(`Track size EXT format, use lookup list size_of_tracks`);

    var trackSizeSum = 0;
    for (var ts = 0; ts < track; ts++) {
      trackSizeSum += disk_info_block.size_of_tracks[ts];
      mylog.debug(`trk: ${ts} - size: ${disk_info_block.size_of_tracks[ts]}`);
    }
    mylog.debug(`Sum of track sizes: ${trackSizeSum} (${trackSizeSum * 256})- for track ${track}`);
    offset_track = CPCEMU_INFO_OFFSET + trackSizeSum * 256;
  }
  // READ TRACK INFORMATION BLOCK

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

  mylog.info(
    `Track Info: track: ${track_info.track_num}, side: ${track_info.head_num}, sector size: ${track_info.sector_size} (x 256b), no. of sectors: ${track_info.num_sectors}, filler: ${track_info.filler_byte}, signature: ${track_info.header}`
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
  var offset_sector_data = offset_track + CPCEMU_TRACK_OFFSET;
  for (var i = 0; i < track_info.num_sectors; i++) {
    var sector_data;
    if (disk_info_block.isExtended) {
      sector_data = data.slice(offset_sector_data, offset_sector_data + 256 * disk_info_block.size_of_tracks[track]);
      offset_sector_data += 256 * disk_info_block.size_of_tracks[track];
    } else {
      // if STD, just use track_info.sector_size
      sector_data = data.slice(offset_sector_data, offset_sector_data + 256 * track_info.sector_size);
      offset_sector_data += 256 * track_info.sector_size;
    }

    track_info.sector_data.push(sector_data);
  }

  return track_info;
}

function valid_filename(filename) {
  const mylog = log.scope("valid_filename");
  // returns true, if filename contains only valid ASCII characters 32 - 127
  var valid = true;
  var hexString = "";
  for (var i = 0; i < filename.length; i++) {
    hexString += filename.charCodeAt(i).toString(16) + ",";
    if (filename.charCodeAt(i) < 32 || filename.charCodeAt(i) > 127) {
      // mylog.debug(`ops, illegal character: ${filename.charCodeAt(i)}`);
      valid = false;
    }
  }
  // mylog.debug(`text: ${hexString}`);
  return valid;
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
  // mylog.debug(`cleaned: ${cleanedFilename}`);
  return cleanedFilename;
}

const DPB_CPC_SYSTEM = {
  spt: 0x24, // Number of 128-byte records per track
  bsh: 0x03, // Block shift. 3 => 1k, 4 => 2k, 5 => 4k...
  blm: 0x07, // Block mask. 7 => 1k, 0Fh => 2k, 1Fh => 4k...
  exm: 0x00, // Extent mask, see later
  dsm: 0xaa, // (no. of blocks on the disc)-1
  drm: 0x3f, // (no. of directory entries)-1
  al0: 0xc0, // Directory allocation bitmap, first byte
  al1: 0x00, // Directory allocation bitmap, second byte
  cks: 0x10, // Checksum vector size, 0 or 8000h for a fixed disc.
  off: 0x02, // Offset, number of reserved tracks
  psh: 0x02, // Physical sector shift, 0 => 128-byte sectors, 1 => 256-byte sectors  2 => 512-byte sectors...
  phm: 0x03, // Physical sector mask,  0 => 128-byte sectors, 1 => 256-byte sectors, 3 => 512-byte sectors...
};

const DPB_CPC_DATA = {
  spt: 0x24, // Number of 128-byte records per track
  bsh: 0x03, // Block shift. 3 => 1k, 4 => 2k, 5 => 4k...
  blm: 0x07, // Block mask. 7 => 1k, 0Fh => 2k, 1Fh => 4k...
  exm: 0x00, // Extent mask, see later
  dsm: 0xb3, // (no. of blocks on the disc)-1
  drm: 0x3f, // (no. of directory entries)-1
  al0: 0xc0, // Directory allocation bitmap, first byte
  al1: 0x00, // Directory allocation bitmap, second byte
  cks: 0x10, // Checksum vector size, 0 or 8000h for a fixed disc.
  off: 0x00, // Offset, number of reserved tracks
  psh: 0x02, // Physical sector shift, 0 => 128-byte sectors, 1 => 256-byte sectors  2 => 512-byte sectors...
  phm: 0x03, // Physical sector mask,  0 => 128-byte sectors, 1 => 256-byte sectors, 3 => 512-byte sectors...
};

const DPB_PCW_SPECTRUM = {
  spt: 0x24, // Number of 128-byte records per track
  bsh: 0x03, // Block shift. 3 => 1k, 4 => 2k, 5 => 4k...
  blm: 0x07, // Block mask. 7 => 1k, 0Fh => 2k, 1Fh => 4k...
  exm: 0x00, // Extent mask, see later
  dsm: 0xae, // (no. of blocks on the disc)-1
  drm: 0x3f, // (no. of directory entries)-1
  al0: 0xc0, // Directory allocation bitmap, first byte
  al1: 0x00, // Directory allocation bitmap, second byte
  cks: 0x10, // Checksum vector size, 0 or 8000h for a fixed disc.
  off: 0x01, // Offset, number of reserved tracks
  psh: 0x02, // Physical sector shift, 0 => 128-byte sectors, 1 => 256-byte sectors  2 => 512-byte sectors...
  phm: 0x03, // Physical sector mask,  0 => 128-byte sectors, 1 => 256-byte sectors, 3 => 512-byte sectors...
};

/**
 *
 * @param {*} format
 * From +3 DOS DD_SEL_FORMAT, format required:
 * 0 => PCW format, type 0
 * 1 => System format
 * 2 => Data only format
 * 3 => PCW format, double sided, double track
 */
function DD_SEL_FORMAT(format) {
  const mylog = log.scope("DD_SEL_FORMAT");

  mylog.debug(`Requsting disk format: ${format}`);

  switch (format) {
    case 0:
      mylog.info(`PCW 180k/Spectrum`);
      return DPB_PCW_SPECTRUM;
    case 1:
      mylog.info(`CPC System`);
      return DPB_CPC_SYSTEM;
    case 2:
      mylog.info(`CPC Data`);
      return DPB_CPC_DATA;
    case 3:
      mylog.info(`PCW DDDT not supported...`);
      return DPB_PCW_SPECTRUM;
    default:
      mylog.error(`Unknown format: ${format}`);
      return DPB_PCW_SPECTRUM;
  }
}

// init disk
function readEDSK(data, isExtended) {
  const mylog = log.scope("readEDSK");
  const disk_info_block = {
    signature: String.fromCharCode.apply(null, data.slice(0, 0x22)),
    name_of_creator: String.fromCharCode.apply(null, data.slice(0x22, 0x30)),
    cpc_format: null,
    number_of_tracks: data[0x30], // 40, 42, 80
    number_of_sides: data[0x031], // 1 or 2
    size_of_track: data[0x032] + data[0x33] * 256, // 0 if Ext?
    size_of_tracks: [], // high bytes of track sizes for all tracks
    error: [],
    isExtended: isExtended,
  };

  if (disk_info_block.size_of_track === 0) {
    isExtended = true;
    disk_info_block.isExtended = true;
  }
  // if extended, fill out the track size table
  if (isExtended) {
    mylog.debug(`Extended disk, finding track size table`);
    for (var t = 0; t < disk_info_block.number_of_tracks * disk_info_block.number_of_sides; t++) {
      disk_info_block.size_of_tracks.push(data[0x034 + t]);
    }
  }

  mylog.debug(`DISK INFO BLOCK - As identified in DSK file signature`);
  mylog.debug(`${JSON.stringify(disk_info_block)}`);

  // https://retrocomputing.stackexchange.com/questions/14575/how-do-i-know-where-the-file-directory-is-stored-on-a-spectrum-3-disk-layout
  mylog.debug(`Detecting DISK format... (Based on +3 DOS LOGIN function)`);

  var DPB = DD_SEL_FORMAT(0);

  // detect additional +3 disk infoƒ
  // 16-byte record on track 0, head 0, physical sector 1
  mylog.debug("Reading 16 byte record to detect additional +3 disk info");
  const sector0 = read_track_info(data, 0, DPB, disk_info_block);

  if (sector0.track_num === undefined && sector0.head_num === undefined && sector0.head_num === undefined && sector0.sector_size === undefined) {
    disk_info_block.error.push({ type: "error", message: `Error reading sector 0` });
    mylog.warn(`Error reading sector 0`);
    return disk_info_block;
  } else if (sector0.sector_info_table.length === 0) {
    disk_info_block.error.push({ type: "error", message: `Error reading sector 0` });
    mylog.warn(`Error reading sector 0`);
    return disk_info_block;
  }

  const fpsId = sector0.sector_info_table[0].sector_id; // DD_READ_ID
  mylog.debug(`First physical sector id: ${fpsId} (0x${fpsId.toString(16)})`);

  mylog.debug(`Looking at top two bits`);
  if ((fpsId & 0b11000000) >> 6 === 0b01) {
    mylog.debug(`ID is 40h-7Fh) then the disc is in CPC system format`);
    disk_info_block.cpc_format = "CPC System format";
    DPB = DD_SEL_FORMAT(1);
  } else if ((fpsId & 0b11000000) >> 6 === 0b11) {
    mylog.debug(`ID is 0C0h-0FFh) then the disc is in CPC data format`);
    disk_info_block.cpc_format = "CPC Data format";
    DPB = DD_SEL_FORMAT(2);
  } else {
    mylog.debug(`NOT CPC System/Data - Looking at boot sector`);
    const bootSector = sector0.sector_data[0].slice(0, 10);
    // examine 10 first bytes from cylinder 0, head 0, sector 1
    var hexString = "";
    for (var i = 0; i < bootSector.length; i++) {
      hexString += "0x" + bootSector[i].toString(16) + ",";
    }
    mylog.debug(`Boot Sector: ${hexString}`);

    // If all bytes of the spec are 0E5h, it should be assumed that the disc is a 173k PCW/Spectrum +3 disc
    var all_0xe5 = true;
    for (var i = 0; i < bootSector.length; i++) {
      all_0xe5 = all_0xe5 && bootSector[i] === 0xe5;
    }

    if (all_0xe5) {
      // If all bytes of the spec are 0E5h, it should be assumed that the disc is a 173k PCW/Spectrum +3 disc
      mylog.debug("PCW/Spectrum +3");
      disk_info_block.cpc_format = "PCW/Spectrum +3";
      DPB = DD_SEL_FORMAT(0);
    } else {
      disk_info_block.cpc_format = "PCW";
      DPB = DD_SEL_FORMAT(sector0.sector_data[0][0]);

      const disk_specs = {
        format: sector0.sector_data[0][0],
        sideness: sector0.sector_data[0][1],
        tracks: sector0.sector_data[0][2],
        sectors: sector0.sector_data[0][3],
        psh: sector0.sector_data[0][4],
        off: sector0.sector_data[0][5],
        bsh: sector0.sector_data[0][6],
        no_of_dir_blocks: sector0.sector_data[0][7],
      };
      DPB.psh = disk_specs.psh;
      DPB.off = disk_specs.off;
      DPB.bsh = disk_specs.bsh;
      disk_info_block.number_of_tracks = disk_specs.tracks;
      mylog.info(`Specs from boot record: ${JSON.stringify(disk_specs)}`);
    }
  }

  /**
  if(true) {
    mylog.debug(`TRACK DEBUG BEGIN ***********************************************************************`);
    for(var t = 0; t < disk_info_block.number_of_tracks; t++) {
      read_track_info(data, t, DPB, disk_info_block);
    }
    mylog.debug(`TRACK DEBUG END ***********************************************************************`);
  }
 */

  mylog.debug(`Looking for directory... no of reserved track(s): ${DPB.off}`);

  const dir_sector = DPB.off; // first non-reserved track
  // each DIR entry = 32 bytes
  // drm + 1 * 32 = 2048 / 128<<psh (512) = 4 sectors
  const track_data = read_track_info(data, dir_sector, DPB, disk_info_block);

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
    if (file_entry.ua < 16) {
      mylog.debug(
        `${file_entry.ua}, ${file_entry.filename}.${file_entry.ext} ex=${entry.charCodeAt(12)}, s1=${entry.charCodeAt(13)}, s2=${entry.charCodeAt(
          14
        )}, rc=${entry.charCodeAt(15)} - ${file_entry.read_only ? "read_only" : ""} ${file_entry.hidden > 0 ? "hidden" : ""} ${
          file_entry.archived ? "archived" : ""
        }`
      );
      mylog.debug(`\t\tAL: ${al}`);
    }
    // MOSTLY USED FOR DEBUG

    var item = file_map.get(current_filename + current_ext);
    if (valid_filename(entry.slice(1, 9))) {
      if (item && file_entry.ua === 0) {
        item.rc_sum = item.rc_sum + current_rc;
        item.file_size = Math.ceil((item.rc_sum * 128) / (128 << DPB.bsh));
        // mylog.debug(`updating: ${JSON.stringify(item)}`);
        file_map.set(current_filename + current_ext, item);
      } else if (!item && file_entry.ua === 0) {
        file_entry.rc_sum = current_rc;
        file_entry.file_size = Math.ceil((file_entry.rc_sum * 128) / (128 << DPB.bsh));
        // mylog.debug(`creating new: ${JSON.stringify(file_entry)}`);
        file_map.set(current_filename + current_ext, file_entry);
      } else if (file_entry.ua === 0xe5) {
        // mylog.debug(`DELETED: ${current_filename}.${current_ext}`);
        file_map.delete(current_filename + current_ext);
      } else {
        mylog.debug(`Unknown UA: ${file_entry.ua} for file: ${current_filename}${current_ext}`);
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

  const protection = detectProtectionSystem(data, DPB, disk_info_block);

  disk_info_block.protection = protection;

  return disk_info_block;
}

function detectProtectionSystem(data, DPB, disk_info_block) {
  const mylog = log.scope("detectProtectionSystem");

  mylog.debug(`Trying to detect if copy protection used...`);

  var result = "";
  const track0 = read_track_info(data, 0, DPB, disk_info_block);

  // convert track data to "String"
  var track0asString = "";
  for (var t = 0; t < track0.sector_data.length; t++) {
    track0asString += track0.sector_data[t].toString();
  }
  const track1 = read_track_info(data, 1, DPB, disk_info_block);

  // Alkatraz copy-protection
  if (track0asString.includes(" THE ALKATRAZ PROTECTION SYSTEM   (C) 1987  Appleby Associates")) {
    mylog.info(`Protection Detected: Alkatraz +3 (signed)`);
    result = "Alkatraz +3";
  }

  // Paul Owens
  if (track0asString.includes(`PAUL OWENS`) && track0asString.includes(`PROTECTION SYSTEM`)) {
    mylog.info(`Protection Detected: Paul Owens/OCEAN (signed)`);
    result = "Paul Owen";
  }
  if (track0.num_sectors === 9 && disk_info_block.no_of_tracks > 10 && track1.num_sectors === 0) {
    mylog.info(`trying to detech Paul Owens...`);
  }

  // Speedlock +3 1987
  if (track0asString.includes("SPEEDLOCK +3 DISC PROTECTION SYSTEM COPYRIGHT 1987 SPEEDLOCK ASSOCIATES")) {
    mylog.info(`Protection Detected: Speedlock +3 1987 (signed)`);
    result = "Speedlock +3 1987";
  }
  if (
    track0.num_sectors === 9 &&
    track1.num_sectors === 5 &&
    128 << track1.sector_info_table[0].sector_size === 1024 &&
    track0.sector_info_table[6].FDC_status_reg2 === 64 &&
    track0.sector_info_table[8].FDC_status_reg2 === 0
  ) {
    mylog.info(`Protection Detected: Speedlock +3 1987 (unsigned)`);
    result = "Speedlock +3 1987 (u)";
  }

  // Speedlock +3 1988
  if (track0asString.includes("SPEEDLOCK +3 DISC PROTECTION SYSTEM COPYRIGHT 1988 SPEEDLOCK ASSOCIATES")) {
    mylog.info(`Protection Detected: Speedlock +3 1988 (signed)`);
    result = "Speedlock +3 1988";
  }
  if (
    track0.num_sectors === 9 &&
    track1.num_sectors === 5 &&
    128 << track1.sector_info_table[0].sector_size === 1024 &&
    track0.sector_info_table[6].FDC_status_reg2 === 64 &&
    track0.sector_info_table[8].FDC_status_reg2 === 64
  ) {
    mylog.info(`Protection Detected: Speedlock +3 1988 (unsigned)`);
    result = "Speedlock +3 1988 (u)";
  }

  // Speedlock 1988
  if (track0asString.includes("SPEEDLOCK DISC PROTECTION SYSTEMS (C) 1988 SPEEDLOCK ASSOCIATES")) {
    mylog.info(`Protection Detected: Speedlock 1988 (signed)`);
    result = "Speedlock 1988";
  }

  // Speedlock 1989
  if (track0asString.includes("SPEEDLOCK DISC PROTECTION SYSTEMS (C) 1989 SPEEDLOCK ASSOCIATES")) {
    mylog.info(`Protection Detected: Speedlock 1989 (signed)`);
    result = "Speedlock 1989";
  }
  if (
    track0.num_sectors > 7 &&
    disk_info_block.no_of_tracks > 40 &&
    track1.num_sectors === 1 &&
    track1.sector_info_table[0].sector_id === 193 &&
    track1.sector_info_table[0].FDC_status_reg1 === 32
  ) {
    mylog.info(`Protection Detected: Speedlock 1989 (unsigned)`);
    result = "Speedlock 1989 (u)";
  }

    // Three Inch Loader
    if (track0asString.includes("***Loader Copyright Three Inch Software 1988, All Rights Reserved. Three Inch Software, 73 Surbiton Road, Kingston upon Thames, KT1 2HG***")) {
      mylog.info(`Protection Detected: Three Inch Loader type 1 (signed)`);
      result = "Three Inch Loader type 1";
    }
  
  return result;
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

  var isExtended = false;
  const signature = String.fromCharCode.apply(null, data.slice(0, 34));
  if (signature === "EXTENDED CPC DSK File\r\nDisk-Info\r\n") {
    mylog.debug(`Extended DSK format...`);
    isExtended = true;
  }

  const disk = readEDSK(data, isExtended);
  if (disk.isExtended) isExtended = true;

  snapshot.error = disk.error;
  snapshot.protection = disk.protection;
  snapshot.text = `${isExtended ? "Ext. " : ""} ${disk.cpc_format}, T:${disk.number_of_tracks}, S:${disk.number_of_sides} - ${disk.name_of_creator}`;
  mylog.info(disk.total_size + "K total, " + disk.total_size_used + "K used, " + disk.total_size_free + "K free");
  snapshot.dir_scr = { entries: disk.dir, disk_info: disk };
  mylog.info(snapshot.text);
  if (disk.dir) mylog.debug([...disk.dir.keys()]);

  snapshot.data = regs;

  return snapshot;
}

exports.readDSK = readDSK;
exports.createDIRScreen = createDIRScreen;
