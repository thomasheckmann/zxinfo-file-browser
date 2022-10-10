import React from "react";
import { Drawer, Toolbar } from "@mui/material";

import FilesView from "./filesview.jsx";

class FolderView extends React.Component {
  constructor(props) {
    super(props);
    this.state = { drawer: false };
  }

  render() {
    const toggleDrawer = (open) => (event) => {
      if (
        event.type === "keydown" &&
        (event.key === "Tab" || event.key === "Shift")
      ) {
        return;
      }

      this.setState({ drawer: open });
    };

    return (
      <React.Fragment>
        <Toolbar />
        <Drawer
          anchor="right"
          open={this.state.drawer}
          onClose={toggleDrawer(false)}
        >
          lkasjdlkajsdlkf alskdj
        </Drawer>
        {this.props.folders.map((folder) => (
          <FilesView key={folder} foldername={folder}></FilesView>
        ))}
      </React.Fragment>
    );
  }
}

export default FolderView;
