import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import Registers from "./Registers";

export default function Z80Format(props) {
  const { item } = props;

  const printVal = (x, y) => {
    return "0x" + x.toString(16).padStart(y, "0") + " (" + x + ")";
  };

  const videoSync = (x) => {
    const sync = (x >> 4) & 0b00001111;
    if (sync === 0 || sync === 2) return "Normal";
    if (sync === 1) return "High";
    if (sync === 3) return "Low";
  };

  const joystick = (x, v) => {
    const joystick = (x >> 6) & 0b00000011;
    switch (joystick) {
      case 0:
        return "Cursor/Protek/AGF joystick";
        break;
      case 1:
        return "Kempston joystick";
        break;
      case 2:
        if (v === "Z80 v3") {
          return "User defined";
        } else {
          return "Sinclair 2 Left joystick";
        }
        break;
      case 3:
        return "Sinclair 2 Right joystick";
        break;
      default:
        break;
    }
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
          <Registers regs={item.data}></Registers>
          <TableRow>
            <TableCell component="th" scope="row">
              PC
            </TableCell>
            <TableCell align="left">{printVal(item.data.PC, 4)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Basic SamRom: {item.data.SAMROM ? "Yes" : " No"}
            </TableCell>
            <TableCell align="left">compressed: {item.data.compressed ? "Yes" : "No"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Issue 2: {item.data.flag & 0b00000100 ? "Yes" : " No"}
            </TableCell>
            <TableCell align="left">Double int. freq: {item.data.flag & 0b00001000 ? "Yes" : " No"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Video sync: {videoSync(item.data.flag)}
            </TableCell>
            <TableCell align="left">Joystick: {joystick(item.data.flag, item.version)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
