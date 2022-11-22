import * as React from "react";
import Box from "@mui/material/Box";

import { Paper, Typography } from "@mui/material";
import FolderTwoToneIcon from "@mui/icons-material/FolderTwoTone";
import { useEffect } from "react";
import { useState } from "react";

import InfiniteEntriesList from "./InfiniteEntriesList";
import { useContext } from "react";
import ZXInfoSettings from "../common/ZXInfoSettings";
import { isDev } from "../App";

const NO_OF_ITEMS = 9; // number of files to fetch/display - should adapt to breakpoint?

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
  const [appSettings] = useContext(ZXInfoSettings);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (isDev) console.log(`useEffect():  `);
    window.electronAPI.scanFolder(props.foldername).then((res) => {
      // filter out files based filtring
      const newList = filterAndSortFiles(res, appSettings.sortOrderFiles, appSettings.fileFilters);
      setFiles(newList);
    });
  }, [appSettings.sortOrderFiles, appSettings.fileFilters, props.foldername]); //[props.foldername, appSettings.sortOrderFiles, appSettings.fileFilters]);

  return (
    <Paper elevation={5} sx={{ height: "vh", my: 4 }} id={props.foldername}>
      <Box sx={{ backgroundColor: "#e0e0e0", display: "flex", py: 3, px: 2 }}>
        <FolderTwoToneIcon />
        <Typography variant="button">
          {props.foldername} - ({files.length})
        </Typography>
      </Box>
      <InfiniteEntriesList files={files} foldername={props.foldername} maxsize={NO_OF_ITEMS}></InfiniteEntriesList>
    </Paper>
  );
};
export default FilesView;
