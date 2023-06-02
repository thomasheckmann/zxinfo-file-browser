/**
 * FavoritesList - view to show all your favorites.
 * 
 * Favorites are saved to file: favorites.json in the following format:
 * 
 * {
 *    favorites: {
 *      "sha512_1": [filepath1, filepath2, ...],
 *      "sha512_2": [filepath3, ...],
        ...
*    }
 * }
 */


import React, { useContext, useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import InfiniteEntriesList from "../components/InfiniteEntriesList";
import {ZXInfoSettingsCtx} from "../common/ZXInfoSettings";
import FavoriteTwoToneIcon from "@mui/icons-material/FavoriteTwoTone";
import { Container } from "@mui/system";

const NO_OF_ITEMS = 9; // number of files to fetch/display - should adapt to breakpoint?

function FavoritesList(props) {
  const [appSettings] = useContext(ZXInfoSettingsCtx);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    var favorites = appSettings.favorites;

    var items = [];
    for (let value of favorites.values()) {
      items.push(...value);
    }
    // remove duplicates
    setFiles([...new Set(items)]);
  }, [appSettings.favorites]);

  return (
    <Paper elevation={5} sx={{ border: 1, borderColor: "#a0a0a0", height: "vh", my: 4 }}>
      <Box sx={{ backgroundColor: "#e0e0e0", display: "flex", py: 3, px: 2 }}>
        <FavoriteTwoToneIcon />
        <Typography variant="button">
        &nbsp;My favorites
        </Typography>
      </Box>
      {files.length > 0 ? (
        <InfiniteEntriesList files={files} foldername={"Favorites"} maxsize={NO_OF_ITEMS}></InfiniteEntriesList>
      ) : (
        <Container>
          <Box textAlign="center" sx={{ p: 4 }}>
            <Typography variant="h6">No favorites yet</Typography>
          </Box>
        </Container>
      )}
    </Paper>
  );
}

export default FavoritesList;
