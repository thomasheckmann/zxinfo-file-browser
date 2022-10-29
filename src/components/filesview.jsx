import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import Divider from "@mui/material/Divider";

import FileDetails from "./filedetails.jsx";
import { Paper, Typography } from "@mui/material";
import FolderTwoToneIcon from "@mui/icons-material/FolderTwoTone";
import RenderIfVisible from "react-render-if-visible";

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

class FilesView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filesInFolder: [],
      files: [],
      sortOrderFiles: this.props.sortOrder,
      fileFilters: this.props.fileFilters,
    };
  }

  componentDidMount() {
    window.electronAPI.scanFolder(this.props.foldername).then((res) => {
      // filter out files based filtring
      const newList = filterAndSortFiles(
        res,
        this.state.sortOrderFiles,
        this.state.fileFilters
      );
      this.setState({
        filesInFolder: res,
        files: newList,
        sortOrder: this.state.sortOrderFiles,
        fileFilters: this.state.fileFilters,
      });
    });
  }

  static getDerivedStateFromProps(props, current_state) {
    if (current_state.sortOrderFiles !== props.sortOrder) {
      const newList = filterAndSortFiles(
        current_state.filesInFolder,
        props.sortOrder,
        current_state.fileFilters
      );

      return {
        files: newList,
        sortOrderFiles: props.sortOrder,
        filesFilters: current_state.fileFilters,
      };
    } else if (current_state.fileFilters !== props.fileFilters) {
      const newList = filterAndSortFiles(
        current_state.filesInFolder,
        current_state.sortOrder,
        props.fileFilters
      );
      return {
        files: newList,
        sortOrderFiles: current_state.sortOrder,
        fileFilters: props.fileFilters,
      };
    }
    return null;
  }

  render() {
    return (
      <Paper elevation={2}>
        <Box sx={{ display: "flex" }}>
          <FolderTwoToneIcon />
          <Typography variant="button">
            {this.props.foldername} - ({this.state.files.length})
          </Typography>
        </Box>
        <Divider variant="middle" />
        <Grid container spacing={2} id={this.props.foldername} sx={{ my: 2 }}>
          {this.state.files.map((file, index) => (
              <FileDetails filename={file} key={file}></FileDetails>
          ))}
        </Grid>
      </Paper>
    );
  }
}

export default FilesView;
