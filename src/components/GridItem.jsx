import { IconButton, ImageListItem, ImageListItemBar, Tooltip, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import FileDetailsDialog from "../components/FileDetails";
import axios from "axios";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import ZXInfoSettings from "../common/ZXInfoSettings";
import Favorite from "../common/cardactions/Favorite";
import LocateFileAndFolder from "../common/cardactions/LocateFileAndFolder";

import { mylog } from "../App";

export default function GridItem(props) {
  const [appSettings, setAppSettings] = useContext(ZXInfoSettings);
  const [entry, setEntry] = useState();
  const [restCalled, setRestCalled] = useState(false);

  // File Details dialog
  const [isFileDetailsDialogOpen, setFileDetailsDialogOpen] = useState(false);
  const handleFileDetailsDialogClose = (value) => {
    setFileDetailsDialogOpen(false);
  };

  const handleFileDetailsDialogOpen = () => {
    setFileDetailsDialogOpen(true);
  };

  const [selectedSCR, setSelectedSCR] = useState("");
  const [originalScreen, setOriginalScreen] = useState();

  const handleSCRDialogClose = (value) => {
    setSelectedSCR((selectedSCR) => value);
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
        {isFileDetailsDialogOpen && (
          <FileDetailsDialog
            open={isFileDetailsDialogOpen}
            onClose={handleFileDetailsDialogClose}
            item={entry}
            handleclose={handleSCRDialogClose}
          ></FileDetailsDialog>
        )}
        <ImageListItem sx={{ border: 1, borderColor: "#c0c0c0" }}>
          <img src={entry.scr} alt={entry.filename} />
          <Favorite entry={entry} sx={{ position: "absolute", top: 0, left: 0 }}></Favorite>
          <LocateFileAndFolder path={entry.filepath} sx={{ position: "absolute", top: 0, right: 0 }} />
          <ImageListItemBar
            title={
              <Tooltip title={getTitle()}>
                <Typography variant="caption" noWrap gutterBottom>
                  {getTitle()}
                </Typography>
              </Tooltip>
            }
            actionIcon={
              <Tooltip title="See file details" onClick={() => handleFileDetailsDialogOpen(this)}>
                <IconButton arial-label="see file details" size="small">
                  <InfoOutlinedIcon sx={{ color: "rgba(255, 255, 255, 0.54)" }} />
                </IconButton>
              </Tooltip>
            }
          />
        </ImageListItem>
      </React.Fragment>
    )
  );
}
