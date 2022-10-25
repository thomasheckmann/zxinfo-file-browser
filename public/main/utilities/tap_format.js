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
const log = require("electron-log");
//log.transports.console.level = 'debug';

/**
 * Then raw tape data follows, including the flag and checksum bytes.
 * @param {*} data
 */
function createHeader(data) {
  const mylog = log.scope("createHeader");

  let dataBlock = {
    flag: null,
    error: null,
  };

  const flagByte = data[0];
  mylog.debug(`flag: ${flagByte}`);
  if (flagByte === 0) {
    dataBlock.flag = "header";
    const headerBlock = data.subarray(1, 18);

    switch (headerBlock[0]) {
      case 0:
        dataBlock.type = "Program";
        dataBlock.name = String(headerBlock.subarray(1, 11));
        dataBlock.len = headerBlock[11] + headerBlock[12] * 256;
        // param 1
        const param1 = headerBlock[13] + headerBlock[14] * 256;
        if (param1 < 32768) dataBlock.autostart = param1;
        // param 2
        const param2 = headerBlock[15] + headerBlock[16] * 256;
        dataBlock.varstart = param2;
        break;
      case 1:
        dataBlock.type = "Number Array";
        break;
      case 2:
        dataBlock.type = "Character Array";
        break;
      case 3:
        dataBlock.type = "Code";
        dataBlock.name = String(headerBlock.subarray(1, 11));
        dataBlock.len = headerBlock[11] + headerBlock[12] * 256;
        // param 1
        dataBlock.startAddress = headerBlock[13] + headerBlock[14] * 256;
        // param 2
        if (headerBlock[15] + headerBlock[16] * 256 !== 32768) {
          mylog.warn(`For code - param 2 should be 32768....`);
        }
        break;
      default:
        dataBlock.type = null;
        dataBlock.error = "Invalid headertype (0, 1, 2, 3): " + headerBlock[0];
        break;
    }
  } else {
    dataBlock.error = `Not a header block: ${flagByte}`;
  }

  mylog.debug(`${JSON.stringify(dataBlock)}`);
  return dataBlock;
}

function createData(data) {
  const mylog = log.scope("createData");

  let dataBlock = {
    flag: null,
    data: null,
    error: null,
  };
  const flagByte = data[0];
  mylog.debug(`flag: ${flagByte}`);
  if (flagByte === 0xff) {
    dataBlock.flag = "data";
    dataBlock.data = data.subarray(1, data.length - 1);
  } else {
    dataBlock.error = `Not a data block: ${flagByte}`;
  }

  return dataBlock;
}

function readTAP(data) {
  const mylog = log.scope("readTAP");
  mylog.log(`input: ${data.length}`);

  var snapshot = { type: null, error: null, scrdata: null };
  snapshot.type = "TAP";

  let tap = [];

  for (let index = 0; index < data.length; ) {
    const blockLength = data[index] + data[index + 1] * 256;
    index += 2; // skip two length bytes
    const dataBlock = data.subarray(index, index + blockLength);
    if (dataBlock[0] === 0) {
      const block = createHeader(dataBlock);
      if (block.error) {
        snapshot.error = block.error;
      }
      tap.push(block);
    } else if (dataBlock[0] === 255) {
      const block = createData(dataBlock);
      if (block.error) {
        snapshot.error = block.error;
      }
      tap.push(block);
    }
    index += blockLength; // skip data block
  }

  // iterate tap[] - find first code block starting at 16384 OR with lengh og 6912
  for (let index = 0; index < tap.length; index++) {
    const element = tap[index];
    if(element.type = "Code") {
      if(element.startAddress === 16384) {
        mylog.debug(`Found code starting at 16384...(screen area)`);
        snapshot.scrdata = tap[index+1].data;
        break;
      } else if (element.len === 6912) {
        mylog.debug(`Found code with length 6912...(screen length)`);
        snapshot.scrdata = tap[index+1].data;
        snapshot.border = 7;
        break;
      }
    }
  }

  return snapshot;
}

// const testdata = readTAP("./testdata/ElStompo.tap");

exports.readTAP = readTAP;
