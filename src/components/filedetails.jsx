import {
  Alert,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Chip,
  Tooltip,
  Typography,
} from "@mui/material";
import { red } from "@mui/material/colors";
import { Stack } from "@mui/system";
import React from "react";

function formatType(t) {
  if (t === "snafmt") return "SNA";
  if (t === "z80fmt") return "Z80";
  if (t === "tapfmt") return "TAP";
  return "?";
}

/**
 * this.props.filename
 */
class FileDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filename: null,
      type: null,
      version: null,
      hwmodel: null,
      zxdbID: null,
      zxdbTitle: null,
      data: [],
      scr: "https://zxinfo.dk/media/images/placeholder.png",
      error: null,
    };
  }

  componentDidMount() {
    window.electronAPI.loadFile(this.props.filename).then((res) => {
      this.setState({
        filename: res.filename,
        type: res.type,
        version: res.version,
        hwmodel: res.hwmodel,
        zxdbID: res.zxdbID,
        zxdbTitle: res.zxdbTitle,
        data: res.data,
        scr: res.scr,
        error: res.error,
      });
    });
  }

  render() {
    return (
      <Card /*sx={{ maxWidth: 320 }}*/>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
              <Typography variant="overline" display="block" gutterBottom>
                {formatType(this.state.type)}
              </Typography>
            </Avatar>
          }
          title={<Tooltip title={this.state.filename}>
            <Typography variant="subtitle2" noWrap>
              {this.state.filename}
            </Typography>
          </Tooltip>}
        ></CardHeader>
        {this.state.error ? (
          <Alert severity="warning">{this.state.error}</Alert>
        ) : (
          ""
        )}
        <CardMedia
          component="img"
          image={this.state.scr}
          /*"https://zxinfo.dk/media/zxscreens/0002259/HeadOverHeels-load.png"*/
          alt={this.state.filename}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div" noWrap>
            {this.state.zxdbTitle ? this.state.zxdbTitle : this.state.filename}
          </Typography>
          <Stack direction="row" spacing={1}>
            {this.state.version ? <Chip label={this.state.version} /> : ""}
            {this.state.hwmodel ? <Chip label={this.state.hwmodel} /> : ""}
            {this.state.zxdbID ? (
              <Chip label={this.state.zxdbID} variant="outlined" />
            ) : (
              ""
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }
}

export default FileDetails;
