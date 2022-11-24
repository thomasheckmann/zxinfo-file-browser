import { ThemeProvider } from "@emotion/react";
import { Box, Button, createTheme, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, Typography } from "@mui/material";

export default function FileDetails(props) {
  const { onClose, open, item } = props;

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
        <DialogTitle align="center" sx={{ color: "#ffffff", bgcolor: "#000000" }}>
          File info for {item.filename}
        </DialogTitle>
        <DialogContent>
          <Grid container component="main" sx={{ height: "100%" }}>
            <Grid item xs={false} sm={4} md={6} minHeight="70vh" sx={{ border: 1 }}>
              <Box
                sx={{
                  minHeight: "100%",
                  border: 1,
                  borderColor: "#00ff00",
                }}
              >
                <Typography variant="h6">Left side</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={8} md={6}>
              <Box
                sx={{
                  minHeight: "100%",
                  border: 1,
                  borderColor: "#ff0000",
                }}
              >
                <Typography variant="h6">Right side</Typography>
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
  );
}
