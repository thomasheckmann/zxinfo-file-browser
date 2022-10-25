import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import Divider from "@mui/material/Divider";

import FileDetails from "./filedetails.jsx";
import { Typography } from "@mui/material";
import FolderTwoToneIcon from "@mui/icons-material/FolderTwoTone";

function showFiles(files, sortOptions, fileFilters) {
  const newFiles = files.sort().filter((fileName) => {
    let result = fileFilters.some((extension) => {
      return fileName.toLowerCase().endsWith(extension);
    });

    return result;
  });

  if (sortOptions) {
    return (
      <React.Fragment>
        {newFiles.map((file) => (
          <FileDetails filename={file} key={file}></FileDetails>
        ))}
      </React.Fragment>
    );
  } else {
    return (
      <React.Fragment>
        {newFiles.reverse().map((file) => (
          <FileDetails filename={file} key={file}></FileDetails>
        ))}
      </React.Fragment>
    );
  }
}

class FilesView extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: [] };
  }

  componentDidMount() {
    window.electronAPI.scanFolder(this.props.foldername).then((res) => {
      this.setState({ data: res });
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.foldername !== this.props.foldername) {
      window.electronAPI.scanFolder(this.props.foldername).then((res) => {
        this.setState({ data: res });
      });
    }
  }

  render() {
    return (
      <Box sx={{ flexGrow: 1, my: 2, minHeight: 600 }} id="folder">
        <Box sx={{ display: "flex" }}>
          <FolderTwoToneIcon />
          <Typography variant="button">
            {this.props.foldername} - ({this.state.data.length})
          </Typography>
        </Box>
        <Divider variant="middle" />
        <Grid container spacing={2} id={this.props.foldername} sx={{ my: 2 }}>
          {showFiles(
            this.state.data,
            this.props.sortOrder,
            this.props.fileFilters
          )}
        </Grid>
      </Box>
    );
  }
}

export default FilesView;
