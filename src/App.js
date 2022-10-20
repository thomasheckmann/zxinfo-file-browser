/**
 *
 * Creates general layout
 *
 */
import React, { useEffect } from "react";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { styled } from "@mui/material/styles";

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
  Tooltip,
  Typography,
} from "@mui/material";

import MuiToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import FolderView from "./components/folderview.jsx";
import IntroText from "./Intro.jsx";

import "./App.css";

const ToggleButton = styled(MuiToggleButton)({
  "&.Mui-selected, &.Mui-selected:hover": {
    color: "white",
    backgroundColor: "#008000",
  },
  "&.Mui-disabled": {
    color: "#a0a0a0",
    backgroundColor: "#004000",
  },
});
const theme = createTheme({
  palette: {
    primary: {
      main: "#000000",
    },
    secondary: {
      main: "#c0c0c0",
    },
    action: {
      disabled: "#808080",
    },
  },
});

const defaultFileFilters = [
  "sna",
  "z80",
  "slt",
  "dsk",
  "trd",
  "mdr",
  "tap",
  "tzx",
  "zip",
];

function App() {
  const [startFolder, setStartFolder] = React.useState({
    root: [],
    folders: [],
    total: 0,
    showDrawerFolders: true,
    showDrawerSettings: false,
    fileFilters: defaultFileFilters,
  });

  /**
   * Drawer for settings
   */
  const toggleDrawerSettings = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setStartFolder({
      ...startFolder,
      showDrawerSettings: open,
      showDrawerFolders: false,
    });
    // setShowDrawerSettings(open);
  };

  const toggleDrawerFolders = (open) => (event) => {
    setStartFolder({ ...startFolder, showDrawerFolders: open });
  };

  /**
   * User settings
   */

  const [userSettings, setUserSettings] = React.useState({
    sortOrderFiles: true,
    sortOrderFolders: true,
  });

  const handleChangeSettingsFiles = (event) => {
    window.electronAPI.setStoreValue("sort-files", event.target.checked);
    setUserSettings({ ...userSettings, sortOrderFiles: event.target.checked });
  };

  const handleChangeSettingsFolders = (event) => {
    window.electronAPI.setStoreValue("sort-folders", event.target.checked);
    setUserSettings({
      ...userSettings,
      sortOrderFolders: event.target.checked,
    });
    if (event.target.checked === true) {
      setStartFolder({
        ...startFolder,
        folders: startFolder.folders.sort(),
      });
    } else if (event.target.checked === false) {
      setStartFolder({
        ...startFolder,
        folders: startFolder.folders.sort().reverse(),
      });
    }
  };

  const handleFormat = (event, newFormats) => {
    setStartFolder({
      ...startFolder,
      fileFilters: newFormats,
      showDrawerFolders: false,
    });
  };

  useEffect(() => {
    window.electronAPI
      .getStoreValue("sort-folders")
      .then((data) =>
        setUserSettings({ ...userSettings, sortOrderFolders: data })
      );
    window.electronAPI
      .getStoreValue("sort-files")
      .then((data) =>
        setUserSettings({ ...userSettings, sortOrderFiles: data })
      );
  }, []);

  const handleOpenFolderFromChild = async (childData) => {
    const foldersWithFiles = await window.electronAPI.openFolder();
    setStartFolder({
      root: foldersWithFiles.root,
      folders: foldersWithFiles.folders,
      total: foldersWithFiles.total,
      showDrawerFolders: false,
      showDrawerSettings: false,
      fileFilters: defaultFileFilters,
    });
    window.scrollTo({
      top: 0,
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          width: "100%",
          height: "100vh",
        }}
      >
        <AppBar position="fixed">
          <Toolbar variant="dense">
            <IconButton
              edge="start"
              color="inherit"
              sx={{ mr: 2 }}
              aria-label="Settings"
              onClick={toggleDrawerSettings(true)}
            >
              <Tooltip title="Settings">
                <SettingsOutlinedIcon />
              </Tooltip>
            </IconButton>
            <IconButton
              edge="start"
              color="inherit"
              sx={{ mr: 2 }}
              aria-label="Open Folder"
              onClick={async () => {
                const foldersWithFiles = await window.electronAPI.openFolder();
                setStartFolder({
                  root: foldersWithFiles.root,
                  folders: foldersWithFiles.folders,
                  total: foldersWithFiles.total,
                  showDrawerFolders: false,
                  showDrawerSettings: false,
                  fileFilters: defaultFileFilters,
                });
                window.scrollTo({
                  top: 0,
                });
              }}
            >
              <Tooltip title="Open Folder">
                <FolderOpenIcon />
              </Tooltip>
            </IconButton>
            <IconButton
              disabled={startFolder.folders.length < 2}
              edge="start"
              color="inherit"
              sx={{ mr: 2 }}
              aria-label="Jump to folder"
              onClick={toggleDrawerFolders(true)}
            >
              <Tooltip title="Jump to folder">
                <ExpandMoreOutlinedIcon />
              </Tooltip>
            </IconButton>

            <Typography
              variant="h6"
              color="inherit"
              component="div"
              sx={{ flexGrow: 1 }}
            >
              ZXInfo File Browser
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={startFolder.fileFilters}
              onChange={handleFormat}
              aria-label="Formats"
              disabled={startFolder.total === 0}
              sx={{ background: "#ffffff", mr: 10 }}
            >
              {defaultFileFilters.map((ext) => (
                <ToggleButton value={ext} key={ext}>{ext}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Box
              sx={{ maxHeight: 50 }}
              component="img"
              src="./images/rainbow2.jpg"
            />
          </Toolbar>
        </AppBar>
        <Drawer
          anchor="left"
          open={startFolder.showDrawerSettings}
          onClose={toggleDrawerSettings(false)}
        >
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
                      name="sortOrderFolders"
                      checked={userSettings.sortOrderFolders}
                      onChange={handleChangeSettingsFolders}
                    />
                  }
                  label="Sort folders ascending"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="sortOrderFiles"
                      checked={userSettings.sortOrderFiles}
                      onChange={handleChangeSettingsFiles}
                    />
                  }
                  label="Sort filenames ascending"
                />
              </Grid>
              <Grid item xs={12}></Grid>
              <Button
                variant="contained"
                onClick={toggleDrawerSettings(false)}
                sx={{ mt: 3, ml: 1 }}
              >
                OK
              </Button>
            </Grid>
          </Paper>
        </Drawer>
        <Container fixed>
          <Box sx={{ my: 0, height: "100%" }}>
            <Toolbar />
            {startFolder.folders && startFolder.folders.length > 0 ? (
              <React.Fragment>
                <FolderView
                  folders={startFolder.folders}
                  sortOrder={userSettings.sortOrderFiles}
                  showDrawerFolders={startFolder.showDrawerFolders}
                  fileFilters={startFolder.fileFilters}
                />
              </React.Fragment>
            ) : (
              <IntroText parentCallback={handleOpenFolderFromChild}></IntroText>
            )}
            <Toolbar />
          </Box>
        </Container>

        <div className="footer">
          <Container>
            <Box sx={{ display: "flex" }}>
              <Typography>
                {startFolder.total} file(s) found in {startFolder.root}
              </Typography>
            </Box>
          </Container>
        </div>
      </Box>
    </ThemeProvider>
  );
}

export default App;
