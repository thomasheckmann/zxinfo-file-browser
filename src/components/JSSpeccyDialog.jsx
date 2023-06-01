import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, Typography, createTheme } from "@mui/material";
import { useEffect } from "react";
import { ThemeProvider } from "styled-components";
import JSSpeccy from "./JSSpeccy";

import { mylog } from "../App";

export default function JSSpeccyDialog(props) {
  const { open, onClose, item } = props;

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
    mylog("JSSpeccyDialog", "useEffect", `${item}`);
  }, [item]);

  return (
    <ThemeProvider theme={theme}>
      <Dialog
        open={open}
        scroll={"paper"}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: "80vh",
          },
        }}
      >
        <DialogTitle align="center" sx={{ color: "#ffffff", bgcolor: "#000000" }}>
          JSSpeccy 3 - by Matt Westcott
        </DialogTitle>
        <DialogContent dividers={true} sx={{ p: 0, m: 0 }}>
          <Container style={{ display: "flex", justifyContent: "center" }}>
            {item.zxdbTitle && (
              <Typography variant="subtitle2" display="block" gutterBottom>
                {item.zxdbTitle} - ({item.machinetype})
              </Typography>
            )}
            {!item.zxdbTitle && (
              <Typography variant="subtitle2" display="block" gutterBottom>
                {item.filename} - ZX-Spectrum ({item.hwmodel})
              </Typography>
            )}
          </Container>
          <JSSpeccy
            fileItem={{
              file: item.filepath,
              subfilename: item.subfilename,
              hwmodel: item.hwmodel,
              machinetype: item.machinetype,
              type: item.type,
              comments: item.comments,
            }}
          ></JSSpeccy>
        </DialogContent>
        <DialogActions>
          <Box textAlign="center" sx={{ p: 0 }}>
            <Button variant="contained" onClick={() => handleClose()}>
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
