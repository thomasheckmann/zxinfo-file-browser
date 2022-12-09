import { IconButton, ImageListItem, ImageListItemBar, Tooltip, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import FileDetailsDialog from "../components/FileDetails";
import axios from "axios";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import ZXInfoSettings from "../common/ZXInfoSettings";
import Favorite from "../common/Favorite";

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

  function getTitle() {
    var title = entry.subfilename ? entry.subfilename + " in (" + entry.filename + ")" : entry.filename;
    if (entry.zxdbTitle) {
      title = `${entry.zxdbTitle} [${title}]`;
    }
    return title;
  }

  useEffect(() => {
    if (!restCalled) {
      const dataURL = `https://api.zxinfo.dk/v3/filecheck/${props.entry.sha512}`;
      axios
        .get(dataURL)
        .then((response) => {
          let item = props.entry;

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
        {isFileDetailsDialogOpen && <FileDetailsDialog open={isFileDetailsDialogOpen} onClose={handleFileDetailsDialogClose} item={entry}></FileDetailsDialog>}
        <ImageListItem sx={{ border: 1, borderColor: "#c0c0c0" }}>
          <img src={entry.scr} alt={entry.filename} />
          <Favorite entry={entry} sx={{ position: "absolute", top: 0, left: 0 }}></Favorite>
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
                <IconButton arial-label="see file details">
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
