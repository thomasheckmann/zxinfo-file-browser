import { ThemeProvider } from "@emotion/react";
import {
  Box,
  Button,
  Chip,
  createTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";

import { mylog } from "../App";
import SNAFormat from "./formats/SNAFormat.jsx";
import Z80Format from "./formats/Z80Format";
import TAPFormat from "./formats/TAPFormat";
import TZXFormat from "./formats/TZXFormat";
import PFormat from "./formats/PFormat";
import DSKFormat from "./formats/DSKFormat";
import TRDFormat from "./formats/TRDFormat";
import SCLFormat from "./formats/SCLFormat";
import MDRFormat from "./formats/MDRFormat";
import ZXInfoSCRDialog from "./ZXInfoSCRDialog";

import LaunchTwoToneIcon from "@mui/icons-material/LaunchTwoTone";
import DownloadForOfflineTwoToneIcon from "@mui/icons-material/DownloadForOfflineTwoTone";

import Favorite from "../common/cardactions/Favorite";
import LocateFileAndFolder from "../common/cardactions/LocateFileAndFolder";
import ZXdbID from "../common/cardactions/ZXdbID";
import { ZXInfoSettingsCtx } from "../common/ZXInfoSettings";

const Item = styled(Paper)({
  textAlign: "left",
});

const openLink = (id) => {
  window.electronAPI.openZXINFODetail(id).then((res) => {});
};

function FileDetails(props) {
  const [appSettings] = useContext(ZXInfoSettingsCtx);
  const { onClose, open, item, selectedSCR, setSelectedSCR } = props;
  const [entry, setEntry] = useState(props.item);
  const [restCalled, setRestCalled] = useState(false);
  const [screens, setScreens] = useState([]);

  // Fetch SCR from ZXInfo API
  const [isSCRDialogOpen, setSCRDialogOpen] = useState(false);

  const handleSCRDialogClose = (value) => {
    setSelectedSCR(value);
    setSCRDialogOpen(false);
  };

  const handleSCRDialogOpen = () => {
    setSCRDialogOpen(true);
  };

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

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (!open) {
      mylog("FileDetails", "useEffect", `NOT open - skipping for: ${item.filename}`);
    } else if (!restCalled) {
      mylog("FileDetails", "useEffect", `OPEN, missing ZXInfo details - get API data for: ${item.filename} - ${item.sha512}`);
      if (item.zxdbID) {
        const dataURL = `https://api.zxinfo.dk/v3/games/${item.zxdbID}?mode=tiny`;
        mylog("FileDetails", "useEffect", `calling API ${dataURL}`);
        axios
          .get(dataURL)
          .then((response) => {
            // find first loading screen
            const s = response.data._source.screens;
            var loading = [];
            var running = [];
            if (s) {
              s.forEach((element) => {
                if (element.type === "Loading screen") {
                  loading.push(element);
                } else if (element.type === "Running screen") {
                  running.push(element);
                }
              });
            }

            // screens [0] = first loading, [1] = first running
            const items = [...loading.slice(0, 1), ...running.slice(0, 1), ...loading.slice(1), ...running.slice(1)];
            setScreens(items.filter((item) => item !== null));

            // get detailed File info
            window.electronAPI.loadFile(item.filepath, false).then((r) => {
              if (r.length === 1) {
                setEntry((entry) => ({ ...entry, data: r[0].data, data_ext: r[0].data_ext }));
              } else {
                // array of ZIP entries
                r.forEach((zf) => {
                  if (item.subfilename === zf.subfilename) {
                    setEntry((entry) => ({ ...entry, data: zf.data, data_ext: zf.data_ext }));
                  }
                });
              }
              setRestCalled(true);
            });
          })
          .catch((error) => {
            setEntry({});
          })
          .finally();
      } else {
        // get detailed File info, if not found in ZXDB
        window.electronAPI.loadFile(item.filepath, false).then((r) => {
          if (r.length === 1) {
            setEntry((entry) => ({ ...entry, data: r[0].data, data_ext: r[0].data_ext }));
          } else {
            // array of ZIP entries, find correct one
            r.forEach((zf) => {
              if (item.subfilename === zf.subfilename) {
                setEntry((entry) => ({ ...entry, data: zf.data, data_ext: zf.data_ext }));
              }
            });
          }
          setRestCalled(true);
        });
      }
    } else {
      mylog("FileDetails", "useEffect", `OPEN with ZXInfo details - ${item.zxdbID}`);
    }
  }, [open, restCalled, item, appSettings.zxinfoSCR]);

  if (!open) return null; // avoid rendering, if not open

  function getTitle() {
    var title = entry.subfilename ? `${entry.subfilename} in (${entry.filename})` : entry.filename;
    if (entry.zxdbTitle) {
      title = `${entry.zxdbTitle}`;
    }
    return title;
  }

  return (
    restCalled && (
      <ThemeProvider theme={theme}>
        {isSCRDialogOpen && (
          <ZXInfoSCRDialog
            open={isSCRDialogOpen}
            zxdb={{ zxdbID: entry.zxdbID, title: entry.zxdbTitle }}
            selectedValue={selectedSCR}
            onClose={handleSCRDialogClose}
          ></ZXInfoSCRDialog>
        )}
        <Dialog
          onClose={handleClose}
          open={open}
          scroll={"paper"}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: {
              minHeight: "80vh",
            },
          }}
        >
          <DialogTitle align="center" sx={{ color: "#ffffff", bgcolor: "#965602" }}>
            File info for {entry.filename}
            <br />
            <Typography variant="caption">{entry.sha512}</Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container id="common" sx={{ height: "100%" }}>
              <Grid item xs={false} sm={4} md={6} minHeight="70vh">
                <Box
                  sx={{
                    minHeight: "100%",
                    py: 1,
                  }}
                >
                  <Stack direction="row" spacing={2}>
                    <Typography variant="h6">
                      <Favorite entry={entry}></Favorite>
                      {getTitle()}
                      <LocateFileAndFolder path={entry.filepath}></LocateFileAndFolder>
                    </Typography>
                  </Stack>
                  <Stack spacing={2}>
                    {entry.zxdbID ? (
                      <Stack direction="row" spacing={1}>
                        <Item elevation={0}>
                          <Typography variant="subtitle2">
                            Entry found in ZXDB with ID: {entry.zxdbID}
                            <Tooltip title="More details at ZXInfo.dk">
                              <IconButton aria-label="More details at ZXInfo.dk" onClick={() => openLink(entry.zxdbID)}>
                                <LaunchTwoToneIcon />
                              </IconButton>
                            </Tooltip>
                          </Typography>
                        </Item>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1}>
                        <ZXdbID entry={entry}></ZXdbID>
                      </Stack>
                    )}
                    <Stack direction="row" spacing={1} alignItems="center">
                      {entry.sources &&
                        entry.sources.map((e, i) => (
                          <Tooltip title={e.source} key={i}>
                            <img width="32" src={e.logo} alt={e.source}></img>
                          </Tooltip>
                        ))}
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {entry.version && <Chip label={entry.version} size="small" />}
                      {entry.hwmodel && <Chip label={entry.hwmodel} size="small" />}
                      {entry.protection && <Chip label={entry.protection} size="small" />}
                    </Stack>
                    <Item elevation={0}>
                      <Typography variant="subtitle1">Category</Typography>
                      <Typography variant="subtitle2">{entry.genre}</Typography>
                    </Item>
                    <Item elevation={0}>
                      <Typography variant="subtitle1">Machine</Typography>
                      <Typography variant="subtitle2">{entry.machinetype}</Typography>
                    </Item>
                    <Item elevation={0}>
                      <Typography variant="subtitle1">Date</Typography>
                      <Typography variant="subtitle2">{entry.originalYearOfRelease}</Typography>
                    </Item>
                    <Item elevation={0}>
                      <Typography variant="subtitle1">Original Publisher</Typography>
                      {entry.publishers && (
                        <Typography variant="subtitle2">
                          {entry.publishers[0].name} {entry.publishers[0].country && "(" + entry.publishers[0].country + ")"}
                        </Typography>
                      )}
                    </Item>
                  </Stack>
                  <Stack spacing={0} sx={{ pt: 2 }}>
                    <Item elevation={0}>
                      <Typography variant="subtitle1">
                        Preview and Screens found in ZXDB
                        {entry.zxdbID && (
                          <Tooltip title="Get SCR fron ZXInfo" onClick={() => handleSCRDialogOpen(this)}>
                            <IconButton arial-label="get scr from zxinfo">
                              <DownloadForOfflineTwoToneIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Typography>
                    </Item>
                    <Stack direction="row" spacing={1} sx={{ py: 0 }}>
                      <Item elevation={4} sx={{ p: 1 }}>
                        <img src={entry.orgScr} alt="Generated preview" width="220"></img>
                        <br />
                        <Typography variant="caption">Generated preview</Typography>
                      </Item>
                      {screens[0] && (
                        <Item elevation={4} sx={{ p: 1 }}>
                          <img src={`https://zxinfo.dk/media${screens[0].url}`} alt={screens[0].title} width="220"></img>
                          <br />
                          <Typography variant="caption">
                            {screens[0].type} (Release: {screens[0].release_seq})
                          </Typography>
                        </Item>
                      )}
                      {screens[1] && (
                        <Item elevation={4} sx={{ p: 1 }}>
                          <img src={`https://zxinfo.dk/media${screens[1].url}`} alt={screens[1].title} width="220"></img>
                          <br />
                          <Typography variant="caption">
                            {screens[1].type} (Release: {screens[1].release_seq})
                          </Typography>
                        </Item>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12} sm={8} md={6}>
                <Box
                  sx={{
                    minHeight: "100%",
                    py: 1,
                  }}
                >
                  <Typography variant="h6">
                    Details for {entry.version} - (file size: {/*item.data.filesize*/})
                  </Typography>
                  {entry.type === "snafmt" && entry.data.filesize && <SNAFormat item={entry}></SNAFormat>}
                  {entry.type === "z80fmt" && <Z80Format item={entry}></Z80Format>}
                  {entry.type === "tapfmt" && <TAPFormat item={entry}></TAPFormat>}
                  {entry.type === "tzxfmt" && entry.hwmodel !== "ZX81" && <TZXFormat item={entry}></TZXFormat>}
                  {(entry.type === "pfmt" || (entry.type === "tzxfmt" && entry.hwmodel === "ZX81")) && <PFormat item={entry}></PFormat>}
                  {entry.type === "dskfmt" && <DSKFormat item={entry}></DSKFormat>}
                  {entry.type === "trdfmt" && <TRDFormat item={entry}></TRDFormat>}
                  {entry.type === "sclfmt" && <SCLFormat item={entry}></SCLFormat>}
                  {entry.type === "mdrfmt" && <MDRFormat item={entry}></MDRFormat>}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ pb: 3, justifyContent: "center" }}>
            <Box>
              <Button variant="contained" onClick={() => handleClose()}>
                Close
              </Button>
            </Box>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    )
  );
}

export default FileDetails;
