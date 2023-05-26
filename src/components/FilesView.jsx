import * as React from "react";
import Box from "@mui/material/Box";

import { Paper, Typography } from "@mui/material";
import FolderTwoToneIcon from "@mui/icons-material/FolderTwoTone";
import { useState } from "react";

import InfiniteEntriesList from "./InfiniteEntriesList";

function FilesView({ foldername, filesInFolder }) {
  const [files] = useState(filesInFolder);

  return (
    <Paper elevation={5} sx={{ border: 1, borderColor: "#a0a0a0", height: "vh", my: 4 }} id={foldername}>
      <Box sx={{ backgroundColor: "#e0e0e0", display: "flex", py: 3, px: 2 }}>
        <FolderTwoToneIcon />
        <Typography variant="button">
          &nbsp;{foldername} - ({files.length})
        </Typography>
      </Box>
      <InfiniteEntriesList key={filesInFolder} files={files} foldername={foldername}></InfiniteEntriesList>
    </Paper>
  );
}
export default FilesView;
