const path = require("path");

function ZXInfoCard(zxfile, zxsubfilename, md5hash) {
    this.filepath = zxfile;
    this.filename = path.basename(zxfile);
    this.subfilename = zxsubfilename;
    this.text = null;
    this.hwmodel = null;
    this.type = null; // final format, pfmt, tzxfmt - e.g. tzxfmt -> p81fmt
    this.version = null;
    this.sha512 = md5hash;
    this.error = [];
    this.scrdata = null; // display memory as found on ZX Spectrum
}

exports.ZXInfoCard = ZXInfoCard;

// let ZXFileInfo = {
//     filepath: fileName, // full filepath
//     filename: path.basename(fileName), // base filename incl. extension
//     subfilename: subFileName, // filename, if within ZIP archive
//     text: null, // additional text/info to display, e.g. Program name
//     type: null, // dskfmt, tapfmt etc...
//     version: null,  // 
//     sha512: sum.digest("hex"),
//     scr: null,  // screenshot as base64
//     error: [],
//   };
