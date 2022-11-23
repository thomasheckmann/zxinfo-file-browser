/**
 * Test run a large number of P files
 */

const folders = [
  "/Users/dkThAhKo/Documents/ZXRepo/ZX81/",
];
const format = require("../public/main/formats/p_format");
const helper = require("./formatHelper");
const log = require("electron-log");
const path = require("path");
log.transports.console.level = "info";

log.transports.file.resolvePath = () => path.join('.', 'output.log');
log.transports.file.getFile().clear();
log.transports.file.level = true;
const mylog = log.scope("p_test_all");

var totalFiles = 0;
folders.forEach((folder) => {
  mylog.info(`********************************************************`);
  mylog.info(`* DIR: [${folder}]`);
  mylog.info(`********************************************************`);
  const count = helper.testRun(format.readP, folder, "p");
  totalFiles += count;
});

mylog.info(`********************************************************`);
mylog.info(`* TOTAL NUMBER of files processed: ${totalFiles}`);
mylog.info(`* TOTAL NUMBER of directories processed: ${folders.length}`);
mylog.info(`********************************************************`);
