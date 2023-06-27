import { mylog } from "../App";
import axios from "axios";

/**
 * Calls ZXInfo 'filecheck' API
 * @param {*} e
 */
export function zxdbFileCheck(entry, zxinfoSCR, setEntryCallback, setOriginalScreenCallback, setRestCalledCallback) {
  const sources = new Map([
    ['spectrumcomputing.co.uk', './images/icons/sc.png'],
    ['TOSEC 2020', './images/icons/tosec.png'],
    ['WOS June 2017 Mirror', './images/icons/archive.png'],
    ['ZX81 STUFF', './images/icons/zx81stuff.png']
  ]);

  const dataURL = `https://api.zxinfo.dk/v3/filecheck/${entry.sha512}`;
  mylog("filecheck.js", "zxdbFileCheck", `OPEN, get API data for: ${entry.sha512} - endPoint: ${dataURL}`);
  axios
    .get(dataURL)
    .then((response) => {
      let item = entry;
      item.orgScr = entry.scr;

      // save original SCR detected from file
      setOriginalScreenCallback(entry.scr);
      item.zxdbID = response.data.entry_id;
      item.zxdbTitle = response.data.title;
      item.sha512 = entry.sha512;

      item.zxinfoVersion = response.data.zxinfoVersion;
      item.contentType = response.data.contentType;
      item.originalYearOfRelease = response.data.originalYearOfRelease;
      item.machinetype = response.data.machineType;
      item.genre = response.data.genre;
      item.genreType = response.data.genreType;
      item.genreSubType = response.data.genreSubType;
      item.publishers = response.data.publishers;

      item.sources = [];
      for (const key in response.data.file) {
        var logo = sources.get(response.data.file[key].source);
        if(logo === null) logo = "./images/icons/default.png";
        const src_item = {source: response.data.file[key].source, logo: logo};
        item.sources.push(src_item);
      }
      
      const files = response.data.file;
      if (item.subfilename && item.filename) {
        const f = files.find((i) => i.archive === item.filename && i.filename === item.subfilename);
        if (f.comments) {
          item.comments = f.comments;
        }
      } else {
        const f = files.find((i) => i.filename === item.filename);
        if (f.comments) {
          item.comments = f.comments;
        }
      }

      // look up SCR if user selected
      const zxdbSCR = zxinfoSCR.get(entry.sha512);
      if (zxdbSCR) {
        mylog("filecheck.js", "zxdbFileCheck", `using user selected screen`);
        item.scr = zxdbSCR;
      }
      setEntryCallback((entry) => item);
    })
    .catch((error) => {
      // Not found, or other API call errors
      mylog("filecheck.js", "zxdbFileCheck", `NOT found or error: ${error}`);
      const zxdbSCR = zxinfoSCR.get(entry.sha512);
      if (zxdbSCR) {
        mylog("filecheck.js", "zxdbFileCheck", `using user selected screen`);
        setEntryCallback({ ...entry, scr: zxdbSCR });
      } else {
        entry.orgScr = entry.scr;
        setEntryCallback(entry);
      }
    })
    .finally(() => {
      mylog("filecheck.js", "zxdbFileCheck", `setting all done...`);
      setRestCalledCallback(true);
    });
}

export function handleUserSelectedSCR(entry, setEntry, appSettings, selectedSCR, originalScreen) {
  var useScreen = null;
  if (selectedSCR === undefined) {
    mylog("filecheck.js", "handleUserSelectedSCR", `handling selectSCR, undefined... ?`);
    //
  } else if (entry && selectedSCR === null) {
    mylog("filecheck.js", "handleUserSelectedSCR", `deleting user selected...`);
    // delete user selected and set default
    if (appSettings.zxinfoSCR.size > 0) {
      appSettings.zxinfoSCR.delete(entry.sha512);
    }
    useScreen = originalScreen;
  } else if (entry && appSettings.zxinfoSCR.size === 0) {
    // zxinfoSCR, first time
    appSettings.zxinfoSCR = new Map();
    appSettings.zxinfoSCR.set(entry.sha512, selectedSCR);
    useScreen = selectedSCR;
  } else if (entry && appSettings.zxinfoSCR.size > 0) {
    appSettings.zxinfoSCR.set(entry.sha512, selectedSCR);
    useScreen = selectedSCR;
  }

  if (useScreen && entry) {
    setEntry((entry) => ({ ...entry, scr: useScreen }));
    var obj1 = Object.fromEntries(appSettings.zxinfoSCR);
    var jsonString1 = JSON.stringify(obj1);
    window.electronAPI.setZxinfoSCR("zxinfoSCR", jsonString1);
  }
}

export function formatType(t) {
  switch (t) {
    case "snafmt":
      return "SNA";
    case "z80fmt":
      return "Z80";
    case "tapfmt":
      return "TAP";
    case "tzxfmt":
      return "TZX";
    case "dskfmt":
      return "DSK";
    case "sclfmt":
      return "SCL";
    case "trdfmt":
      return "TRD";
    case "mdrfmt":
      return "MDR";
    case "pfmt":
      return "P";
      case "ofmt":
        return "O";
      case "zip":
      return "ZIP";
    default:
      return t;
  }
}

export function validJSSpeccyFormat(entry) {
  mylog("filecheck.js", "validJSSpeccyFormat", `checking if ${entry.filename} (${entry.subfilename}) is a valid JSSpeccy format`);

  switch (formatType(entry.type)) {
    case "ZIP":
      return false;
    case "SNA":
    case "Z80":
    case "SZX":
    case "TAP":
      return true;
    case "TZX":
      // zx81 not supported
      return entry.hwmodel !== "ZX81";
    default:
      break;
  }
  return false;
}
