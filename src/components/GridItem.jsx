/**
 * GridItem - used in compact grid view mode
 */

import { IconButton, ImageListItem, ImageListItemBar, Tooltip, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import FileDetailsDialog from "../components/FileDetails";

import GamepadOutlinedIcon from "@mui/icons-material/GamepadOutlined";

import {ZXInfoSettingsCtx} from "../common/ZXInfoSettings";
import Favorite from "../common/cardactions/Favorite";
import LocateFileAndFolder from "../common/cardactions/LocateFileAndFolder";

import { zxdbFileCheck, validJSSpeccyFormat, handleUserSelectedSCR } from "../common/filecheck.js";
import JSSpeccyDialog from "./JSSpeccyDialog";

export default function GridItem(props) {
  const [appSettings] = useContext(ZXInfoSettingsCtx);
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

    // File is valid for JSSpeccy
    const [isFileJSSpeccyValid, setFileJSSpeccyValid] = useState(false);

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

  function getTitle() {
    var title = entry.subfilename ? entry.subfilename + " in (" + entry.filename + ")" : entry.filename;
    if (entry.zxdbTitle) {
      title = `${entry.zxdbTitle} [${title}]`;
    }
    return title;
  }

  // handle user selected SCR
  useEffect(() => {
    handleUserSelectedSCR(entry, setEntry, appSettings, selectedSCR, originalScreen);
  }, [selectedSCR]);

  useEffect(() => {
    // make sure we only call the API once
    console.log("XXXX");
    if (!restCalled) {
      zxdbFileCheck(props.entry, appSettings.zxinfoSCR, setEntry, setOriginalScreen, setRestCalled);
      setFileJSSpeccyValid(validJSSpeccyFormat(props.entry));
    }
  }, [appSettings.zxinfoSCR, props.entry, restCalled]);

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
              isFileJSSpeccyValid && (
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
