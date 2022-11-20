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

import { Alert, Avatar, Card, CardActions, CardContent, CardHeader, CardMedia, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { red } from "@mui/material/colors";
import axios from "axios";
import InsertLinkOutlinedIcon from "@mui/icons-material/InsertLinkOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";

import DownloadingTwoToneIcon from "@mui/icons-material/DownloadingTwoTone";

import ZXInfoSCRDialog from "./ZXInfoSCRDialog";
import ZXInfoSettings from "../common/ZXInfoSettings";

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
  const [appSettings] = useContext(ZXInfoSettings);
  const [entry, setEntry] = useState();
  const [restCalled, setRestCalled] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSCRDialogOpen, setSCRDialogOpen] = useState(false);
  const [selectedSCR, setSelectedSCR] = useState("");

  const handleSCRDialogClose = (value) => {
    setSCRDialogOpen(false);
    setSelectedSCR(value);
  };

  const handleSCRDialogOpen = () => {
    setSCRDialogOpen(true);
  };

  // Map (sha512 -> [array of filenames])
  const toggleFavorite = async (event) => {
    if (appSettings.favorites.size === 0) {
      // first time...
      appSettings.favorites = new Map();
      appSettings.favorites.set(entry.sha512, [entry.filepath]);
      setIsFavorite(true);
    } else {
      if (appSettings.favorites.get(entry.sha512)) {
        // delete filepath, if array = [] - delete from map
        appSettings.favorites.delete(entry.sha512);
        setIsFavorite(false);
      } else {
        var filesList = appSettings.favorites.get(entry.sha512);
        if (!filesList) {
          // new fileList
          appSettings.favorites.set(entry.sha512, [entry.filepath]);
        } else {
          // add filename to list
          appSettings.favorites.set(entry.sha512, [...filesList, entry.filepath]);
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
          item.zxdbID = response.data.entry_id;
          item.zxdbTitle = response.data.title;
          const zxdbSCR = appSettings.zxinfoSCR.get(props.entry.sha512);
          if (zxdbSCR) {
            item.scr = zxdbSCR;
          }
          setEntry(item);
          setIsFavorite(appSettings.favorites.get(item.sha512));
        })
        .catch((error) => {
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
  }, [props.entry, restCalled, isFavorite, appSettings.favorites, appSettings.zxinfoSCR]);

  useEffect(() => {
    if (selectedSCR === null) {
      // delete and set default
      if (appSettings.zxinfoSCR.size > 0) {
        appSettings.zxinfoSCR.delete(props.entry.sha512);
      }
      setEntry((entry) => ({ ...entry, scr: props.entry.scr }));
      var obj = Object.fromEntries(appSettings.zxinfoSCR);
      var jsonString = JSON.stringify(obj);
      window.electronAPI.setZxinfoSCR("zxinfoSCR", jsonString);
      return;
    }

    if (!selectedSCR) return;

    if (appSettings.zxinfoSCR.size === 0) {
      appSettings.zxinfoSCR = new Map();
      appSettings.zxinfoSCR.set(entry.sha512, selectedSCR);
    } else {
      appSettings.zxinfoSCR.set(entry.sha512, selectedSCR);
    }
    setEntry({ ...entry, scr: selectedSCR });
    var obj1 = Object.fromEntries(appSettings.zxinfoSCR);
    var jsonString1 = JSON.stringify(obj1);
    window.electronAPI.setZxinfoSCR("zxinfoSCR", jsonString1);
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
        <Card raised elevation={5}>
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
          {entry.error ? <Alert severity="warning">{entry.error}</Alert> : ""}
          <CardMedia component="img" image={entry.scr} alt={entry.filename} />
          <CardContent>
            <Typography gutterBottom variant="subtitle1" component="div" noWrap>
              {entry.zxdbTitle ? entry.zxdbTitle : entry.filename}
            </Typography>
            <Typography gutterBottom variant="subtitle2" component="div" noWrap>
              {entry.text}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {entry.version && <Chip label={entry.version} />}
              {entry.hwmodel && <Chip label={entry.hwmodel} />}
              {entry.zxdbID && (
                <Chip
                  label={entry.zxdbID}
                  variant="outlined"
                  sx={{ color: appSettings.zxinfoSCR.get(props.entry.sha512) ? "#12a802" : "#000000" }}
                  onClick={(id) => openLink(entry.zxdbID)}
                />
              )}
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
                  <FavoriteBorderOutlinedIcon />
                </IconButton>
              </Tooltip>
            )}
            {/* and not already downloaded */}
            {entry.zxdbID && (
              <Tooltip title="Get SCR fron ZXInfo" onClick={() => handleSCRDialogOpen(this)}>
                <IconButton arial-label="get scr from zxinfo">
                  <DownloadingTwoToneIcon />
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
