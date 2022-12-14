/**
 *
 * Creates general layout
 *
 */
import React, { useEffect } from "react";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import FavoriteBorderOutlined from "@mui/icons-material/FavoriteBorderOutlined";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FolderCopyOutlinedIcon from "@mui/icons-material/FolderCopyOutlined";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";

import { styled } from "@mui/material/styles";

import {
  AppBar,
  Backdrop,
  Badge,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  Drawer,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";

import MuiToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import FolderView from "./pages/FolderView";
import FavoritesList from "./pages/FavoritesList";
import GridView from "./pages/GridView";
import IntroText from "./pages/IntroText";

import { Link } from "react-scroll";

import ZXInfoSettings from "./common/ZXInfoSettings";
import "./App.css";

import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

const defaultFileFilters = ["sna", "z80", "slt", "dsk", "trd", "scl", "mdr", "tap", "tzx", "p", "p81", "81", "zip"];

export const ZXInfoSettingsObj = {
  fileFilters: defaultFileFilters,

  hideZip: false,
  // persistent app config saved to config.json
  sortOrderFiles: true,
  sortOrderFolders: true,
  favorites: new Map(),
  zxdbIDs: new Map(),
};

export const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

export function mylog(component, method, msg) {
  if (isDev) {
    console.log(`[R][${component}]-${method}(): ${msg}`);
  }
}

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

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [startFolder, setStartFolder] = React.useState({
    root: [],
    folders: [],
    total: 0,
  });

  const [appSettings, setAppSettings] = React.useState(ZXInfoSettingsObj);
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);
  const [showDrawerFolderLink, setShowDrawerFolderLink] = React.useState(false);
  const [showDrawerSettings, setShowDrawerSettings] = React.useState(false);
  const [isBusyWorking, setIsBusyWorking] = React.useState(false);

  const [statusText, setStatusText] = React.useState("");

  /**
   * xs, sm, md, lg, xl
   * @returns
   */
  const greaterThanLG = useMediaQuery(theme.breakpoints.up("xl"));
  const lgTOxl = useMediaQuery(theme.breakpoints.between("lg", "xl"));
  const mdTOlg = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const smTOmd = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const lessThanSM = useMediaQuery(theme.breakpoints.down("sm"));
  function getBreakPointName() {
    if (greaterThanLG) {
      return "XL";
    } else if (lgTOxl) {
      return "LG";
    } else if (mdTOlg) {
      return "MD";
    } else if (smTOmd) {
      return "SM";
    } else if (lessThanSM) {
      return "XS";
    }
  }

  /**
   * Handle Open/Close for settings Drawer
   */
  const toggleDrawerSettings = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setShowDrawerSettings(open);
  };

  /**
   * Handle Open/Close for folder link drawer
   */
  const toggleDrawerFolderLink = (open) => (event) => {
    setShowDrawerFolderLink(open);
  };

  const handleChangeSettingsZip = (event) => {
    setAppSettings({ ...appSettings, hideZip: event.target.checked });

    window.electronAPI.setStoreValue("hide-zip", event.target.checked);
  };

  const handleChangeSettingsFiles = (event) => {
    window.electronAPI.setStoreValue("sort-files", event.target.checked);
    setAppSettings({ ...appSettings, sortOrderFiles: event.target.checked });
  };

  function sortFolders(folders, option) {
    if (option) {
      return folders.sort();
    } else {
      return folders.sort().reverse();
    }
  }

  const handleChangeSettingsFolders = (event) => {
    mylog("App", "handleChangeSettingsFolders", `sorting changed to: ${event.target.checked}`);
    window.electronAPI.setStoreValue("sort-folders", event.target.checked);
    setAppSettings((appSettings) => ({ ...appSettings, sortOrderFolders: event.target.checked }));

    if (event.target.checked === true) {
      mylog("App", "handleChangeSettingsFolders", `sorting folders ASC (A-Z)`);
      setStartFolder((startFolder) => ({
        ...startFolder,
        folders: sortFolders(startFolder.folders, true),
      }));
    } else if (event.target.checked === false) {
      mylog("App", "handleChangeSettingsFolders", `sorting folders DESC (Z-A)`);
      setStartFolder((startFolder) => ({
        ...startFolder,
        folders: sortFolders(startFolder.folders, false),
      }));
    }
  };

  const handleFormatFilter = (event, newFormats) => {
    setAppSettings({ ...appSettings, fileFilters: newFormats });
  };

  /**
  window.electronAPI.onUpdateStatusText((_event, value) => {
    setStatusText(value);
  });
 */

  // get start-folder from store (last used folder)
  async function getStartFolder() {
    const initialFolder = await window.electronAPI.getStoreValue("start-folder");
    mylog("App", "getStartFolder", `getStartFolder. 'start-folder'=${initialFolder}`);
    if (initialFolder) {
      setIsBusyWorking(true);
      const foldersWithFiles = await window.electronAPI.openFolder(initialFolder);
      if (foldersWithFiles) {
        setStartFolder((startFolder) => ({
          ...startFolder,
          root: foldersWithFiles.root,
          folders: sortFolders(foldersWithFiles.folders, appSettings.sortOrderFolders),
          total: foldersWithFiles.total,
          time: foldersWithFiles.time,
        }));
      } else {
        // folder not found...
        window.alert(`Folder not found:\n${initialFolder}\nPlease try select a diffent folder...`);
      }
    }
    setIsBusyWorking(false);
  }

  useEffect(() => {
    mylog("App", "useEffect", `-enter- getStartFolder. Root length=${startFolder.root.length}`);
    if (startFolder.root.length === 0 && settingsLoaded) {
      getStartFolder();
      navigate("/");
    }
  }, [settingsLoaded]);

  useEffect(() => {
    mylog("App", "useEffect", `-enter- settingsLoaded? ${settingsLoaded}`);

    if (!settingsLoaded) {
      async function loadSettings() {
        mylog("App", "loadSettings", `-enter- appSettings: ${JSON.stringify(appSettings)}`);
        const sortOrdersFiles = await window.electronAPI.getStoreValue("sort-files");
        const sortOrderFolders = await window.electronAPI.getStoreValue("sort-folders");
        const hideZip = await window.electronAPI.getStoreValue("hide-zip");
        const favorites = await window.electronAPI.getFavorites("favorites");
        var favMap = new Map();
        if (favorites) {
          favMap = new Map(Object.entries(JSON.parse(favorites)));
        }
        const zxinfoSCR = await window.electronAPI.getZxinfoSCR("zxinfoSCR");
        var scrMap = new Map();
        if (zxinfoSCR) {
          scrMap = new Map(Object.entries(JSON.parse(zxinfoSCR)));
        }
        const zxdbIDs = await window.electronAPI.getZXDBs("zxdb-id-store");
        mylog("App", "loadSettings", `-enter- appSettings: ${JSON.stringify(zxdbIDs)}`);
        var zxdbidsMap = new Map();
        if (zxdbIDs) {
          zxdbidsMap = new Map(Object.entries(JSON.parse(zxdbIDs)));
        }
        setAppSettings({
          ...appSettings,
          sortOrderFiles: sortOrdersFiles,
          sortOrderFolders: sortOrderFolders,
          hideZip: hideZip,
          favorites: favMap,
          zxinfoSCR: scrMap,
          zxdbIDs: zxdbidsMap,
        });
        mylog("App", "loadSettings", `-exit- appSettings: ${JSON.stringify(appSettings)}`);
        setSettingsLoaded(true);
      }

      loadSettings();
    }
  }, []); // only run once

  /**
   * if open folder dialog is nedded from child, use this as callback
   * @param {*} childData
   */
  const handleOpenFolderFromChild = async (childData) => {
    setIsBusyWorking(true);
    const foldersWithFiles = await window.electronAPI.openFolder();
    foldersWithFiles &&
      setStartFolder({
        root: foldersWithFiles.root,
        folders: sortFolders(foldersWithFiles.folders, appSettings.sortOrderFolders),
        total: foldersWithFiles.total,
        time: foldersWithFiles.time,
      });
    if (foldersWithFiles) {
      // save start folder to app settings
      window.electronAPI.setStoreValue("start-folder", foldersWithFiles.root);
    }
    window.scrollTo({
      top: 0,
    });
    setIsBusyWorking(false);
  };

  return (
    settingsLoaded && (
      <ZXInfoSettings.Provider value={[appSettings, setAppSettings]}>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <Box position="fixed" top={0} height="60px" width="100%"></Box>
          <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isBusyWorking}>
            <CircularProgress color="inherit" />
          </Backdrop>
          <Box marginTop="50px">
            <AppBar position="fixed">
              <Toolbar variant="dense">
                <IconButton edge="start" color="inherit" sx={{ mr: 2 }} aria-label="Settings" onClick={toggleDrawerSettings(true)}>
                  <Tooltip title="Settings">
                    <SettingsOutlinedIcon />
                  </Tooltip>
                </IconButton>
                <IconButton
                  disabled={location.pathname.startsWith("/favorites")}
                  edge="start"
                  color="inherit"
                  sx={{ mr: 2 }}
                  aria-label="Favorites"
                  onClick={() => {
                    navigate("/favorites");
                  }}
                >
                  <Tooltip title="Favorites">
                    <Badge color="secondary" badgeContent={appSettings.favorites.size} showZero>
                      <FavoriteBorderOutlined />
                    </Badge>
                  </Tooltip>
                </IconButton>
                <IconButton edge="start" color="inherit" sx={{ mr: 2 }} aria-label="Open Folder" onClick={handleOpenFolderFromChild}>
                  <Tooltip title={"Open Folder"}>
                    <FolderOpenIcon />
                  </Tooltip>
                </IconButton>
                <Divider orientation="vertical" variant="middle" sx={{color: "#ff0000"}}/>
                <IconButton
                  disabled={location.pathname === "/"}
                  edge="start"
                  color="inherit"
                  sx={{ mr: 2 }}
                  aria-label="Folder view"
                  onClick={() => {
                    navigate("/");
                  }}
                >
                  <Tooltip title="View per folders">
                    <FolderCopyOutlinedIcon />
                  </Tooltip>
                </IconButton>
                <IconButton
                  disabled={startFolder.folders.length === 0 || location.pathname.startsWith("/gridview")}
                  edge="start"
                  color="inherit"
                  sx={{ mr: 2 }}
                  aria-label="Grid view"
                  onClick={() => {
                    navigate("/gridview");
                  }}
                >
                  <Tooltip title="View in grid">
                    <AppsOutlinedIcon />
                  </Tooltip>
                </IconButton>
                <IconButton
                  disabled={startFolder.folders.length < 2 || location.pathname.startsWith("/favorites")}
                  edge="start"
                  color="inherit"
                  sx={{ mr: 2 }}
                  aria-label="Jump to folder"
                  onClick={toggleDrawerFolderLink(true)}
                >
                  <Tooltip title="Jump to folder">
                    <ExpandMoreOutlinedIcon />
                  </Tooltip>
                </IconButton>

                <Typography variant="h6" color="inherit" component="div" sx={{ flexGrow: 1 }}>
                  ZXInfo File Browser
                  {isDev && " - " + getBreakPointName()}
                  {isDev && " - busy(" + isBusyWorking + ")"}
                  {isDev && " - " + location.pathname}
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  value={appSettings.fileFilters}
                  onChange={handleFormatFilter}
                  aria-label="Formats"
                  disabled={startFolder.total === 0}
                  sx={{ background: "#ffffff", mr: 10 }}
                >
                  {defaultFileFilters.map((ext) => (
                    <ToggleButton value={ext} key={ext}>
                      {ext}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Box sx={{ maxHeight: 50 }} component="img" src="./images/rainbow2.jpg" />
              </Toolbar>
            </AppBar>
            {/* Drawer at left, settings (to be saved for user)*/}
            <Drawer anchor="left" open={showDrawerSettings} onClose={toggleDrawerSettings(false)}>
              <Paper variant="outlined" sx={{ my: 0, p: 2, width: 350 }}>
                <Typography component="h1" variant="h6">
                  Settings
                </Typography>
                <Divider />
                <Grid container spacing={0}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Checkbox name="sortOrderFolders" checked={appSettings.sortOrderFolders} onChange={handleChangeSettingsFolders} />}
                      label="Sort folders ascending"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Checkbox name="sortOrderFiles" checked={appSettings.sortOrderFiles} onChange={handleChangeSettingsFiles} />}
                      label="Sort filenames ascending"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Checkbox name="hideZip" checked={appSettings.hideZip} onChange={handleChangeSettingsZip} />}
                      label="Hide main ZIP"
                    />
                  </Grid>{" "}
                  <Grid item xs={12}></Grid>
                  <Button variant="contained" onClick={toggleDrawerSettings(false)} sx={{ mt: 3, ml: 1 }}>
                    OK
                  </Button>
                </Grid>
              </Paper>
            </Drawer>
            {/* Drawer at top - jump to folder */}
            <Drawer anchor="top" variant="temporary" open={showDrawerFolderLink} onClose={toggleDrawerFolderLink(false)}>
              <Paper variant="outlined" sx={{ my: 0, p: 2 }}>
                <Typography variant="button">List of folders, click to jump to section</Typography>
                <Divider />
                <List dense>
                  {startFolder.folders.map((folder) => (
                    <ListItem key={folder}>
                      <Link to={folder} spy={true} smooth={false} onClick={toggleDrawerFolderLink(false)}>
                        {folder}
                      </Link>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Drawer>
            <Container maxWidth="xl">
              <Routes>
                <Route
                  path="/"
                  element={
                    startFolder.folders && startFolder.folders.length > 0 ? (
                      <FolderView folders={startFolder.folders} />
                    ) : (
                      <IntroText parentCallback={handleOpenFolderFromChild}></IntroText>
                    )
                  }
                ></Route>
                <Route path="/favorites" element={<FavoritesList />}></Route>
                <Route
                  path="/gridview"
                  element={startFolder.folders && startFolder.folders.length > 0 && <GridView root={startFolder.root} folders={startFolder.folders} />}
                ></Route>
              </Routes>
            </Container>
            <div className="footer">
              <Container>
                <Box sx={{ display: "flex" }}>
                  <Typography>
                    {startFolder.total} file(s) found in {startFolder.root} ({startFolder.time} sec.)
                  </Typography>
                </Box>
                <Box sx={{ display: "flex" }}>
                  <Typography align="center">{statusText}</Typography>
                </Box>
              </Container>
            </div>
          </Box>
        </ThemeProvider>
      </ZXInfoSettings.Provider>
    )
  );
}
