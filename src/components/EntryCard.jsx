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

import { Avatar, Card, CardActions, CardContent, CardHeader, CardMedia, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { red } from "@mui/material/colors";
import axios from "axios";
import InsertLinkOutlinedIcon from "@mui/icons-material/InsertLinkOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import FavoriteTwoToneIcon from "@mui/icons-material/FavoriteTwoTone";

import DownloadForOfflineTwoToneIcon from "@mui/icons-material/DownloadForOfflineTwoTone";
import WarningTwoToneIcon from "@mui/icons-material/WarningTwoTone";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import ZXInfoSCRDialog from "./ZXInfoSCRDialog";
import ZXInfoSettings from "../common/ZXInfoSettings";

import FileErrorDialog from "./FileErrorDialog";
import FileDetailsDialog from "./FileDetails";

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

const openFolderFile = (name) => {
  window.electronAPI.locateFileAndFolder(name).then((res) => {});
};

function EntryCard(props) {
  const [appSettings, setAppSettings] = useContext(ZXInfoSettings);
  const [entry, setEntry] = useState();
  const [restCalled, setRestCalled] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

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

  // Map (sha512 -> [array of filenames])
  const toggleFavorite = async (event) => {
    if (appSettings.favorites.size === 0) {
      // first time...
      const newFav = new Map();
      newFav.set(entry.sha512, [entry.filepath]);
      setAppSettings({ ...appSettings, favorites: newFav });
      setIsFavorite(true);
    } else {
      if (appSettings.favorites.get(entry.sha512)) {
        // delete filepath, if array = [] - delete from map
        const newFav = appSettings.favorites;
        newFav.delete(entry.sha512);
        setAppSettings({ ...appSettings, favorites: newFav });
        setIsFavorite(false);
      } else {
        var filesList = appSettings.favorites.get(entry.sha512);
        if (!filesList) {
          // new fileList
          const newFav = appSettings.favorites;
          newFav.set(entry.sha512, [entry.filepath]);
          setAppSettings({ ...appSettings, favorites: newFav });
        } else {
          // add filename to list
          const newFav = appSettings.favorites;
          newFav.set(entry.sha512, [...filesList, entry.filepath]);
          setAppSettings({ ...appSettings, favorites: newFav });
        }
        setIsFavorite(true);
      }
    }
    var obj = Object.fromEntries(appSettings.favorites);
    var jsonString = JSON.stringify(obj);
    window.electronAPI.setFavorites("favorites", jsonString);
  };

  useEffect(() => {
    if (!restCalled) {
      setRestCalled(true);
    
      const dataURL = `https://api.zxinfo.dk/v3/filecheck/${props.entry.sha512}`;
      axios
        .get(dataURL)
        .then((response) => {
          let item = props.entry;
          setOriginalScreen(props.entry.scr);
          item.zxdbID = response.data.entry_id;
          item.zxdbTitle = response.data.title;

          // look up SCR if user selected
          const zxdbSCR = appSettings.zxinfoSCR.get(props.entry.sha512);
          if (zxdbSCR) {
            item.scr = zxdbSCR;
          }
          setEntry((entry) => item);
          setIsFavorite(appSettings.favorites.get(item.sha512));
        })
        .catch((error) => {
          // Not found
          const zxdbSCR = appSettings.zxinfoSCR.get(props.entry.sha512);
          if (zxdbSCR) {
            setEntry({ ...props.entry, scr: zxdbSCR });
          } else {
            setEntry(props.entry);
          }
          setIsFavorite(appSettings.favorites.get(props.entry.sha512));
        })
        .finally(() => {});
    }
  }, [restCalled, isFavorite, appSettings.favorites, appSettings.zxinfoSCR]);

  // handle user selected SCR
  useEffect(() => {
    var useScreen = null;

    if (selectedSCR === undefined) {
    } else if (selectedSCR === null) {
      // delete and set default
      if (appSettings.zxinfoSCR.size > 0) {
        appSettings.zxinfoSCR.delete(props.entry.sha512);
      }
      useScreen = originalScreen;
    } else if (appSettings.zxinfoSCR.size === 0) {
      appSettings.zxinfoSCR = new Map();
      appSettings.zxinfoSCR.set(entry.sha512, selectedSCR);
      useScreen = selectedSCR;
    } else if (appSettings.zxinfoSCR.size > 0 && entry) {
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
        <ZXInfoSCRDialog
          open={isSCRDialogOpen}
          zxdb={{ zxdbID: entry.zxdbID, title: entry.zxdbTitle }}
          selectedValue={selectedSCR}
          onClose={handleSCRDialogClose}
        ></ZXInfoSCRDialog>
        {isFileErrorDialogOpen && <FileErrorDialog open={isFileErrorDialogOpen} errors={entry.error} onClose={handleFileErrorDialogClose}></FileErrorDialog>}
        {isFileDetailsDialogOpen && <FileDetailsDialog open={isFileDetailsDialogOpen} onClose={handleFileDetailsDialogClose} item={entry}></FileDetailsDialog>}
        <Card raised elevation={4}>
          <CardHeader
            sx={{
              backgroundColor: entry.type === "zip" ? "#606060" : "#808080",
              display: "flex",
              overflow: "hidden",
              "& .MuiCardHeader-content": {
                overflow: "hidden",
              },
            }}
            avatar={
              <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
                <Typography variant="overline" display="block" gutterBottom>
                  {formatType(entry.type)}
                </Typography>
              </Avatar>
            }
            action={
              <Tooltip title="Locate file">
                <IconButton aria-label="Locate file" onClick={(name) => openFolderFile(entry.filepath)}>
                  <InsertLinkOutlinedIcon />
                </IconButton>
              </Tooltip>
            }
            title={
              <Tooltip title={entry.filename}>
                <Typography variant="subtitle" noWrap gutterBottom>
                  {entry.filename}
                </Typography>
              </Tooltip>
            }
            titleTypographyProps={{ noWrap: true }}
            subheaderTypographyProps={{ noWrap: true }}
            subheader={entry.subfilename}
          />
          <CardMedia component="img" image={entry.scr} alt={entry.filename} />
          <CardContent>
            <Typography gutterBottom variant="subtitle1" component="div" noWrap>
              {entry.zxdbTitle ? entry.zxdbTitle : entry.filename}
            </Typography>
            <Typography gutterBottom variant="subtitle2" component="div" noWrap>
              {entry.text}&nbsp;
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {entry.version && <Chip label={entry.version} />}
              {entry.hwmodel && <Chip label={entry.hwmodel} />}
              {entry.protection && <Chip label={entry.protection} />}
              {entry.zxdbID && (
                <Tooltip title="More details at ZXInfo.dk">
                <Chip
                  label={entry.zxdbID}
                  variant="outlined"
                  sx={{ color: appSettings.zxinfoSCR.get(props.entry.sha512) ? "#12a802" : "#000000" }}
                  onClick={(id) => openLink(entry.zxdbID)}
                /></Tooltip>
              )}
              <Chip sx={{ bgcolor: "#ffffff" }} />
            </Stack>
          </CardContent>
          <CardActions disableSpacing>
            {isFavorite ? (
              <Tooltip title="Remove from favorites">
                <IconButton aria-label="remove from favorites" onClick={() => toggleFavorite(this)}>
                  <FavoriteOutlinedIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Add to favorites">
                <IconButton aria-label="add to favorites" onClick={() => toggleFavorite(this)}>
                  <FavoriteTwoToneIcon />
                </IconButton>
              </Tooltip>
            )}
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
            {true && (
              <Tooltip title="See file details" onClick={() => handleFileDetailsDialogOpen(this)} sx={{ marginLeft: "auto" }}>
                <IconButton arial-label="see file details">
                  <InfoOutlinedIcon sx={{ color: "#000000" }} />
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
