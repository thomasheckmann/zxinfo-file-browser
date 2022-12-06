import { IconButton, ImageListItem, ImageListItemBar, Tooltip, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import FileDetailsDialog from "../components/FileDetails";
import ZXInfoSettings from "../common/ZXInfoSettings";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import FavoriteTwoToneIcon from "@mui/icons-material/FavoriteTwoTone";

import axios from "axios";

export default function GridItem(props) {
  const [appSettings, setAppSettings] = useContext(ZXInfoSettings);
  const [entry, setEntry] = useState();
  const [restCalled, setRestCalled] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

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

  // Map (sha512 -> [array of filenames])
  const toggleFavorite = async (event) => {
    if (appSettings.favorites.size === 0) {
      // first time...
      const newFav = new Map();
      newFav.set(entry.sha512, [entry.filepath]);
      setAppSettings({ ...appSettings, favorites: newFav });
      setIsFavorite(true);
      var obj = Object.fromEntries(newFav);
      var jsonString = JSON.stringify(obj);
      window.electronAPI.setFavorites("favorites", jsonString);
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
      var obj = Object.fromEntries(appSettings.favorites);
      var jsonString = JSON.stringify(obj);
      window.electronAPI.setFavorites("favorites", jsonString);
    }
  };

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
          setIsFavorite(appSettings.favorites.get(item.sha512));
        })
        .catch((error) => {
          // Not found, or other API call errors
          const zxdbSCR = appSettings.zxinfoSCR.get(props.entry.sha512);
          if (zxdbSCR) {
            setEntry({ ...props.entry, scr: zxdbSCR });
          } else {
            setEntry(props.entry);
          }
          setIsFavorite(appSettings.favorites.get(props.entry.sha512));
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
          {isFavorite ? (
            <Tooltip title="Remove from favorites">
              <IconButton
                aria-label="remove from favorites"
                onClick={() => toggleFavorite(this)}
                sx={{ position: "absolute", top: 0, left: 0, color: "rgba(255, 0, 0, 0.54)" }}
              >
                <FavoriteOutlinedIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Add to favorites">
              <IconButton
                aria-label="add to favorites"
                onClick={() => toggleFavorite(this)}
                sx={{ position: "absolute", top: 0, left: 0, color: "rgba(255, 255, 255, 0.54)" }}
              >
                <FavoriteTwoToneIcon />
              </IconButton>
            </Tooltip>
          )}
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
