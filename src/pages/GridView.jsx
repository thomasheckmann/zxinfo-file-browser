import { Box, Paper, Typography } from "@mui/material";
import * as React from "react";
import InfiniteEntriesGrid from "../components/InfiniteEntriesGrid";
import FolderTwoToneIcon from "@mui/icons-material/FolderTwoTone";
import { useContext, useEffect, useState } from "react";
import ZXInfoSettings from "../common/ZXInfoSettings";
import {mylog} from "../App";

// duplicated in FilesView
// sort on filename, but add path
function basename(prevname) {
  return prevname.replace(/^(.*[/\\])?/, '');
}

function filterAndSortFiles(files, sortOptions, fileFilters) {
  mylog("GridView", "filterAndSortFiles", `sorting changed to: ${sortOptions}, filters: ${fileFilters}, no. of files: ${files.length}`);
  const newFiles = files.filter((fileName) => {
    mylog("GridView", "filterAndSortFiles", `${basename(fileName)}, ${fileName}`);
    let result = fileFilters.some((extension) => {
      const fileExt =  fileName.substring(fileName.lastIndexOf('.')+1, fileName.length).toLowerCase() || fileName.toLowerCase();
      return fileExt === extension;
    });

    return result;
  });

  if (sortOptions) {
    return [...newFiles.sort((a, b) => {
      return basename(a).toLowerCase().localeCompare(basename(b).toLowerCase());
    })];
  } else {
    return [...newFiles.sort((a, b) => {
      return basename(a).toLowerCase().localeCompare(basename(b).toLowerCase());
    }).reverse()];
  }
}

export default function GridView(props) {
  const [appSettings] = useContext(ZXInfoSettings);
  const [files, setFiles] = useState([]);
  const [allDone, setAllDone] = useState(false);

  const scanFolder = async () => {
    var filesToAdd=[];
    
    for (var i = 0; i < props.folders.length; i++) {
      const folder = props.folders[i];
      mylog("GridView", "scanFolder", `scanning folder: ${folder}`);
      const res = await window.electronAPI.scanFolder(folder);
      if (res) {
        mylog("GridView", "scanFolder", `${folder} contains: ${res.length} file(s)`);
        filesToAdd = [...filesToAdd, ...res];
      }
    }
    setFiles((files) => filterAndSortFiles(filesToAdd, appSettings.sortOrderFiles, appSettings.fileFilters));
    setAllDone(true);
  };

  useEffect(() => {
    mylog("GridView", "useEffect", `fetching folders....`);
    scanFolder();
  }, [props.folders, appSettings.sortOrderFiles, appSettings.fileFilters]);

  return (
    <React.Fragment>
      {allDone && (
        <Paper elevation={5} sx={{ border: 1, borderColor: "#a0a0a0", my: 4 }} id={props.root}>
          <Box sx={{ backgroundColor: "#e0e0e0", display: "flex", py: 3, px: 2 }}>
            <FolderTwoToneIcon />
            <Typography variant="button">&nbsp;{props.root} - ({files.length})</Typography>
          </Box>
          <InfiniteEntriesGrid key={files+appSettings.hideZip} files={files} foldername={props.root}></InfiniteEntriesGrid>
        </Paper>
      )}
    </React.Fragment>
  );
}
