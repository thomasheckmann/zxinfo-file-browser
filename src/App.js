/**
 *
 * Creates general layout
 *
 */
import React from "react";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";

import FolderView from "./components/folderview.jsx";

//import "./App.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#000000",
    },
    secondary: {
      main: "#c0c0c0",
    },
  },
});

function App() {
  const [startFolder, setStartFolder] = React.useState({ folders: [] });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            color="inherit"
            sx={{ mr: 2 }}
            aria-label="Open Folder"
            component="label"
            onClick={async () => {
              const foldersWithFiles = await window.electronAPI.openFolder();
              setStartFolder({ folders: foldersWithFiles });
            }}
          >
            <FolderOpenIcon />
          </IconButton>
          <Typography variant="h6" color="inherit" component="div">
            ZXInfo Explorer
          </Typography>
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Container>
        <Box sx={{ my: 2 }}>
          {/* MAIN CONTENT */}
          <FolderView folders={startFolder.folders} />
          {/* MAIN CONTENT */}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
