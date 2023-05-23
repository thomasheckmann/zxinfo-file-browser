/**
 *
 * https://worldofspectrum.org/faq/reference/formats.htm#Tape
 *
 * https://sinclair.wiki.zxnet.co.uk/wiki/TAP_format
 *
 *    data,
 *    srcdata,
 *    type,
 *    error,
 * }
 */
const { logger } = require("../logger.js");
const { ZXInfoCard } = require("../ZXInfoCard");
const util = require("./tape_util");

function readTAP(filename, subfilename, md5hash, data, isPreview) {
  const mylog = logger().scope("readTAP");
  mylog.debug(`input: ${data.length}`);
  mylog.info(`processing TAP file, preview only: ${isPreview}`);

  // error: Array of warning and error messages for this file
  var zxObject = new ZXInfoCard(filename, subfilename, md5hash);

  var regs = {};
  regs.filesize = data.length;

  let tap = [];

  for (let index = 0; index < data.length; ) {
    const blockLength = data[index] + data[index + 1] * 256;
    index += 2; // skip two length bytes
    const dataBlock = data.subarray(index, index + blockLength);
    if (dataBlock[0] === 0) {
      mylog.debug(`found header block at index: ${index}`);
      const block = util.createHeader(dataBlock, index);
      if (block.error.length > 0) {
        for (var i in block.error) {
          zxObject.error.push(block.error[i]);
        }
      }
      tap.push(block);
    } else if (dataBlock[0] === 255) {
      const block = util.createData(dataBlock, index);
      block.type = "...data";
      if (block.error.length > 0) {
        for (var i in block.error) {
          zxObject.error.push(block.error[i]);
        }
      }
      mylog.debug(`found data block at index: ${index}, length=${block.data.length}`);
      tap.push(block);
    } else {
      mylog.warn(`index: ${index} - Unknown block (${dataBlock[0]})`);
      zxObject.error.push({ type: "warning", message: `index: ${index} - Unknown block type (${dataBlock[0]})` });
    }
    index += blockLength; // skip data block
  }

  // iterate tap[] - find first code block starting at 16384 OR with lengh og 6912
  mylog.debug(`tap structure length: ${tap.length}`);

  if (tap.length === 0) {
    zxObject.error.push({ type: "error", message: "TAP lenght 0, invalid" });
  } else {
    zxObject.text = tap[0].type + ": " + tap[0].name;
    for (let index = 0; index < tap.length; index++) {
      const element = tap[index];
      mylog.debug(`${index}: ${element.type}, ${element.flag} - ${element.name}, ${element.len}`);
      if (element.type === "Code") {
        if (element.startAddress === 16384) {
          mylog.debug(`Found code starting at 16384...(screen area), limit to size: 6912`);
          zxObject.scrdata = tap[index + 1].data.subarray(0, 6912);
          zxObject.border = 7;
          break;
        } else if (element.len === 6912) {
          mylog.debug(`Found code with length 6912...(screen length)`);
          if (tap[index + 1]) {
            zxObject.scrdata = tap[index + 1].data;
            zxObject.border = 7;
          } else {
            zxObject.border = 2;
          }
          break;
        } else if (element.len > 6912) {
          mylog.debug(`Found code with length(${element.len}) > 6912 - try using it as screen...`);
          if (tap[index + 1]) {
            zxObject.scrdata = tap[index + 1].data.subarray(0, 6912);
            zxObject.border = 7;
          } else {
            zxObject.border = 2;
          }
          break;
        }
      } else if (zxObject.scrdata === null && element.type === "...data") {
        // headerless data with length 6912 or bigger than 32768
        mylog.debug(`data block: ${element.data.length}`);
        if (element.data.length > 32767 || element.data.length === 6912) {
          mylog.debug(`Headerless data with length(${element.data.length}) > 32767 - try using it as screen...`);
          zxObject.scrdata = element.data.subarray(0, 6912);
          zxObject.border = 7;
        }
      }
    }
  }

  if (isPreview) {
    // NOT required for preview mode
    zxObject.data = null;
    regs.tape = null;
  } else {
    regs.tape = tap;
    zxObject.data = regs;
  }

  return zxObject;
}

// const testdata = readTAP("./testdata/ElStompo.tap");

exports.readTAP = readTAP;
