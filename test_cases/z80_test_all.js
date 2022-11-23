/**
 * Test run a large number of Z80 files
 */

const folders = [
  "/Users/dkThAhKo/Public/ZXTestData/WITH_ERRORS/Z80_with_errors",
  "/Users/dkThAhKo/Documents/ZXRepo/TOSEC_2020/",
  "/Users/dkThAhKo/Documents/ZXRepo/World of Spectrum June 2017 Mirror/sinclair/games/",
];
const format = require("../public/main/formats/z80_format");
const helper = require("./formatHelper");
const log = require("electron-log");
const path = require("path");
log.transports.console.level = "info";

log.transports.file.resolvePath = () => path.join('.', 'output.log');
log.transports.file.getFile().clear();
log.transports.file.level = true;
const mylog = log.scope("z80_test_all");

var totalFiles = 0;
folders.forEach((folder) => {
  mylog.info(`********************************************************`);
  mylog.info(`* DIR: [${folder}]`);
  mylog.info(`********************************************************`);
  const count = helper.testRun(format.readZ80, folder, "z80");
  totalFiles += count;
});

mylog.info(`********************************************************`);
mylog.info(`* TOTAL NUMBER of files processed: ${totalFiles}`);
mylog.info(`* TOTAL NUMBER of directories processed: ${folders.length}`);
mylog.info(`********************************************************`);
