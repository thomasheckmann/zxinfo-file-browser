import React, { useContext, useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import InfiniteEntriesList from "../components/InfiniteEntriesList";
import ZXInfoSettings from "../common/ZXInfoSettings";
import FavoriteTwoToneIcon from "@mui/icons-material/FavoriteTwoTone";
import { Container } from "@mui/system";

const NO_OF_ITEMS = 9; // number of files to fetch/display - should adapt to breakpoint?

function FavoritesList(props) {
  const [appSettings] = useContext(ZXInfoSettings);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    var favorites = appSettings.favorites;

    var items = [];
    for (let [key, value] of favorites) {
      items.push(...value);
    }
    let uniqueFileNames = [...new Set(items)];

    // remove duplicates
    setFiles(uniqueFileNames);
  }, [appSettings.favorites.size]);

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
