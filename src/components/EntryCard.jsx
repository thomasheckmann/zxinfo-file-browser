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

import { zxdbFileCheck, formatType, validJSSpeccyFormat, handleUserSelectedSCR } from "../common/filecheck.js";
import JSSpeccyDialog from "./JSSpeccyDialog";

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

  // handle user selected SCR
  useEffect(() => {
    handleUserSelectedSCR(entry, setEntry, appSettings, selectedSCR, originalScreen);
  }, [selectedSCR]);

  useEffect(() => {
    // make sure we only call the API once
    if (!restCalled) {
      zxdbFileCheck(props.entry, appSettings.zxinfoSCR, setEntry, setOriginalScreen, setRestCalled);
    }
  }, [props.entry]);

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

            {validJSSpeccyFormat(entry) && (
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
