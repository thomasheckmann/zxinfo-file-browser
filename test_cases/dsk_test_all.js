/**
 * Test run a large number of DSK files
 */

 const folders = [
    "./disk"
/** 
    "/Users/dkThAhKo/Public/ZXTestData/WITH_ERRORS/DSK_with_errors",
    "/Users/dkThAhKo/Documents/ZXRepo/TOSEC_2020",
    "/Users/dkThAhKo/Documents/ZXRepo/TZXVault/Spectrum/",
    "/Users/dkThAhKo/Documents/ZXRepo/TZXVaultUpdate/Beta Disk",
    "/Users/dkThAhKo/Documents/ZXRepo/World of Spectrum June 2017 Mirror/sinclair/games",*/
  ];
  
  const format = require("../public/main/formats/dsk_format");
  const helper = require("./formatHelper");
  const log = require("electron-log");
  const path = require("path");
  log.transports.console.level = "debug";
  
  log.transports.file.resolvePath = () => path.join('.', 'output.log');
  log.transports.file.getFile().clear();
  log.transports.file.level = true;
  const mylog = log.scope("dsk_test_all");
  
  var totalFiles = 0;
  folders.forEach((folder) => {
    mylog.info(`********************************************************`);
    mylog.info(`* DIR: [${folder}]`);
    mylog.info(`********************************************************`);
    const count = helper.testRun(format.readDSK, folder, "dsk");
    totalFiles += count;
  });
  
  mylog.info(`********************************************************`);
  mylog.info(`* TOTAL NUMBER of files processed: ${totalFiles}`);
  mylog.info(`* TOTAL NUMBER of directories processed: ${folders.length}`);
  mylog.info(`********************************************************`);
  