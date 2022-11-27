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
          {item.data.is128K && (
            <TableRow>
              <TableCell component="th" scope="row">
                Port 0x7ffd: {item.data.port_0x7ffd} ({item.data.port_0x7ffd.toString(2).padStart(8, "0")})
              </TableCell>
              <TableCell align="left">
                RAM page 0xc000: {item.data.port_0x7ffd & 0b00000111}, ROM: {item.data.port_0x7ffd & 0b00010000 ? "128K EDITOR" : "48K BASIC"}
                <br />
                Screen: {item.data.port_0x7ffd & 0b00001000 ? "Normal" : "Shadow"}, Paging: {item.data.port_0x7ffd & 0b00100000 ? "Locked" : "Normal"}
              </TableCell>
            </TableRow>
          )}
          {(item.version === "Z80 v2" || item.version === "Z80 v3") && (
            <React.Fragment>
              <TableRow>
                <TableCell component="th" scope="row">
                  Interface 1 ROM paged
                </TableCell>
                <TableCell align="left">{item.data.if1_paged_in ? "Yes" : "No"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Flags: {item.data.flag2.toString(2).padStart(8, "0")}
                  <br />
                  (Used by Z80 emulator)
                </TableCell>
                <TableCell align="left" valign="top">
                  {item.data.flag2 & 0b00000001 ? "R emulation, " : ""}
                  {item.data.flag2 & 0b00000010 ? "LDIR emulation, " : ""}
                  {item.data.flag2 & 0b00000100 ? "AY in use, " : ""}
                  {item.data.flag2 & 0b01000000 ? "Fuller Audio Box, " : ""}
                  {item.data.flag2 & 0b10000000 ? "Modify hardware, " : ""}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  MGT Rom paged
                </TableCell>
                <TableCell align="left">{item.data.mgt_rom ? "Yes" : "No"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Multiface Rom paged
                </TableCell>
                <TableCell align="left">{item.data.multiface_rom ? "Yes" : "No"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Adress 0-8191
                </TableCell>
                <TableCell align="left">{item.data.rom_ram_8klow ? "ROM" : "RAM"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Adress 8192-16383
                </TableCell>
                <TableCell align="left">{item.data.rom_ram_8khigh ? "ROM" : "RAM"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  MGT type
                </TableCell>
                <TableCell align="left">{item.data.mgt_type === 0 ? "Disciple+Epson" : "Disciple+HP,16=Plus D"}</TableCell>
              </TableRow>
            </React.Fragment>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
