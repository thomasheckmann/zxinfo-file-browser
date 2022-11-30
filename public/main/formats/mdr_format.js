const log = require("electron-log");
const Jimp = require("jimp");
const screenZX = require("../utilities/handleSCR");

function cleanString(filename) {
  const mylog = log.scope("cleanString");
  var cleanedFilename = "";
  for (var i = 0; i < filename.length; i++) {
    cleanedFilename = cleanedFilename + String.fromCharCode(filename.charCodeAt(i) & 0x7f);
  }
  // mylog.debug(`cleaned: ${cleanedFilename}`);
  return cleanedFilename;
}

function createDIRScreen(dirdata) {
  const cartridge_name = dirdata.title;
  const freespace = dirdata.freespace;
  const catalog = dirdata.catalog;

  // create a SCR preview of DIR
  let image = new Jimp(320, 240, Jimp.cssColorToHex("#D7D7D7"), (err, image) => {
    if (err) throw err;
  });

  screenZX.printAtSpectrum(image, 0, 0, cartridge_name, 22);

  var line = 2;
  for (let [key, value] of catalog) {
    var text = `${value.filename} - ${Math.ceil(value.size / 1024)}K `;
    if (line < 20) {
      screenZX.printAtSpectrum(image, 0, line, text, 22);
      line += 1;
    }
  }

  const endText2 = `${freespace}`;
  screenZX.printAtSpectrum(image, 0, line + 1, endText2, 999999);

  // image.write("./file.png");
  return image.getBase64Async(Jimp.MIME_PNG);
}

function readMDR(data) {
  const mylog = log.scope("readMDR");
  mylog.debug(`input: ${data.length}`);

  var snapshot = { type: "MDR", error: [], scrdata: null, data: [] };
  snapshot.scrdata = null;

  var regs = {};
  regs.filesize = data.length;

  // A cartridge file contains 254 'sectors' of 543 bytes each
  var file_map = new Map();
  var no_of_used_blocks = 0;
  var media_info = { title: null, freespace: 0, catalog: null };

  var i;
  for (i = 0; i < 254 && ((i * 543)< (data.length - 29)); i++) {
    const offset = i * 543;

    const block = data.slice(offset, offset + 543);
    const mdr_block = {
      hdflag: block[0],
      hdnumb: block[1],
      hdname: cleanString(String.fromCharCode.apply(null, block.slice(4, 14))),
      hdchk: block[14],
      recflg: block[15].toString(2),
      recnum: block[16],
      reclen: block[17] + block[18] * 256,
      recnam: String.fromCharCode.apply(null, block.slice(19, 29)),
      deschk: block[29],
    };

    const usedBlock = (mdr_block.recflg & 0b00000010) > 0 || mdr_block.reclen === 512;
    const emptyBlock = (mdr_block.recflg & 0b00000010) === 0 && mdr_block.recflg === 0;
    const unusableBlock = (mdr_block.recflg & 0b00000010) >0  && mdr_block.reclen === 0;
    media_info.title = mdr_block.hdname;

    mylog.debug(`(s: ${mdr_block.hdnumb}, d: ${mdr_block.recnum} - used: ${usedBlock}, empty: ${emptyBlock}, unusable: ${unusableBlock})`);

    if (usedBlock && !unusableBlock) {
      no_of_used_blocks++;
      mylog.debug(
        `hdflag: ${mdr_block.hdflag}, hdnumb: ${mdr_block.hdnumb}, hdname: ${mdr_block.hdname}, recflg: ${mdr_block.recflg}, recnum: ${mdr_block.recnum}, recname: ${mdr_block.recnam}, reclen: ${mdr_block.reclen}`
      );

      var item = file_map.get(mdr_block.recnam);
      if (item) {
        item.size = item.size + mdr_block.reclen;
        file_map.set(mdr_block.recnam, item);
      } else {
        const entry = { hdname: mdr_block.hdname, filename: mdr_block.recnam, size: mdr_block.reclen };
        file_map.set(mdr_block.recnam, entry);
      }
    }
  }

  if(i < 254) {
    snapshot.error.push({type: "warning", message: `Number of sectors (${i}) < 254`});
    mylog.warn(`Number of sectors (${i}) < 254`);
  }
  const freeSpace = (254 * 512) / 1024 - Math.ceil((no_of_used_blocks * 512) / 1024);
  const sortedCatalo = new Map([...file_map].sort());
  media_info.catalog = sortedCatalo;
  media_info.freespace = freeSpace;

  mylog.log(`Total used blocks: ${no_of_used_blocks} (${Math.ceil((no_of_used_blocks * 512) / 1024)}) / 254 (${(254 * 512) / 1024}) - Free: ${freeSpace}`);

  snapshot.media_info = media_info;
  snapshot.text = `${media_info.title}, sectors: ${no_of_used_blocks} / 254 - Free: ${freeSpace}K`;
  mylog.debug(media_info);

  snapshot.data = regs;

  return snapshot;
}

exports.readMDR = readMDR;
exports.createDIRScreen = createDIRScreen;
