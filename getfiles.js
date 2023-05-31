const path = require("path");

const { readdir } = require("fs").promises;
const supportedExts = [".sna", ".z80", ".slt", ".dsk", ".trd", ".scl", ".mdr", ".tap", ".tzx", ".p", ".p81", ".81", ".zip"];

const getFileList = async (dirName) => {
  var hrstart = process.hrtime();
  let files = [];
  const items = await readdir(dirName, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      files = [...files, ...(await getFileList(`${dirName}/${item.name}`))];
    } else {
      let extension = path.extname(item.name).toLowerCase();
      if (supportedExts.indexOf(extension) >= 0) {
        files.push(`${dirName}/${item.name}`);
      }
    }
  }
  const hrend = process.hrtime(hrstart);
  console.log(`time() ms: ${hrend[0] * 1000 + hrend[1] / 1000000} - ${dirName} => ${files.length}`);

  return files;
};

//getFileList('/Users/dkThAhKo/Documents/ZXRepo/TOSEC_2020').then((files) => {
getFileList("/Volumes/Speccy98/games").then((files) => {
  console.log(files);
});
