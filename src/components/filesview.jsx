import * as React from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

import { Paper, Typography } from "@mui/material";
import FolderTwoToneIcon from "@mui/icons-material/FolderTwoTone";
import { useEffect } from "react";
import { useState } from "react";

import InfiniteEntriesList from "./InfiniteEntriesList";

const NO_OF_ITEMS_PER_VIEW = 5;

function filterAndSortFiles(files, sortOptions, fileFilters) {
  const newFiles = files.filter((fileName) => {
    let result = fileFilters.some((extension) => {
      return fileName.toLowerCase().endsWith(extension);
    });

    return result;
  });

  if (sortOptions) {
    return [...newFiles.sort()];
  } else {
    return [...newFiles.sort().reverse()];
  }
}

const FilesView = (props) => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    window.electronAPI.scanFolder(props.foldername).then((res) => {
      // filter out files based filtring
      const newList = res; //filterAndSortFiles(res, this.state.sortOrderFiles, this.state.fileFilters);
      setFiles(newList);
    });
  }, [props.foldername]);

  return (
    <Paper elevation={2}>
      <Box sx={{ display: "flex" }}>
        <FolderTwoToneIcon />
        <Typography variant="button">
          {props.foldername} - ({files.length})
        </Typography>
      </Box>
      <Divider variant="middle" />
      <InfiniteEntriesList files={files}></InfiniteEntriesList>
    </Paper>
  );
}
export default FilesView;
