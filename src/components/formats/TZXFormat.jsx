import React from "react";
import { Alert, List, ListItem, ListItemText, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import PFormat from "./PFormat";

export default function TZXFormat(props) {
  const { item } = props;

  const printTapeBlock = (t) => {
    if (t.flag === "header") {
      if (t.type === "Program") {
        return (
          <React.Fragment>
            <Typography>
              Program: {t.name} {t.autostart < 32768 ? ` - LINE ${t.autostart}` : ""}, length: {t.len}, varstart: {t.varstart}
            </Typography>
          </React.Fragment>
        );
      } else if (t.type === "Code") {
        return (
          <React.Fragment>
            <Typography>
              Code: {t.name} - start: {t.startAddress}, length: {t.len}
            </Typography>
          </React.Fragment>
        );
      } else {
        return (
          <React.Fragment>
            <Typography>
              Header type: {t.type}, name: {t.name}, length: {t.len}, param 1: {t.param1}. param 2: {t.param2}
            </Typography>
          </React.Fragment>
        );
      }
    } else if (t.flag === "data") {
      return (
        <React.Fragment>
          <Typography>Data length: {t.data.length}</Typography>
        </React.Fragment>
      );
    }
  };

  const printTape = (t) => {
    switch (t.id) {
      case 0x10:
        return <div>{printTapeBlock(t.block)}</div>;
      case 0x11:
        return <div>{t.text}</div>;
      case 0x12:
        return <div>{t.text}</div>;
      case 0x13:
        return <div>{t.text}</div>;
      case 0x14:
        return <div>{t.text}</div>;
      case 0x19:
        return <div>{t.text}</div>;
      case 0x20:
        return <div>{t.data === 0 ? "Stop tape" : "Pause duration:" + t.data + " ms"}</div>;
      case 0x21:
        return <div>{t.text}</div>;
      case 0x22:
        return <div></div>;
      case 0x24:
        return <div>{t.text}</div>;
      case 0x25:
        return <div></div>;
      case 0x30:
        return (
          <div>
            {t.text} - length: {t.length}
          </div>
        );
      case 0x32:
        return (
          <List dense>
            {t.data.map((x, i) => (
              <ListItem>
                <ListItemText>
                  <b>{x.type}</b> - {x.text}
                </ListItemText>
              </ListItem>
            ))}
          </List>
        );
      case 0x33:
        return (
          <List dense>
            {t.hw.map((x, i) => (
              <ListItem>
                {" "}
                <ListItemText>{x}</ListItemText>
              </ListItem>
            ))}
          </List>
        );
      default:
        return <div>N/A</div>;
    }
  };

  return (
    <TableContainer component={Paper} sx={{ minWidth: 300 }}>
      <Table aria-label="TZX Details" size="small">
        <TableBody>
          {item.data.tape && item.data.tape.map((row, i) => (
            <TableRow key={i}>
              <TableCell component="th" scope="row">
                {i}: <b>{row.blockName}</b>
                {printTape(row)}
                {row.block &&
                  row.block.error &&
                  row.block.error.map((e, ii) => (
                    <Alert severity={e.type} key={ii}>
                      {e.message}
                    </Alert>
                  ))}
              </TableCell>
            </TableRow>
          ))}
          {item.data.zx81data && <PFormat item={item}></PFormat>}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
