import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import Registers from "./Registers";

export default function SNAFormat(props) {
  const { item } = props;

  const printVal = (x, y) => {
    return "0x" + x.toString(16).padStart(y, "0") + " (" + x + ")";
  };

  return (
    <TableContainer component={Paper} sx={{ minWidth: 300 }}>
      <Table aria-label="Snapshot registers" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Register</TableCell>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {item.data && <Registers regs={item.data}></Registers>}
          {item.data.is128K && (
            <React.Fragment>
              <TableRow>
                <TableCell component="th" scope="row">
                  PC
                </TableCell>
                <TableCell align="left">{printVal(item.data.PC, 4)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Port 0x7ffd: {item.data.port_0x7ffd} ({item.data.port_0x7ffd.toString(2).padStart(8, "0")})
                  <br />
                  RAM page 0xc000: {item.data.port_0x7ffd & 0b00000111}, ROM: {item.data.port_0x7ffd & 0b00010000 ? "128K EDITOR" : "48K BASIC"}
                  <br />
                  Screen: {item.data.port_0x7ffd & 0b00001000 ? "Normal" : "Shadow"}, Paging: {item.data.port_0x7ffd & 0b00100000 ? "Locked" : "Normal"}
                </TableCell>
                <TableCell align="left">TR-DOS: {item.data.TRDOS ? "Yes" : "No"}</TableCell>
              </TableRow>
            </React.Fragment>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
