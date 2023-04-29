/**
 * GridItem - used in compact grid view mode
 */

import { IconButton, ImageListItem, ImageListItemBar, Tooltip, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import FileDetailsDialog from "../components/FileDetails";
import axios from "axios";

import GamepadOutlinedIcon from "@mui/icons-material/GamepadOutlined";

import ZXInfoSettings from "../common/ZXInfoSettings";
import Favorite from "../common/cardactions/Favorite";
import LocateFileAndFolder from "../common/cardactions/LocateFileAndFolder";

import { mylog } from "../App";
import JSSpeccyDialog from "./JSSpeccyDialog";

export default function GridItem(props) {
  const [appSettings, setAppSettings] = useContext(ZXInfoSettings);
  const [entry, setEntry] = useState();
  const [restCalled, setRestCalled] = useState(false);

  // File Details dialog
  const [isFileDetailsDialogOpen, setFileDetailsDialogOpen] = useState(false);
  const handleFileDetailsDialogClose = (value) => {
    setFileDetailsDialogOpen(false);
  };

  const handleFileDetailsDialogOpen = (e) => {
    setFileDetailsDialogOpen(true);
  };

  const [selectedSCR, setSelectedSCR] = useState("");
  const [originalScreen, setOriginalScreen] = useState();

  const handleSCRDialogClose = (value) => {
    setSelectedSCR((selectedSCR) => value);
  };

  // JSSpeccy Details dialog
  const [isJSSpeccyDialogOpen, setJSSpeccyDialogOpen] = useState(false);

  const handleJSSpeccyDialogClose = (value) => {
    setJSSpeccyDialogOpen(false);
  };

  const handleJSSpeccyDialogOpen = () => {
    setJSSpeccyDialogOpen(true);
  };

  const validJSSpeccyFormat = () => {
    mylog("EntryCard", "validJSSpeccyFormat", `checking if ${entry.filename} (${entry.subfilename}) is a valid JSSpeccy format`);

    switch (formatType(entry.type)) {
      case "ZIP":
        return false;
        break;
      case "SNA":
      case "Z80":
      case "SZX":
      case "TAP":
        return true;
      case "TZX":
        // zx81 not supported
        return entry.hwmodel !== "ZX81";
        break;
      default:
        break;
    }
    return false;
  };

  function formatType(t) {
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
      case "zip":
        return "ZIP";
      default:
        return t;
    }
  }

  function getTitle() {
    var title = entry.subfilename ? entry.subfilename + " in (" + entry.filename + ")" : entry.filename;
    if (entry.zxdbTitle) {
      title = `${entry.zxdbTitle} [${title}]`;
    }
    return title;
  }

  // handle user selected SCR
  useEffect(() => {
    var useScreen = null;

    if (selectedSCR === undefined) {
      mylog("GritItem", "useEffect", `handling selectSCR, undefined... ?`);
      //
    } else if (entry && selectedSCR === null) {
      // delete user selected and set default
      if (appSettings.zxinfoSCR.size > 0) {
        appSettings.zxinfoSCR.delete(props.entry.sha512);
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
  }, [selectedSCR]);

  useEffect(() => {
    if (!restCalled) {
      const dataURL = `https://api.zxinfo.dk/v3/filecheck/${props.entry.sha512}`;
      axios
        .get(dataURL)
        .then((response) => {
          let item = props.entry;
          item.orgScr = props.entry.scr;

          // save original SCR detected from file
          item.zxdbID = response.data.entry_id;
          item.zxdbTitle = response.data.title;
          item.source = response.data.file.source;
          item.sha512 = props.entry.sha512;

          item.zxinfoVersion = response.data.zxinfoVersion;
          item.contentType = response.data.contentType;
          item.originalYearOfRelease = response.data.originalYearOfRelease;
          item.machinetype = response.data.machineType;
          item.genre = response.data.genre;
          item.genreType = response.data.genreType;
          item.genreSubType = response.data.genreSubType;
          item.publishers = response.data.publishers;

          // look up SCR if user selected
          const zxdbSCR = appSettings.zxinfoSCR.get(props.entry.sha512);
          if (zxdbSCR) {
            item.scr = zxdbSCR;
          }
          setEntry((entry) => item);
        })
        .catch((error) => {
          // Not found, or other API call errors
          const zxdbSCR = appSettings.zxinfoSCR.get(props.entry.sha512);
          if (zxdbSCR) {
            setEntry({ ...props.entry, scr: zxdbSCR });
          } else {
            props.entry.orgScr = props.entry.scr;
            setEntry(props.entry);
          }
        })
        .finally(() => {
          setRestCalled(true);
        });
    }
  }, [props.entry]);

  return (
    entry && (
      <React.Fragment>
        {isJSSpeccyDialogOpen && <JSSpeccyDialog open={isJSSpeccyDialogOpen} onClose={handleJSSpeccyDialogClose} item={entry}></JSSpeccyDialog>}
        {isFileDetailsDialogOpen && (
          <FileDetailsDialog
            open={isFileDetailsDialogOpen}
            onClose={handleFileDetailsDialogClose}
            item={entry}
            handleclose={handleSCRDialogClose}
          ></FileDetailsDialog>
        )}
        <ImageListItem sx={{ border: 1, borderColor: "#c0c0c0" }}>
          <img src={entry.scr} alt={entry.filename} onClick={() => handleFileDetailsDialogOpen(this)} />
          <Favorite entry={entry} sx={{ position: "absolute", top: 0, left: 0 }}></Favorite>
          <LocateFileAndFolder path={entry.filepath} sx={{ position: "absolute", top: 0, right: 0 }} />
          <ImageListItemBar
            sx={{ backgroundColor: entry.zxdbID ? "#02b554" : "" }}
            title={
              <Tooltip title={getTitle()}>
                <Typography variant="caption" noWrap gutterBottom>
                  {getTitle()}
                </Typography>
              </Tooltip>
            }
            actionIcon={
              validJSSpeccyFormat() && (
                <Tooltip title="Play in emulator" onClick={() => handleJSSpeccyDialogOpen(this)}>
                  <IconButton arial-label="play in emulator" size="small">
                    <GamepadOutlinedIcon sx={{ color: "rgba(255, 255, 255, 0.54)" }} />
                  </IconButton>
                </Tooltip>
              )
            }
          />
        </ImageListItem>
      </React.Fragment>
    )
  );
}
