import { Box, Paper, Typography } from "@mui/material";
import * as React from "react";
import InfiniteEntriesGrid from "../components/InfiniteEntriesGrid";
import FolderTwoToneIcon from "@mui/icons-material/FolderTwoTone";
import { useState } from "react";
import { useEffect } from "react";
import { isDev } from "../App";

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

export default function GridView(props) {
  const [files, setFiles] = useState([]);
  const [allDone, setAllDone] = useState(false);

  const scanFolder = async () => {
    var filesToAdd=[];
    
    for (var i = 0; i < props.folders.length; i++) {
      const folder = props.folders[i];
      if (isDev) {
        console.log(`useEffect(): scanning folder: ${folder}`);
      }
      const res = await window.electronAPI.scanFolder(folder);
      if (res) {
        if (isDev) {
          console.log(`useEffect(): ${folder} - ${res.length}`);
        }
        filesToAdd = [...filesToAdd, ...res];
      }
    }
    setFiles((files) => filesToAdd.sort());
    setAllDone(true);
  };

  useEffect(() => {
    if (isDev) console.log(`useEffect():  fetching folders....`);

    scanFolder();
  }, [props.folders]);

  return (
    <React.Fragment>
      {allDone && (
        <Paper elevation={5} sx={{ border: 1, borderColor: "#a0a0a0", my: 4 }} id={props.root}>
          <Box sx={{ backgroundColor: "#e0e0e0", display: "flex", py: 3, px: 2 }}>
            <FolderTwoToneIcon />
            <Typography variant="button">&nbsp;{props.root} - ({files.length})</Typography>
          </Box>
          <InfiniteEntriesGrid files={files} foldername={props.root}></InfiniteEntriesGrid>
        </Paper>
      )}
    </React.Fragment>
  );
}
