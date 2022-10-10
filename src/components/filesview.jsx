import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import Divider from "@mui/material/Divider";

import RenderIfVisible from "react-render-if-visible";

import FileDetails from "./filedetails.jsx";

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

  render() {
    return (
      <React.Fragment>
        <Box sx={{ flexGrow: 1 }}>
          <h3 align="left">{this.props.foldername}</h3>
          <Divider variant="middle" />
          <Grid container spacing={4}>
            {this.state.data.map((file) => (
              <Grid xs={12} sm={6} lg={4} key={file}>
                <RenderIfVisible defaultHeight={500} stayRendered>
                  <FileDetails filename={file}></FileDetails>
                </RenderIfVisible>
              </Grid>
            ))}
          </Grid>
        </Box>
      </React.Fragment>
    );
  }
}

export default FilesView;
