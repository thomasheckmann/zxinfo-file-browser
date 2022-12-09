import { IconButton, Tooltip } from "@mui/material";
import { useContext, useEffect, useState } from "react";

import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import FavoriteTwoToneIcon from "@mui/icons-material/FavoriteTwoTone";

import ZXInfoSettings from "../ZXInfoSettings";
import { mylog } from "../../App";

export default function Favorite(props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [appSettings, setAppSettings] = useContext(ZXInfoSettings);

  // Map (sha512 -> [array of filenames])
  const toggleFavorite = async (event) => {
    if (appSettings.favorites.size === 0) {
      // first time...
      const newFav = new Map();
      newFav.set(props.entry.sha512, [props.entry.filepath]);
      setAppSettings({ ...appSettings, favorites: newFav });
      setIsFavorite(true);
      var obj = Object.fromEntries(newFav);
      var jsonString = JSON.stringify(obj);
      window.electronAPI.setFavorites("favorites", jsonString);
    } else {
      if (appSettings.favorites.get(props.entry.sha512)) {
        // delete filepath, if array = [] - delete from map
        const newFav = appSettings.favorites;
        newFav.delete(props.entry.sha512);
        setAppSettings({ ...appSettings, favorites: newFav });
        setIsFavorite(false);
      } else {
        var filesList = appSettings.favorites.get(props.entry.sha512);
        if (!filesList) {
          // new fileList
          const newFav = appSettings.favorites;
          newFav.set(props.entry.sha512, [props.entry.filepath]);
          setAppSettings({ ...appSettings, favorites: newFav });
        } else {
          // add filename to list
          const newFav = appSettings.favorites;
          newFav.set(props.entry.sha512, [...filesList, props.entry.filepath]);
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
    mylog("Favorite", "useEffect", `init: ${props.entry.sha512}`);
    setIsFavorite(appSettings.favorites.get(props.entry.sha512));
  }, [props.entry.sha512]);

  return isFavorite ? (
    <Tooltip title="Remove from favorites">
      <IconButton aria-label="remove from favorites" onClick={() => toggleFavorite(this)} sx={{ ...props.sx, color: "rgba(255, 0, 0, 0.54)" }}>
        <FavoriteOutlinedIcon />
      </IconButton>
    </Tooltip>
  ) : (
    <Tooltip title="Add to favorites">
      <IconButton aria-label="add to favorites" onClick={() => toggleFavorite(this)} sx={{ ...props.sx, color: "rgba(255, 255, 255, 0.54)" }}>
        <FavoriteTwoToneIcon color="primary" />
      </IconButton>
    </Tooltip>
  );
}
