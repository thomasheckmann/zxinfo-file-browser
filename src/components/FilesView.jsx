import * as React from "react";
import Box from "@mui/material/Box";

import { Paper, Typography } from "@mui/material";
import FolderTwoToneIcon from "@mui/icons-material/FolderTwoTone";
import { useEffect } from "react";
import { useState } from "react";

import InfiniteEntriesList from "./InfiniteEntriesList";
import { useContext } from "react";
import ZXInfoSettings from "../common/ZXInfoSettings";
import { mylog } from "../App";

// duplicated in GridView
function filterAndSortFiles(files, sortOptions, fileFilters) {
  mylog("FilesView", "filterAndSortFiles", `sorting changed to: ${sortOptions}, filters: ${fileFilters}, no. of files: ${files.length}`);
  const newFiles = files.filter((fileName) => {
    let result = fileFilters.some((extension) => {
      const fileExt = fileName.substring(fileName.lastIndexOf(".") + 1, fileName.length).toLowerCase() || fileName.toLowerCase();
      return fileExt === extension;
    });

    return result;
  });

  if (sortOptions) {
    return [...newFiles.sort()];
  } else {
    return [...newFiles.sort().reverse()];
  }
}

function FilesView ({foldername, filesInFolder}) {
  const [appSettings] = useContext(ZXInfoSettings);
  const [files, setFiles] = useState(filesInFolder);
  const [isInitialized, setInitialized] = useState(false);

  useEffect(() => {
    mylog("FilesView", "useEffect", `sorting and filtering on folder: ${foldername}`);
    mylog("FilesView", "useEffect", `${filesInFolder}`);
    setInitialized(true);
    return;
    // window.electronAPI.scanFolder(props.foldername).then((res) => {
    //   // filter out files based filtering
    //   const newList = filterAndSortFiles(res, appSettings.sortOrderFiles, appSettings.fileFilters);
    //   setFiles((files) => [...newList]);
    //   setInitialized(true);
    //   mylog("FilesView", "useEffect", `initialized done, no. of files: ${newList.length}`);
    // });
  }, [appSettings.sortOrderFiles, appSettings.fileFilters, appSettings.hideZip]); //[props.foldername, appSettings.sortOrderFiles, appSettings.fileFilters]);

  return (
    isInitialized && (
      <Paper elevation={5} sx={{ border: 1, borderColor: "#a0a0a0", height: "vh", my: 4 }} id={foldername}>
        <Box sx={{ backgroundColor: "#e0e0e0", display: "flex", py: 3, px: 2 }}>
          <FolderTwoToneIcon />
          <Typography variant="button">
            &nbsp;{foldername} - ({files.length})
          </Typography>
        </Box>
        <InfiniteEntriesList key={files + appSettings.hideZip} files={files} foldername={foldername}></InfiniteEntriesList>
      </Paper>
    )
  );
};
export default FilesView;
