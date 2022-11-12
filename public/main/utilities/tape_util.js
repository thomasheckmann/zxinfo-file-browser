const log = require("electron-log");

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
    mylog.debug(`data length: ` + dataBlock.data.length);
  } else {
    dataBlock.error = `Not a data block: ${flagByte}`;
    mylog.warn(`Not a data block: ${flagByte}`);
  }

  return dataBlock;
}

function createRAWData(data) {
  const mylog = log.scope("createRAWData");

  let dataBlock = {
    data: null,
  };
  dataBlock.data = data.subarray(data);
  dataBlock.len = data.length;

  mylog.debug(`data size: ${dataBlock.data.length}`);
  return dataBlock;
}

module.exports = {
  createHeader: createHeader,
  createData: createData,
  createRAWData: createRAWData
};