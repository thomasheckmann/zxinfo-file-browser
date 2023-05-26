const log = require("electron-log");

const fs = require("fs");
const path = require("path");

const handleFormats = require("../public/main/formats/handleFormats");

var mylog = null;
const logger = () => {
  // error, warn, info, verbose, debug, silly
  if (mylog) return mylog;

  log.transports.console.level = "silly";
  log.transports.console.format = "[{level}] {scope}\t{text}";
  log.initialize({ preload: true });
  log.info("Initialized electron-log, OK");

  mylog = log;
  return mylog;
};

const f = async (event, arg) => {
  const mylog = logger().scope("load-file");
  mylog.debug(`loading details for file: ${arg}`);
  var hrstart = process.hrtime();

  const filename = arg;
  const filename_base = path.basename(filename);
  const filename_ext = path.extname(filename).toLocaleLowerCase();

  mylog.debug(`filename (base): ${filename}`);
  mylog.debug(`filename (base): ${filename_base}`);
  mylog.debug(`filename (ext): ${filename_ext}`);

  fs.readFile(filename, (err, data) => {
    if (err) throw err;
    let fileObj = handleFormats.getZXFormat(filename, null, data);
    mylog.log(`size of object for ${filename}: ${sizeof(fileObj)} bytes`);
    mylog.log(`size of object ${sizeof(data)} bytes`);
    mylog.debug(`hash: ${fileObj.sha512}`);
  });
};

f(null, "/Users/dkThAhKo/Public/ZXTestData/TAPE/TAP/TAP_ok/Jet Set Willy (1984)(Software Projects).tap");
