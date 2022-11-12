/**
 *
 * entry = {
 *      filename:
 *      subfilename: <only used if entry is within ZIP file>
 *      version: "SNA"
 *      type: "snafmt"
 *      sha512: <used to perform lookup in ZXInfo API
 *      src: <base64hex image>
 *      error: <error text>
 * }
 *
 *
 */

import React from "react";

import { Alert, Avatar, Card, CardContent, CardHeader, CardMedia, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { red } from "@mui/material/colors";
import axios from "axios";
import InsertLinkOutlinedIcon from "@mui/icons-material/InsertLinkOutlined";

var dummyObject = {
  filename: "myfile.zip",
  subfilename: "myfileinzip.sna",
  version: "v",
  type: "snafmt",
  sha512: null,
  scr: "./images/no_image.png",
  error: null,
};

function formatType(t) {
  switch (t) {
    case "snafmt":
      return "SNA";
    case "z80fmt":
      return "Z80";
    case "tapfmt":
      return "TAP";
    case "tzxfmt":
      return "TZX";
      case "dskfmt":
        return "DSK";
      case "zip":
      return "ZIP";
    default:
      return t;
  }
}

const openLink = (id) => {
  window.electronAPI.openZXINFODetail(id).then((res) => {});
};

const openFolderFile = (name) => {
  window.electronAPI.locateFileAndFolder(name).then((res) => {});
};

const toggleFavorite = (event) => {
  console.log("toogleFavorite: " + event.value);
};

class EntryCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entry: this.props.entry,
    };
  }

  componentDidMount() {
    const dataURL = `https://api.zxinfo.dk/v3/filecheck/${this.state.entry.sha512}`;
    axios
      .get(dataURL)
      .then((response) => {
        let item = this.state.entry;
        item.zxdbID = response.data.entry_id;
        item.zxdbTitle = response.data.title;
        this.setState(item);
      })
      .catch((error) => {})
      .finally(() => {});
  }

  render() {
    return (
      <Card raised elevation={5}>
        <CardHeader
          sx={{
            backgroundColor: this.state.entry.type === "zip" ? "#606060" : "#808080",
            display: "flex",
            overflow: "hidden",
            "& .MuiCardHeader-content": {
              overflow: "hidden",
            },
          }}
          avatar={
            <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
              <Typography variant="overline" display="block" gutterBottom>
                {formatType(this.state.entry.type)}
              </Typography>
            </Avatar>
          }
          action={
            <Tooltip title="Locate file">
              <IconButton aria-label="Locate file" onClick={(name) => openFolderFile(this.state.entry.filepath)}>
                <InsertLinkOutlinedIcon />
              </IconButton>
            </Tooltip>
          }
          title={
            <Tooltip title={this.state.entry.filename}>
              <Typography variant="subtitle" noWrap gutterBottom>
                {this.state.entry.filename}
              </Typography>
            </Tooltip>
          }
          titleTypographyProps={{ noWrap: true }}
          subheaderTypographyProps={{ noWrap: true }}
          subheader={this.state.entry.subfilename}
        />
        {this.state.entry.error ? <Alert severity="warning">{this.state.entry.error}</Alert> : ""}
        <CardMedia component="img" image={this.state.entry.scr} alt={this.state.entry.filename} />
        <CardContent>
          <Typography gutterBottom variant="subtitle1" component="div" noWrap>
            {this.state.entry.zxdbTitle ? this.state.entry.zxdbTitle : this.state.entry.filename}
          </Typography>
          <Typography gutterBottom variant="subtitle2" component="div" noWrap>
            {this.state.entry.text}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {this.state.entry.version && <Chip label={this.state.entry.version} />}
            {this.state.entry.hwmodel && <Chip label={this.state.entry.hwmodel} />}
            {this.state.entry.zxdbID && <Chip label={this.state.entry.zxdbID} variant="outlined" onClick={(id) => openLink(this.state.entry.zxdbID)} />}
          </Stack>
        </CardContent>
      </Card>
    );
  }
}

export default EntryCard;
