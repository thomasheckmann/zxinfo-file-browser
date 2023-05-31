/**
 *
 * Creates general layout
 *
 */
import React, { useEffect, useState } from "react";

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

import { ZXInfoSettingsCtx, ZXInfoSettingsObj } from "./common/ZXInfoSettings";
import "./App.css";

import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import hash from "object-hash";

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

  const [appSettings, setAppSettings] = useState(ZXInfoSettingsObj);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showDrawerFolderLink, setShowDrawerFolderLink] = React.useState(false);
  const [showDrawerSettings, setShowDrawerSettings] = useState(false);
  const [isBusyWorking, setIsBusyWorking] = useState(false);
  const [allFiles, setAllFiles] = useState([]);
  const [allFilesMaster, setAllFilesMaster] = useState([]);

  //   const [statusText, setStatusText] = React.useState("");

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

  /**
   *
   * @param {*} folders - [{dir: "", files: []}, {dir: "", files: []}]
   * @param {*} sortAtoZ - true or false
   * @returns sorted array
   */
  function sortFolders(folders, sortAtoZ) {
    if (sortAtoZ) {
      return folders.sort((a, b) => {
        if (a.dir < b.dir) {
          return -1;
        }
        if (a.dir > b.dir) {
          return 1;
        }
        return 0;
      });
    } else {
      return folders.sort((a, b) => {
        if (a.dir < b.dir) {
          return 1;
        }
        if (a.dir > b.dir) {
          return -1;
        }
        return 0;
      });
    }
  }

  /**
   *
   * @param {*} folders - [{dir: "", files: []}, {dir: "", files: []}]
   * @param {*} sortAtoZ - true or false
   * @returns sorted array
   */
  function sortFiles(folders, sortAtoZ) {
    folders.forEach((e, i) => {
      e.files = sortAtoZ ? e.files.sort() : e.files.sort().reverse();
      folders[i] = e;
    });
    return folders;
  }

  /**
   *
   * @param {*} folders - [{dir: "", files: []}, {dir: "", files: []}]
   * @param {*} filters - to include, [filter1, filter2]
   * @returns
   */
  function filterFiles(folders, filters) {
    folders.forEach((e, i) => {
      e.files = e.files.filter((fileName) => {
        let result = filters.some((filters) => {
          const fileExt = fileName.substring(fileName.lastIndexOf(".") + 1, fileName.length).toLowerCase() || fileName.toLowerCase();
          return fileExt === filters;
        });
        return result;
      });

      folders[i] = e;
    });
    return folders;
  }

  const handleChangeSettingsFolders = (event) => {
    mylog("App", "handleChangeSettingsFolders", `sorting changed to: ${event.target.checked}`);
    window.electronAPI.setStoreValue("sort-folders", event.target.checked);
    setAppSettings((appSettings) => ({ ...appSettings, sortOrderFolders: event.target.checked }));

    if (event.target.checked === true) {
      mylog("App", "handleChangeSettingsFolders", `sorting folders ASC (A-Z)`);
      setAllFiles((allFiles) => sortFolders(allFiles, true));
    } else if (event.target.checked === false) {
      mylog("App", "handleChangeSettingsFolders", `sorting folders DESC (Z-A)`);
      setAllFiles((allFiles) => sortFolders(allFiles, false));
    }
  };

  const handleChangeSettingsFiles = (event) => {
    mylog("App", "handleChangeSettingsFiles", `sorting changed to: ${event.target.checked}`);
    window.electronAPI.setStoreValue("sort-files", event.target.checked);
    setAppSettings((appSettings) => ({ ...appSettings, sortOrderFiles: event.target.checked }));

    if (event.target.checked === true) {
      mylog("App", "handleChangeSettingsFiles", `sorting files ASC (A-Z)`);
      setAllFiles((allFiles) => sortFiles(allFiles, true));
    } else if (event.target.checked === false) {
      mylog("App", "handleChangeSettingsFiles", `sorting files DESC (Z-A)`);
      setAllFiles((allFiles) => sortFiles(allFiles, false));
    }
  };

  /**
   * Handle change in "filtering"
   * @param {*} event
   * @param {*} newFormats
   */
  const handleFormatFilter = (event, newFormats) => {
    mylog("App", "handleFormatFilter", `filters changed to: ${newFormats} - current: ${appSettings.fileFilters.length}, new: ${newFormats.length})`);
    setAppSettings((appSettings) => ({ ...appSettings, fileFilters: newFormats }));
    if (appSettings.fileFilters.length < newFormats.length) {
      mylog("App", "handleFormatFilter", `adding: ${newFormats.filter((d) => !appSettings.fileFilters.includes(d))} (${hash(allFiles)})`);
      // filtering, sort folders, sort files
      setAllFiles((allFiles) => sortFiles(sortFolders(filterFiles([...allFilesMaster], newFormats)), appSettings.sortOrderFolders), appSettings.sortOrderFiles);
    } else {
      mylog("App", "handleFormatFilter", `removing: ${appSettings.fileFilters.filter((d) => !newFormats.includes(d))}`);
      setAllFiles((allFiles) => filterFiles(allFiles, newFormats));
    }
  };

  useEffect(() => {
    mylog("App", "useEffect", `-enter- settingsLoaded? ${settingsLoaded}`);

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
            folders: foldersWithFiles.folders, // sortFolders(foldersWithFiles.folders, appSettings.sortOrderFolders),
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

    if (!settingsLoaded) {
      mylog("App", "useEffect", `loading settings...`);
      async function loadSettings() {
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
        var zxdbidsMap = new Map();
        if (zxdbIDs) {
          zxdbidsMap = new Map(Object.entries(JSON.parse(zxdbIDs)));
        }
        setAppSettings((appSettings) => ({
          ...appSettings,
          sortOrderFiles: sortOrdersFiles,
          sortOrderFolders: sortOrderFolders,
          hideZip: hideZip,
          favorites: favMap,
          zxinfoSCR: scrMap,
          zxdbIDs: zxdbidsMap,
        }));
        // mylog("App", "loadSettings", `-exit- appSettings: ${JSON.stringify(appSettings)}`);
        setSettingsLoaded(true);
        mylog("App", "useEffect", `loading settings... DONE!`);
        getStartFolder();
        navigate("/");
      }

      loadSettings();
    }
  }, []); // only run once

  useEffect(() => {
    mylog("App", "useEffect/startFolder", `-enter- number of folders = ${startFolder.folders.length}`);

    // reset everything
    setAllFiles([]);
    setAllFilesMaster([]);

    window.electronAPI.onFolderCompleted((_event, value) => {
      mylog("App", "onFolderCompleted", `${value[0]} - no. of files: ${value[1].length}, sortFolder: ${appSettings.sortOrderFolders}`);

      setAllFilesMaster((allFilesMaster) => [...allFilesMaster, { dir: value[0], files: value[1] }]);
      // filtering, sort folders, sort files
      setAllFiles((allFiles) =>
        sortFiles(
          sortFolders(filterFiles([...allFiles, { dir: value[0], files: value[1] }], appSettings.fileFilters), appSettings.sortOrderFolders),
          appSettings.sortOrderFiles
        )
      );
    });

    window.electronAPI.scanFolders(startFolder.folders);

    return () => {
      mylog("App", "useEffect/startFolder", `destroy, remove all listener...`);
      window.electronAPI.removeAllListeners("folder-completed");
    };
  }, [appSettings.fileFilters, appSettings.sortOrderFiles, appSettings.sortOrderFolders, startFolder.folders]);

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
      <ZXInfoSettingsCtx.Provider value={[appSettings, setAppSettings]}>
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
                <Divider orientation="vertical" variant="middle" sx={{ color: "#ff0000" }} />
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
                  {appSettings.defaultFileFilters.map((ext) => (
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
                      <FolderView key={hash(allFiles) + hash(appSettings)} folders={allFiles} />
                    ) : (
                      <IntroText parentCallback={handleOpenFolderFromChild}></IntroText>
                    )
                  }
                ></Route>
                <Route path="/favorites" element={<FavoritesList />}></Route>
                <Route
                  path="/gridview"
                  element={
                    startFolder.folders && startFolder.folders.length > 0 ? (
                      <GridView key={hash(allFiles) + hash(appSettings)} root={startFolder.root} folders={allFiles} />
                    ) : (
                      <div></div>
                    )
                  }
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
              </Container>
            </div>
          </Box>
        </ThemeProvider>
      </ZXInfoSettingsCtx.Provider>
    )
  );
}
