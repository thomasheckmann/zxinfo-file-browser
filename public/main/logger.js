const isElectron = require("is-electron");
const log = require("electron-log");

// isDev aways true, if NOT running in Electron environment...
const isDev = isElectron() ? require("electron-is-dev") : "true";

var mylog = null;

const logger = () => {
  // error, warn, info, verbose, debug, silly
  if (mylog) return mylog;

  log.initialize({ preload: true, spyRendererConsole: true });

  // console level in dev the same as file level in prod
  log.transports.console.level = isElectron() ? (isDev ? "info" : "error") : "silly";
  log.transports.file.level = isDev ? "silly" : "info";
  log.transports.file.format = "[{level}]({processType})-{scope}\t{text}";
  log.transports.file.fileName = isDev ? "dev-main.log" : "main.log";
  // NOT working... log.transports.file.getFile().clear();
  log.info(`Initialized electron-log, OK - logging to: ${log.transports.file.fileName}`);

  mylog = log;
  return mylog;
};

exports.logger = logger;
