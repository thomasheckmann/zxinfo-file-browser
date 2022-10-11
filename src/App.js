/**
 *
 * Creates general layout
 *
 */
import React from "react";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import {
  AppBar,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Drawer,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";

import FolderView from "./components/folderview.jsx";
import IntroText from "./Intro.jsx";

//import "./App.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#000000",
    },
    secondary: {
      main: "#c0c0c0",
    },
  },
});

function App() {
  const [startFolder, setStartFolder] = React.useState({
    folders: [],
    total: 0,
  });
  const [drawerIsOpen, setDrawerIsOpen] = React.useState(false);

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setDrawerIsOpen(open);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            sx={{ mr: 2 }}
            aria-label="Settings"
            component="label"
            onClick={toggleDrawer(true)}
          >
            <SettingsOutlinedIcon />
          </IconButton>
          <IconButton
            edge="start"
            color="inherit"
            sx={{ mr: 2 }}
            aria-label="Open Folder"
            component="label"
            onClick={async () => {
              const foldersWithFiles = await window.electronAPI.openFolder();
              setStartFolder({
                root: foldersWithFiles.root,
                folders: foldersWithFiles.folders,
                total: foldersWithFiles.total,
              });
            }}
          >
            <FolderOpenIcon />
          </IconButton>
          <Typography variant="h6" color="inherit" component="div">
            ZXInfo Explorer
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerIsOpen} onClose={toggleDrawer(false)}>
        <Paper variant="outlined" sx={{ my: 0, p: 2, width: 350 }}>
          <Typography component="h1" variant="h6">
            Settings
          </Typography>
          <Divider />
          <Grid container spacing={0}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="secondary"
                    name="sortOrderFolders"
                    value="yes"
                  />
                }
                label="Sort folders ascending"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="secondary"
                    name="sortOrderFiles"
                    value="yes"
                  />
                }
                label="Sort filenames ascending"
              />
            </Grid>
            <Button
              variant="contained"
              onClick={toggleDrawer(false)}
              sx={{ mt: 3, ml: 1 }}
            >
              OK
            </Button>
          </Grid>
        </Paper>
      </Drawer>
      <Container>
        <Box sx={{ my: 0 }}>
          {startFolder.folders && startFolder.folders.length > 0 ? (
            <React.Fragment>
              <Toolbar></Toolbar>
              <Typography variant="overline">
                {startFolder.total} file(s) found in {startFolder.root}
              </Typography>
              <FolderView folders={startFolder.folders} />
            </React.Fragment>
          ) : (
            <IntroText></IntroText>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
