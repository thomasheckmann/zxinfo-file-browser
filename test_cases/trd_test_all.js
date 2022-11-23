/**
 * Test run a large number of TRD files
 */

 const folders = [
    // "/Users/dkThAhKo/Public/ZXTestData/WITH_ERRORS/DSK_with_errors",
    "/Users/dkThAhKo/Documents/ZXRepo/TOSEC_2020",
    "/Users/dkThAhKo/Documents/ZXRepo/TZXVault/Spectrum/Disks",
    "/Users/dkThAhKo/Documents/ZXRepo/TZXVaultUpdate/Beta Disk",
    "/Users/dkThAhKo/Documents/ZXRepo/World of Spectrum June 2017 Mirror/sinclair/games",
  ];
  
  const format = require("../public/main/formats/trd_format");
  const helper = require("./formatHelper");
  const log = require("electron-log");
  const path = require("path");
  log.transports.console.level = "info";
  
  log.transports.file.resolvePath = () => path.join('.', 'output.log');
  log.transports.file.getFile().clear();
  log.transports.file.level = true;
  const mylog = log.scope("trd_test_all");
  
  var totalFiles = 0;
  folders.forEach((folder) => {
    mylog.info(`********************************************************`);
    mylog.info(`* DIR: [${folder}]`);
    mylog.info(`********************************************************`);
    const count = helper.testRun(format.readTRD, folder, "trd");
    totalFiles += count;
  });
  
  mylog.info(`********************************************************`);
  mylog.info(`* TOTAL NUMBER of files processed: ${totalFiles}`);
  mylog.info(`* TOTAL NUMBER of directories processed: ${folders.length}`);
  mylog.info(`********************************************************`);
  