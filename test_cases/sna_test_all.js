/**
 * Test run a large number of SNA files
 */

const folders = [
  "/Users/dkThAhKo/Documents/ZXRepo/TOSEC_2020/",
  "/Users/dkThAhKo/Documents/ZXRepo/TZXVault/",
  "/Users/dkThAhKo/Documents/ZXRepo/TZXVaultUpdate/",
  "/Users/dkThAhKo/Documents/ZXRepo/World of Spectrum June 2017 Mirror/sinclair/games/",
];
const format = require("../public/main/formats/sna_format");
const helper = require("./formatHelper");
const log = require("electron-log");
const path = require("path");
log.transports.console.level = "info";

log.transports.file.resolvePath = () => path.join('.', 'output.log');
log.transports.file.getFile().clear();
log.transports.file.level = true;
const mylog = log.scope("sna_test_all");

var totalFiles = 0;
folders.forEach((folder) => {
  mylog.info(`********************************************************`);
  mylog.info(`* DIR: [${folder}]`);
  mylog.info(`********************************************************`);
  const count = helper.testRun(format.readSNA, folder, "sna");
  totalFiles += count;
});

mylog.info(`********************************************************`);
mylog.info(`* TOTAL NUMBER of files processed: ${totalFiles}`);
mylog.info(`* TOTAL NUMBER of directories processed: ${folders.length}`);
mylog.info(`********************************************************`);
