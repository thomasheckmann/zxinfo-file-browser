/**
 *
 * entry = {
 *      filename:
 *      subfilename: <only used if entry is within ZIP file>
 *      version: "SNA"
 *      type: "snafmt"
 *      sha512: <used to perform lookup in ZXInfo API
 *      src: <base64hex image>
 *      error: <error text>
 * }
 *
 *
 */

import React, { useContext, useEffect, useState } from "react";

import { Avatar, Card, CardActionArea, CardActions, CardContent, CardHeader, CardMedia, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { red } from "@mui/material/colors";
import axios from "axios";

import DownloadForOfflineTwoToneIcon from "@mui/icons-material/DownloadForOfflineTwoTone";
import WarningTwoToneIcon from "@mui/icons-material/WarningTwoTone";
import GamepadOutlinedIcon from "@mui/icons-material/GamepadOutlined";

import ZXInfoSCRDialog from "./ZXInfoSCRDialog";
import ZXInfoSettings from "../common/ZXInfoSettings";
import Favorite from "../common/cardactions/Favorite";
import ZXdbID from "../common/cardactions/ZXdbID";
import LocateFileAndFolder from "../common/cardactions/LocateFileAndFolder";

import FileErrorDialog from "./FileErrorDialog";
import FileDetailsDialog from "./FileDetails";

import JSSpeccyDialog from "./JSSpeccyDialog";

import { mylog } from "../App";

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

const openLink = (id) => {
  window.electronAPI.openZXINFODetail(id).then((res) => {});
};

function EntryCard(props) {
  const [appSettings, setAppSettings] = useContext(ZXInfoSettings);
  const [entry, setEntry] = useState();
  const [restCalled, setRestCalled] = useState(false);

  // Fetch SCR from ZXInfo API
  const [isSCRDialogOpen, setSCRDialogOpen] = useState(false);
  const [selectedSCR, setSelectedSCR] = useState("");
  const [originalScreen, setOriginalScreen] = useState();

  const handleSCRDialogClose = (value) => {
    setSelectedSCR((selectedSCR) => value);
    setSCRDialogOpen(false);
  };

  const handleSCRDialogOpen = () => {
    setSCRDialogOpen(true);
  };

  // File Error box
  const [isFileErrorDialogOpen, setFileErrorDialogOpen] = useState(false);

  const handleFileErrorDialogClose = (value) => {
    setFileErrorDialogOpen(false);
  };
  const handleFileErrorDialogOpen = () => {
    setFileErrorDialogOpen(true);
  };

  // File Details dialog
  const [isFileDetailsDialogOpen, setFileDetailsDialogOpen] = useState(false);

  const handleFileDetailsDialogClose = (value) => {
    setFileDetailsDialogOpen(false);
  };

  const handleFileDetailsDialogOpen = () => {
    setFileDetailsDialogOpen(true);
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

  useEffect(() => {
    if (!restCalled) {
      // make sure we only call the API once

      mylog("EntryCard", "useEffect", `OPEN, get API data for: ${props.entry.sha512}`);
      const dataURL = `https://api.zxinfo.dk/v3/filecheck/${props.entry.sha512}`;
      mylog("EntryCard", "useEffect", `calling API ${dataURL}`);
      axios
        .get(dataURL)
        .then((response) => {
          let item = props.entry;
          item.orgScr = props.entry.scr;

          // save original SCR detected from file
          setOriginalScreen(props.entry.scr);
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
  }, []); // only run once

  // handle user selected SCR
  useEffect(() => {
    var useScreen = null;

    if (selectedSCR === undefined) {
      mylog("EntryCard", "useEffect", `handling selectSCR, undefined... ?`);
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

  return (
    entry && (
      <React.Fragment>
        {isSCRDialogOpen && (
          <ZXInfoSCRDialog
            open={isSCRDialogOpen}
            zxdb={{ zxdbID: entry.zxdbID, title: entry.zxdbTitle }}
            selectedValue={selectedSCR}
            onClose={handleSCRDialogClose}
          ></ZXInfoSCRDialog>
        )}
        {isFileErrorDialogOpen && <FileErrorDialog open={isFileErrorDialogOpen} errors={entry.error} onClose={handleFileErrorDialogClose}></FileErrorDialog>}
        {isFileDetailsDialogOpen && <FileDetailsDialog open={isFileDetailsDialogOpen} onClose={handleFileDetailsDialogClose} item={entry}></FileDetailsDialog>}
        {isJSSpeccyDialogOpen && <JSSpeccyDialog open={isJSSpeccyDialogOpen} onClose={handleJSSpeccyDialogClose} item={entry}></JSSpeccyDialog>}
        <Card raised elevation={4}>
          <CardHeader
            sx={{
              backgroundColor: entry.zxdbID ? "#02b554" : "#808080",
              // backgroundColor: entry.type === "zip" ? "#606060" : "#808080",
              display: "flex",
              overflow: "hidden",
              "& .MuiCardHeader-content": {
                overflow: "hidden",
              },
            }}
            avatar={
              <Avatar sx={{ bgcolor: entry.zxdbID ? "#606060" : red[500] }} aria-label="file format">
                <Typography variant="caption" display="block" gutterBottom>
                  {formatType(entry.type)}
                </Typography>
              </Avatar>
            }
            action={<LocateFileAndFolder path={entry.filepath}></LocateFileAndFolder>}
            title={
              <Tooltip title={entry.filename}>
                <Typography variant="caption" noWrap gutterBottom>
                  {entry.filename}
                </Typography>
              </Tooltip>
            }
            titleTypographyProps={{ noWrap: true }}
            subheaderTypographyProps={{ noWrap: true }}
            subheader={
              <Tooltip title={entry.subfilename}>
                <Typography variant="caption" noWrap gutterBottom>
                  {entry.subfilename}
                </Typography>
              </Tooltip>
            }
          />
          <CardActionArea onClick={() => handleFileDetailsDialogOpen(this)}>
            <Tooltip title="See file details">
              <CardMedia component="img" image={entry.scr} alt={entry.filename} />
            </Tooltip>
          </CardActionArea>
          <CardContent>
            <Typography gutterBottom variant="subtitle2" component="div" noWrap>
              {entry.zxdbTitle ? entry.zxdbTitle : entry.filename}
            </Typography>
            <Typography gutterBottom variant="body2" component="div" noWrap>
              {entry.text}&nbsp;
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {entry.version && <Chip label={entry.version} size="small" />}
              {entry.hwmodel && <Chip label={entry.hwmodel} size="small" />}
              {entry.protection && <Chip label={entry.protection} size="small" />}
              {entry.zxdbID ? (
                <Tooltip title="More details at ZXInfo.dk">
                  <Chip
                    label={entry.zxdbID}
                    size="small"
                    variant="outlined"
                    sx={{ color: appSettings.zxinfoSCR.get(props.entry.sha512) ? "#12a802" : "#000000" }}
                    onClick={(id) => openLink(entry.zxdbID)}
                  />
                </Tooltip>
              ) : (
                <ZXdbID entry={entry}></ZXdbID>
              )}
              <Chip sx={{ bgcolor: "#ffffff" }} />
            </Stack>
          </CardContent>
          <CardActions disableSpacing>
            <Favorite entry={entry}></Favorite>
            {/* and not already downloaded */}
            {entry.zxdbID && (
              <Tooltip title="Get SCR fron ZXInfo" onClick={() => handleSCRDialogOpen(this)}>
                <IconButton arial-label="get scr from zxinfo">
                  <DownloadForOfflineTwoToneIcon />
                </IconButton>
              </Tooltip>
            )}
            {entry.error && entry.error.length > 0 && (
              <Tooltip title="See file issues" onClick={() => handleFileErrorDialogOpen(this)}>
                <IconButton arial-label="see file issues">
                  <WarningTwoToneIcon sx={{ color: "#ff0000" }} />
                </IconButton>
              </Tooltip>
            )}

            {validJSSpeccyFormat() && (
              <Tooltip title="Play in emulator" onClick={() => handleJSSpeccyDialogOpen(this)} sx={{ marginLeft: "auto" }}>
                <IconButton arial-label="Play in emulator">
                  <GamepadOutlinedIcon sx={{ color: "#000000" }} />
                </IconButton>
              </Tooltip>
            )}
          </CardActions>
        </Card>
      </React.Fragment>
    )
  );
}

export default EntryCard;
