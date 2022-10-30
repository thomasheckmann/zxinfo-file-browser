import React from "react";
import { Divider, Drawer, List, ListItem, Paper, Typography } from "@mui/material";

import { Link } from "react-scroll";
import FilesView from "./filesview.jsx";

class FolderView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDrawerFolders: this.props.showDrawerFolders,
      forceClose: false,
      sortOrderFiles: this.props.sortOrder,
      fileFilters: this.props.fileFilters,
      // folderToShow: this.props.folders,
    };
  }

  /**
   * If props are changed by parent
   *
   * @param {*} props
   * @param {*} current_state
   * @returns
   */
  static getDerivedStateFromProps(props, current_state) {
    if (current_state.forceClose) {
      return {
        showDrawerFolders: false,
        forceClose: false,
      };
    } else if (current_state.showDrawerFolders !== props.showDrawerFolders) {
      return {
        showDrawerFolders: props.showDrawerFolders,
      };
    } else if (current_state.sortOrderFiles !== props.sortOrder) {
      return { sortOrderFiles: props.sortOrder };
    } else if (current_state.fileFilters !== props.fileFilters) {
      return { fileFilters: props.fileFilters };
    }
    /** else if (current_state.folderToShow !== props.folders[0]) {
      return { folderToShow: props.folders[0] };
    }*/
    return null;
  }

  render() {
    // folderToShow must be send to parent
    const toggleFolderDrawer = (open) => (event) => {
      this.setState({ forceClose: true /* folderToShow: open */ });
    };

    return (
      <React.Fragment>
        <Drawer
          anchor="top"
          variant="temporary"
          open={this.state.showDrawerFolders}
          onClose={toggleFolderDrawer(false)}
        >
          <Paper variant="outlined" sx={{ my: 0, p: 2 }}>
            <Typography variant="button">List of folders, click to jump to section</Typography>
            <Divider />
            <List dense>
              {this.props.folders.map((folder) => (
                <ListItem key={folder}>
                  <Link to={folder} spy={true} smooth={false} onClick={toggleFolderDrawer(true)}>
                    {folder}
                  </Link>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Drawer>
        {this.props.folders.map((folder) => (
          <FilesView
            key={folder}
            foldername={folder}
            sortOrder={this.state.sortOrderFiles}
            fileFilters={this.state.fileFilters}
          ></FilesView>
        ))}
      </React.Fragment>
    );
  }
}

export default FolderView;
