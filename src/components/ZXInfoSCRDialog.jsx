/**
 *
 * https://zxinfo.dk/media/zxscreens/0002204/HadesNebula-load.png
 * https://zxinfo.dk/media/pub/sinclair/screens/in-game/a/Academy.gif
 */

import {
  Box,
  Button,
  createTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  ThemeProvider,
} from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import { isDev } from "../App";
import { Container } from "@mui/system";

export default function ZXInfoSCRDialog(props) {
  const { onClose, selectedValue, open, zxdb } = props;
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

  const handleClose = () => {
    onClose(selectedValue);
  };

  const handleListItemClick = (value) => {
    onClose(value);
  };

  useEffect(() => {
    if (open) {
      const dataURL = `https://api.zxinfo.dk/v3/games/${zxdb.zxdbID}?mode=tiny`;
      if (isDev) console.log(`API: ${dataURL}`);
      axios
        .get(dataURL)
        .then((response) => {
          let item = response.data._source.screens;
          var imageData = [];
          for (var i = 0; i < item.length; i++) {
            const e = item[i];
            var image = {};
            if (e.title) {
            } else {
              image.title = `${e.entry_id}`;
              image.type = `${e.type}`;
              image.release = e.release_seq;
              image.url = `https://zxinfo.dk/media${e.url}`;
              imageData.push(image);
            }
          }
          setScreens(imageData);
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {});
    }
  }, [zxdb]);

  return (
    <ThemeProvider theme={theme}>
      <Dialog onClose={handleClose} open={open} scroll={"paper"}>
        <DialogTitle align="center" sx={{color: "#ffffff", bgcolor: "#000000"}}>
          Select primary screen for
          <br />
          {zxdb.title}
        </DialogTitle>
        <DialogContent dividers={true}>
          <Container>
            <ImageList>
              {screens.map((item) => (
                <ImageListItem key={item.url} onClick={() => handleListItemClick(item.url)}>
                  <img width={256} src={`${item.url}`} alt={item.title} loading="lazy" />
                  <ImageListItemBar title={item.title} subtitle={<span>{item.release}: {item.type}</span>} position="below" />
                </ImageListItem>
              ))}
            </ImageList>
          </Container>
        </DialogContent>
        <DialogActions>
          <Box textAlign="center" sx={{ p: 4 }}>
            <Button variant="contained" onClick={() => handleListItemClick(null)}>Restore</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
