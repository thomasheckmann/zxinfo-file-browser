import {
  Box,
  Button,
  CssBaseline,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import React from "react";
class IntroText extends React.Component {
  render() {
    return (
      <React.Fragment>
        <Grid container component="main" sx={{ height: "100vh" }}>
          <CssBaseline />
          <Grid
            item
            xs={false}
            sm={4}
            md={6}
            sx={{
              backgroundImage: "url(https://source.unsplash.com/random)",
              backgroundRepeat: "no-repeat",
              backgroundColor: (t) =>
                t.palette.mode === "light"
                  ? t.palette.grey[50]
                  : t.palette.grey[900],
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <Grid
            item
            xs={12}
            sm={8}
            md={6}
            component={Paper}
            elevation={6}
            square
          >
            <Box
              sx={{
                my: 8,
                mx: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
              }}
            >
              <Typography variant="h4">ZXInfo - Explorer</Typography>
              <Divider />
              <Typography variant="body1">
                The easy ZX Spectrum file manager, scans local files and gives a
                nice overview of all your emulator file spread across your
                harddrive. The program detects known formats, generates a nice
                preview as found in the file and also detects if the file is
                already known by ZXInfo API. Currently the program supports the
                following formats:
              </Typography>
              <ul>
                <li>.sna - 48K and 128K formats</li>
                <li>.z80 - Version 1, 2 & 3</li>
              </ul>
              In the future, planing support for:
              <ul>
                <li>.tap</li>
              </ul>
              <Typography variant="h4">Features</Typography>
              <Divider />
              <ul>
                <li>Scan local files</li>
                <li>Non-Destructive - original files won't be touched</li>
                <li>Read various formats: SNA, Z80, (TAP...)</li>
                <li>Integrates with ZXDB using ZXInfo API</li>
                <li>Favorites</li>
                <li>Browse by ....</li>
              </ul>
              <Typography variant="body1">
                Start scanning now ...
                <Button variant="contained">Open Folder</Button>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}
export default IntroText;
