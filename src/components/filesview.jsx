import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import Divider from "@mui/material/Divider";

import RenderIfVisible from "react-render-if-visible";

import FileDetails from "./filedetails.jsx";
import { Typography } from "@mui/material";
import FolderTwoToneIcon from "@mui/icons-material/FolderTwoTone";

function showFiles(files, sortOptions, fileFilters) {
  let newFiles = files.sort();

    newFiles = files.filter((fileName) => {
      let result = fileFilters.some(extension => {
        return fileName.toLowerCase().endsWith(extension);})

      return result;
    });
  if (sortOptions) {
    return (
      <React.Fragment>
        {newFiles.map((file) => (
          <Grid xs={12} sm={6} lg={4} key={file}>
            <RenderIfVisible defaultHeight={500} stayRendered>
              <FileDetails filename={file}></FileDetails>
            </RenderIfVisible>
          </Grid>
        ))}
      </React.Fragment>
    );
  } else {
    return (
      <React.Fragment>
        {newFiles
          .reverse()
          .map((file) => (
            <Grid xs={12} sm={6} lg={4} key={file}>
              <RenderIfVisible defaultHeight={500} stayRendered>
                <FileDetails filename={file}></FileDetails>
              </RenderIfVisible>
            </Grid>
          ))}
      </React.Fragment>
    );
  }
}

class FilesView extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: [], isLoading: true };
  }

  componentDidMount() {
    window.electronAPI.scanFolder(this.props.foldername).then((res) => {
      this.setState({ data: res });
      this.setState({ isLoading: false });
    });
  }

  render() {
    return (
      <React.Fragment>
        <Box sx={{ flexGrow: 1, my: 2, minHeight:20 }}>
          <Box sx={{ display: "flex" }}>
            <FolderTwoToneIcon />
            <Typography variant="button">{this.props.foldername}</Typography>
          </Box>
          <Divider variant="middle" />
          <Grid container spacing={4} id={this.props.foldername}>
            {showFiles(
              this.state.data,
              this.props.sortOrder,
              this.props.fileFilters
            )}
          </Grid>
        </Box>
      </React.Fragment>
    );
  }
}

export default FilesView;
