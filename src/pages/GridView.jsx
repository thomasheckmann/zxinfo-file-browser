import { Box, Paper, Typography } from "@mui/material";
import * as React from "react";
import InfiniteEntriesGrid from "../components/InfiniteEntriesGrid";
import FolderTwoToneIcon from "@mui/icons-material/FolderTwoTone";
import { useContext, useEffect, useState } from "react";
import ZXInfoSettings from "../common/ZXInfoSettings";
import { mylog } from "../App";

// duplicated in FilesView
// sort on filename, but add path
function basename(prevname) {
  return prevname.replace(/^(.*[/\\])?/, "");
}

function filterAndSortFiles(files, sortOptions, fileFilters) {
  mylog("GridView", "filterAndSortFiles", `sorting changed to: ${sortOptions}, filters: ${fileFilters}, no. of files: ${files.length}`);
  const newFiles = files.filter((fileName) => {
    mylog("GridView", "filterAndSortFiles", `${basename(fileName)}, ${fileName}`);
    let result = fileFilters.some((extension) => {
      const fileExt = fileName.substring(fileName.lastIndexOf(".") + 1, fileName.length).toLowerCase() || fileName.toLowerCase();
      return fileExt === extension;
    });

    return result;
  });

  if (sortOptions) {
    return [
      ...newFiles.sort((a, b) => {
        return basename(a).toLowerCase().localeCompare(basename(b).toLowerCase());
      }),
    ];
  } else {
    return [
      ...newFiles
        .sort((a, b) => {
          return basename(a).toLowerCase().localeCompare(basename(b).toLowerCase());
        })
        .reverse(),
    ];
  }
}

function GridView({ root, folders }) {
  const [appSettings] = useContext(ZXInfoSettings);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (folders) {
      folders.forEach((folder, index) => {
        console.log(`${folder.dir} - ${folder.files.length}`);
        setFiles((files) => [...files, ...folder.files]);
      });
    }
  }, [folders]);

  return (
    <React.Fragment>
      <Paper elevation={5} sx={{ border: 1, borderColor: "#a0a0a0", my: 4 }} id={root}>
        <Box sx={{ backgroundColor: "#e0e0e0", display: "flex", py: 3, px: 2 }}>
          <FolderTwoToneIcon />
          <Typography variant="button">
            &nbsp;{root} - ({files.length})
          </Typography>
        </Box>
        <InfiniteEntriesGrid key={files + appSettings.hideZip} files={files} foldername={root}></InfiniteEntriesGrid>
      </Paper>
    </React.Fragment>
  );
}
export default GridView;
