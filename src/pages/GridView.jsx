import { Box, Paper, Typography } from "@mui/material";
import * as React from "react";
import InfiniteEntriesGrid from "../components/InfiniteEntriesGrid";
import FolderTwoToneIcon from "@mui/icons-material/FolderTwoTone";
import { useContext, useEffect, useState } from "react";
import { ZXInfoSettingsCtx } from "../common/ZXInfoSettings";
import { mylog } from "../App";

/**
 *
 * @param {*} filenames - [file1, file2, file3]
 * @param {*} sortAtoZ  - true or false
 * @returns sorted array
 */
function sortFiles(filenames, sortAtoZ) {
  return sortAtoZ ? filenames.sort() : filenames.sort().reverse();
}

function GridView({ root, folders }) {
  const [appSettings] = useContext(ZXInfoSettingsCtx);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    mylog("GridView", "useEffect", `-enter-`);
    if (folders) {
      folders.forEach((folder, index) => {
        setFiles((files) => sortFiles([...files, ...folder.files], appSettings.sortOrderFiles));
      });
    }
  }, [folders, appSettings.sortOrderFiles]);

  return (
    <React.Fragment>
      <Paper elevation={5} sx={{ border: 1, borderColor: "#a0a0a0", my: 4 }} id={root}>
        <Box sx={{ backgroundColor: "#e0e0e0", display: "flex", py: 3, px: 2 }}>
          <FolderTwoToneIcon />
          <Typography variant="button">
            &nbsp;{root} - ({files.length})
          </Typography>
        </Box>
        <InfiniteEntriesGrid key={files} files={files} foldername={root}></InfiniteEntriesGrid>
      </Paper>
    </React.Fragment>
  );
}
export default GridView;
