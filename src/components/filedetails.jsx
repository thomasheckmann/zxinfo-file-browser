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
import Grid from "@mui/material/Unstable_Grid2";
import axios from "axios";

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
      return "?";
  }
}

/**
 * this.props.filename
 */
class FileDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
    };
  }

  componentDidMount() {
    window.electronAPI.loadFile(this.props.filename).then((res) => {
      let fileItems = [];
      res.forEach((data) => {
        const dataURL = `https://api.zxinfo.dk/v3/filecheck/${data.sha512}`;
        axios
          .get(dataURL)
          .then((response) => {
            const item = data;
            item.zxdbID = response.data.entry_id;
            item.zxdbTitle = response.data.title;

            fileItems.push(item);
            this.setState({ data: fileItems });
          })
          .catch((error) => {
            console.error(`API not found: ${data.sha512}`);
            fileItems.push(data);
            this.setState({ data: fileItems });
          })
          .finally(() => {});
      });
    });
  }

  render() {
    return (
      <React.Fragment>
        {this.state.data.map((entry) => (
          <Grid xs={12} sm={6} lg={4} key={entry.filename + entry.subfilename}>
            <Card raised elevation={5}>
              <CardHeader
                sx={{
                  backgroundColor: entry.type === "zip" ? "#606060" : "#808080",
                }}
                avatar={
                  <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
                    <Typography variant="overline" display="block" gutterBottom>
                      {formatType(entry.type)}
                    </Typography>
                  </Avatar>
                }
                title={
                  <Tooltip title={entry.filename}>
                    <Typography variant="subtitle2" noWrap>
                      {entry.filename}
                    </Typography>
                  </Tooltip>
                }
                subheader={entry.subfilename}
              ></CardHeader>
              {entry.error ? (
                <Alert severity="warning">{entry.error}</Alert>
              ) : (
                ""
              )}
              <CardMedia
                component="img"
                image={entry.scr}
                alt={entry.filename}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div" noWrap>
                  {entry.zxdbTitle ? entry.zxdbTitle : entry.filename}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {entry.version ? <Chip label={entry.version} /> : ""}
                  {entry.hwmodel ? <Chip label={entry.hwmodel} /> : ""}
                  {entry.zxdbID ? (
                    <Chip label={entry.zxdbID} variant="outlined" />
                  ) : (
                    ""
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </React.Fragment>
    );
  }
}

export default FileDetails;
