import { Alert, Button, createTheme, Dialog, DialogActions, DialogContent, DialogTitle, ThemeProvider } from "@mui/material";
import { Box, Stack } from "@mui/system";
import React from "react";

export default function FileErrorDialog(props) {
  const { open, errors, onClose } = props;

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

  return (
    <ThemeProvider theme={theme}>
      <Dialog open={open} scroll={"paper"}>
        <DialogTitle align="center" sx={{ color: "#ffffff", bgcolor: "#000000" }}>
          Issues found with this file
        </DialogTitle>
        <DialogContent dividers={true} sx={{ p: 0, m: 0 }}>
          <Stack sx={{ width: "100%" }} spacing={2}>
            <Box textAlign="center" sx={{ width: "100%" }}>
              {errors && errors.map((e, i) => (
                <Alert severity={e.type} key={i}>
                  {e.message}
                </Alert>
              ))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Box textAlign="center" sx={{ p: 4 }}>
            <Button variant="contained" onClick={() => handleClose()}>
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
