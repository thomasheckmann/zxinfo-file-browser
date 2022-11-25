import { ThemeProvider } from "@emotion/react";
import { Box, Button, createTheme, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, Stack, Typography } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { isDev } from "../App";
import SNAFormat from "./formats/SNAFormat.jsx";
import Z80Format from "./formats/Z80Format";

export default function FileDetails(props) {
  const { onClose, open, item } = props;

  const [entry, setEntry] = useState(null);
  const [screens, setScreens] = useState([]);

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

  const Item = styled(Paper)(({ theme }) => ({
    textAlign: "left",
  }));

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (!open) {
      if (isDev) {
        console.log(`useEffect(): NOT open, skipping for: ${item.zxdbID}`);
      }
    } else if (open && !entry) {
      if (isDev) {
        console.log(`useEffect(): OPEN, get API data for: ${item.zxdbID} - (${entry})`);

        const dataURL = `https://api.zxinfo.dk/v3/games/${item.zxdbID}?mode=tiny`;
        if (isDev) console.log(`API: ${dataURL}`);
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

            if (isDev) console.log(`loading: ${JSON.stringify(loading)}`);
            if (isDev) console.log(`running: ${JSON.stringify(running)}`);

            // screens [0] = first loading, [1] = first running
            const items = [...loading.slice(0, 1), ...running.slice(0, 1), ...loading.slice(1), ...running.slice(1)];
            setScreens(items.filter((item) => item !== null));
          })
          .catch((error) => {
            console.log(error);
          })
          .finally(() => {});
      }
    }
  }, [item.zxdbID]);

  if (!open) return null; // avoid rendering, if not open

  return (
    entry && (
      <ThemeProvider theme={theme}>
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
                  <Typography variant="h6">{entry.title}</Typography>
                  <Stack spacing={2}>
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
                  <Stack direction="row" spacing={4} sx={{ py: 4 }}>
                    {screens[0] && (
                      <Item elevation={4} sx={{ p: 2 }}>
                        <img src={`https://zxinfo.dk/media${screens[0].url}`} alt={screens[0].title}></img>
                        <br />
                        <Typography variant="caption">
                          {screens[0].type} (Release: {screens[0].release_seq})
                        </Typography>
                      </Item>
                    )}
                    {screens[1] && (
                      <Item elevation={4} sx={{ p: 2 }}>
                        <img src={`https://zxinfo.dk/media${screens[1].url}`} alt={screens[1].title}></img>
                        <br />
                        <Typography variant="caption">
                          {screens[1].type} (Release: {screens[1].release_seq})
                        </Typography>
                      </Item>
                    )}
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
                  {item.type === "snafmt" && <SNAFormat item={item}></SNAFormat>}
                  {item.type === "z80fmt" && <Z80Format item={item}></Z80Format>}
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
