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

import { Alert, Avatar, Card, CardContent, CardHeader, CardMedia, Chip, Stack, Tooltip, Typography } from "@mui/material";
import { red } from "@mui/material/colors";

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
    case "zip":
      return "ZIP";
    default:
      return t;
  }
}

class EntryCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entry: this.props.entry,
    };
  }

  render() {
    return (
      <Card raised elevation={5}>
        <CardHeader
          sx={{
            backgroundColor: this.state.entry.type === "zip" ? "#606060" : "#808080",
          }}
          avatar={
            <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
              <Typography variant="overline" display="block" gutterBottom>
                {formatType(this.state.entry.type)}
              </Typography>
            </Avatar>
          }
          title={
            <Tooltip title={this.state.entry.filename}>
              <Typography variant="subtitle2" noWrap>
                {this.state.entry.filename}
              </Typography>
            </Tooltip>
          }
          subheader={this.state.entry.subfilename}
        ></CardHeader>
        {this.state.entry.error ? <Alert severity="warning">{this.state.entry.error}</Alert> : ""}
        <CardMedia component="img" image={this.state.entry.scr} alt={this.state.entry.filename} />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div" noWrap>
            {this.state.entry.zxdbTitle ? this.state.entry.zxdbTitle : this.state.entry.filename}
          </Typography>
          <Stack direction="row" spacing={1}>
            {this.state.entry.version ? <Chip label={this.state.entry.version} /> : ""}
            {this.state.entry.hwmodel ? <Chip label={this.state.entry.hwmodel} /> : ""}
            {this.state.entry.zxdbID ? <Chip label={this.state.entry.zxdbID} variant="outlined" /> : ""}
          </Stack>
        </CardContent>
      </Card>
    );
  }
}

export default EntryCard;
