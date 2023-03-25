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
import React, { useEffect, useState } from "react";
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

const Item = styled(Paper)({
  textAlign: "left",
});

const openLink = (id) => {
  window.electronAPI.openZXINFODetail(id).then((res) => {});
};

export default function FileDetails(props) {
  const { onClose, open, item } = props;
  const [entry, setEntry] = useState(null);
  const [screens, setScreens] = useState([]);

  // Fetch SCR from ZXInfo API
  const [isSCRDialogOpen, setSCRDialogOpen] = useState(false);
  const [selectedSCR, setSelectedSCR] = useState("");

  const handleSCRDialogClose = (value) => {
    setSCRDialogOpen(false);
    props.handleclose(value);
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
      mylog("FileDetails", "useEffect", `NOT open, skipping for: ${item.zxdbID}`);
    } else if (open && !entry) {
      mylog("FileDetails", "useEffect", `OPEN, get API data for: ${item.zxdbID}`);
      const dataURL = `https://api.zxinfo.dk/v3/games/${item.zxdbID}?mode=tiny`;
      mylog("FileDetails", "useEffect", `calling API ${dataURL}`);
      axios
        .get(dataURL)
        .then((response) => {
          setEntry((entry) => response.data._source);

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
        })
        .catch((error) => {
          setEntry({});
        })
        .finally(() => {});
    }
  }, [item.zxdbID]);

  if (!open) return null; // avoid rendering, if not open

  function getTitle() {
    var title = item.subfilename ? `${item.subfilename} in (${item.filename})` : item.filename;
    if (item.zxdbTitle) {
      title = `${item.zxdbTitle}`;
    }
    return title;
  }

  return (
    entry && (
      <ThemeProvider theme={theme}>
        {isSCRDialogOpen && (
          <ZXInfoSCRDialog
            open={isSCRDialogOpen}
            zxdb={{ zxdbID: item.zxdbID, title: item.zxdbTitle }}
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
            File info for {item.filename}
            <br />
            <Typography variant="caption">{item.sha512}</Typography>
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
                      <Favorite entry={item}></Favorite>
                      {getTitle()}
                      <LocateFileAndFolder path={item.filepath}></LocateFileAndFolder>
                    </Typography>
                  </Stack>
                  <Stack spacing={2}>
                    {item.zxdbID ? (
                      <Stack direction="row" spacing={1}>
                        <Item elevation={0}>
                          <Typography variant="subtitle2">
                            Entry found in ZXDB with ID: {item.zxdbID}
                            <Tooltip title="More details at ZXInfo.dk">
                              <IconButton aria-label="More details at ZXInfo.dk" onClick={() => openLink(item.zxdbID)}>
                                <LaunchTwoToneIcon />
                              </IconButton>
                            </Tooltip>
                          </Typography>
                          <Typography variant="subtitle2">Source: {item.source}</Typography>
                        </Item>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1}>
                        <ZXdbID entry={item}></ZXdbID>
                        <br />
                      </Stack>
                    )}
                    <Stack direction="row" spacing={1} alignItems="center">
                      {item.version && <Chip label={item.version} size="small" />}
                      {item.hwmodel && <Chip label={item.hwmodel} size="small" />}
                      {item.protection && <Chip label={item.protection} size="small" />}
                    </Stack>
                    <Item elevation={0}>
                      <Typography variant="subtitle1">Category</Typography>
                      <Typography variant="subtitle2">{entry.genre}</Typography>
                    </Item>
                    <Item elevation={0}>
                      <Typography variant="subtitle1">Machine</Typography>
                      <Typography variant="subtitle2">{entry.machineType}</Typography>
                    </Item>
                    <Item elevation={0}>
                      <Typography variant="subtitle1">Date</Typography>
                      <Typography variant="subtitle2"></Typography>
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
                        {item.zxdbID && (
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
                        <img src={item.orgScr} alt="Generated preview" width="220"></img>
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
                    Details for {item.version} - (file size: {item.data.filesize})
                  </Typography>
                  {item.type === "snafmt" && item.data.filesize && <SNAFormat item={item}></SNAFormat>}
                  {item.type === "z80fmt" && <Z80Format item={item}></Z80Format>}
                  {item.type === "tapfmt" && <TAPFormat item={item}></TAPFormat>}
                  {item.type === "tzxfmt" && <TZXFormat item={item}></TZXFormat>}
                  {item.type === "pfmt" && <PFormat item={item}></PFormat>}
                  {item.type === "dskfmt" && <DSKFormat item={item}></DSKFormat>}
                  {item.type === "trdfmt" && <TRDFormat item={item}></TRDFormat>}
                  {item.type === "sclfmt" && <SCLFormat item={item}></SCLFormat>}
                  {item.type === "mdrfmt" && <MDRFormat item={item}></MDRFormat>}
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
