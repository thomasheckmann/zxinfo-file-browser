import { Box, Button, CssBaseline, Divider, Grid, Paper, Typography } from "@mui/material";
import React from "react";

class IntroText extends React.Component {
  render() {
    const invokeOpenFolderParent = (event) => {
      this.props.parentCallback(event);
    };

    return (
      <Grid container component="main" sx={{ height: "100%" }}>
        <CssBaseline />
        <Grid
          item
          xs={false}
          sm={4}
          md={6}
          sx={{
            backgroundImage: "url(https://source.unsplash.com/random)",
            backgroundRepeat: "no-repeat",
            backgroundColor: (t) => (t.palette.mode === "light" ? t.palette.grey[50] : t.palette.grey[900]),
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <Grid item xs={12} sm={8} md={6} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 1,
              mx: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "left",
            }}
          >
            <Typography variant="h4">ZXInfo - File - Browser</Typography>
            <Divider />
            <Typography variant="body1">
              The easy ZX Spectrum file browser, scans local files and gives a nice overview of all your emulator file
              spread across your harddrive. The program detects known formats, generates a nice preview as found in the
              file and also detects if the file is already known by ZXInfo API. Currently the program supports the
              following formats:
            </Typography>
            <ul>
              <li>snapshot formats, .sna - 48K and 128K formats & .z80 - Version 1, 2 & 3</li>
              <li>tape formats, .tap & .tzx</li>
              <li>disk formats, .dsk, .trd & .scl</li>
              <li>microdrive .mdr</li>
              <li>zx81 .p and .tzx</li>
            </ul>
            <Typography variant="h4">Features</Typography>
            <Divider />
            <ul>
              <li>Scan local files</li>
              <li>Read details from various formats: SNA, Z80, TAP, TZX, MDR, DSK, TRD, SCL & P</li>
              <li>Integrates with ZXDB using ZXInfo.dk & ZXInfo API, to get real title and SCR for preview</li>
              <li>Favorites, keep track of your favorite games</li>
              <li>Filter files shown by formats</li>
              <li>Sort by folder name and file name</li>
              <li>Quick access to folders</li>
              <li>Future features</li>
              <ul>
                <li>[Identify duplicated files, based on hash]</li>
                <li>[Show multiple entries for same title]</li>
              </ul>
            </ul>
            <Typography variant="body1">
              Start scanning now ...
              <Button variant="contained" onClick={invokeOpenFolderParent}>
                Open Folder
              </Button>
            </Typography>
          </Box>
        </Grid>
      </Grid>
    );
  }
}
export default IntroText;
