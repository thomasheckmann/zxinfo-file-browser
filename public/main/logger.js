const log = require("electron-log");
const isDev = require("electron-is-dev");

var mylog = null;

const logger = () => {
  // error, warn, info, verbose, debug, silly
  if (mylog) return mylog;

  log.transports.console.level = isDev ? "silly" : "error";
  log.transports.file.level = isDev ? "info" : "info";
  log.initialize({ preload: false });
  // log.transports.file.getFile().clear();
  log.info("Initialized electron-log, OK");

  mylog = log;
  return mylog;
};

exports.logger = logger;
