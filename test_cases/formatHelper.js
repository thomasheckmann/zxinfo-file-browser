const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

const log = require("electron-log");
const mylog = log.scope("()");

function getAllFiles(dirPath, arrayOfFiles, ext) {
  arrayOfFiles = arrayOfFiles || [];

  fs.readdirSync(dirPath).forEach(function (file) {
    let filepath = path.join(dirPath, file);
    let stat = fs.lstatSync(filepath);
    if (stat.isDirectory()) {
      arrayOfFiles = getAllFiles(filepath, arrayOfFiles, ext);
    } else {
      if (filepath.toLowerCase().endsWith(ext.toLowerCase()) || filepath.toLowerCase().endsWith(".zip")) {
        arrayOfFiles.push(filepath);
      }
    }
  });
  return arrayOfFiles;
}

function processZip(zipFile, readFunc, ext) {
  let filesAnalyzed = 0;
  var zipCount = 0;

  try {
    var zip = new AdmZip(zipFile);
    var zipEntries = zip.getEntries();
    mylog.info(`ZIP - ${zipEntries.length} entries`);
    zipEntries.forEach(async function (zipEntry) {
      if (!zipEntry.isDirectory && zipEntry.name.toLowerCase().endsWith(ext.toLowerCase())) {
        mylog.info(`[ZipEntry] ${zipEntry.name} in ${zipFile}`);
        try {
            const fileData = readFunc(zipEntry.getData());
            if (fileData) {
              zipCount++;
            }
    
        } catch (error) {
            mylog.error(`ERROR extracting: ${zipEntry.name} in ${zipFile}, skipping... ${error}`);
        }
      }
    });
  } catch (error) {
    mylog.error(`ERROR reading ZIP file: ${zipFile}, skipping... ${error}`);
    zipCount = 1;
  }

  mylog.info(`Number of files processed: ${filesAnalyzed} in ZIP ${zipFile}`);
  return zipCount;
}

function testRun(readFunc, folder, ext) {
  const result = getAllFiles(folder, [], ext);
  let filesAnalyzed = 0;
  result.map((file) => {
    mylog.info(file);
    if (file.toLowerCase().endsWith(".zip")) {
      const filesInZip = processZip(file, readFunc, ext);
      filesAnalyzed = filesAnalyzed + filesInZip;
    } else {
      const data = fs.readFileSync(`${file}`);
      const fileData = readFunc(data);
      if (fileData) {
        filesAnalyzed = filesAnalyzed + 1;
      }
    }
  });
  mylog.info(`Number of files processed: ${filesAnalyzed} in ${folder}`);
  return filesAnalyzed;
}

module.exports = { getAllFiles, testRun };
