/**
 * Test run a large number of O files
 */

const folders = [
    "./p/",
    //"/Users/dkThAhKo/Documents/ZXRepo/ZX81/",
  ];
  
  const format = require("../public/main/formats/o_format");
  const helper = require("./formatHelper");
  const log = require("electron-log");
  // const path = require("path");
  log.transports.console.level = "silly";
  
  // log.transports.file.fileName = path.join('.', 'output.log');
  // log.transports.file.getFile().clear();
  log.transports.file.level = true;
  log.transports.console.level = "silly";
  const mylog = log.scope("p_test_all");
  
  var totalFiles = 0;
  folders.forEach((folder) => {
    mylog.info(`********************************************************`);
    mylog.info(`* DIR: [${folder}]`);
    mylog.info(`********************************************************`);
    const count = helper.testRun(format.readO, format.createBASICListAsScr, folder, "o");
    totalFiles += count;
  });
  
  mylog.info(`********************************************************`);
  mylog.info(`* TOTAL NUMBER of files processed: ${totalFiles}`);
  mylog.info(`* TOTAL NUMBER of directories processed: ${folders.length}`);
  mylog.info(`********************************************************`);
  