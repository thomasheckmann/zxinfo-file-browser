const log = require("electron-log");
const isDev = require("electron-is-dev");

var mylog = null;

const logger = () => {
  // error, warn, info, verbose, debug, silly
  if (mylog) return mylog;

  log.transports.console.level = isDev ? "info" : "error";
  log.transports.file.format = '[{level}] {scope}\t{text}';
  log.transports.file.level = isDev ? "debug" : "info";
  log.initialize({ preload: true });
  // NOT working... log.transports.file.getFile().clear();
  log.info("Initialized electron-log, OK");

  mylog = log;
  return mylog;
};

exports.logger = logger;
