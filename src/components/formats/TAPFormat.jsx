import React from "react";
import { Alert, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";

export default function TAPFormat(props) {
  const { item } = props;

  const printTape = (t) => {
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
            <Typography>Header type: {t.type}, name: {t.name}, length: {t.len}, param 1: {t.param1}. param 2: {t.param2}</Typography>
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

  return (
    <TableContainer component={Paper} sx={{ minWidth: 300 }}>
      <Table aria-label="Snapshot registers" size="small">
        <TableBody>
          {item.data.tape.map((row, i) => (
            <TableRow key={i}>
              <TableCell component="th" scope="row">
                {i}: <b>{row.flag}</b>
                <br />
                {printTape(row)}
                {row.error.map((e, ii) => (
                  <Alert severity={e.type} key={ii}>
                    {e.message}
                  </Alert>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
