import React from "react";
import {
  Button,
  Divider,
  Drawer,
  List,
  ListItem,
  Paper,
  Typography,
} from "@mui/material";

import { Link } from "react-scroll";

import FilesView from "./filesview.jsx";

class FolderView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDrawerFolders: this.props.showDrawerFolders,
      forceClose: false,
    };
  }
  
  static getDerivedStateFromProps(props, current_state) {
    if(current_state.forceClose) {
      return {
        showDrawerFolders: false,
        forceClose: false,
      }
    } else if (current_state.showDrawerFolders !== props.showDrawerFolders) {
      return {
        showDrawerFolders: props.showDrawerFolders,
      }
    }
    return null
  }
  
  render() {
    const toggleFolderDrawer = (open) => (event) => {
      this.setState({ forceClose: true });
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
            <Typography variant="button">
              List of folders, click to jump to section
            </Typography>
            <Divider />
            <List dense>
              {this.props.folders.map((folder) => (
                <ListItem key={folder}>
                  <Link
                    to={folder}
                    spy={true}
                    smooth={false}
                    onClick={toggleFolderDrawer(false)}
                  >
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
            sortOrder={this.props.sortOrder}
          ></FilesView>
        ))}

      </React.Fragment>
    );
  }
}

export default FolderView;
