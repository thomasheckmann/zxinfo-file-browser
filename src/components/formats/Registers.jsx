import { Chip, Stack, TableCell, TableRow } from "@mui/material";
import React from "react";

export default function Registers(props) {
  const { regs } = props;

  const printVal = (x, y) => {
    return "0x" + x.toString(16).padStart(y, "0") + " (" + x + ")";
  };

  const printFlags = (x) => {
    return (
      <Stack direction="row" spacing={1}>
        <Chip label="S" size="small" variant={x & 0b10000000 ? "" : "outlined"} />
        <Chip label="Z" size="small" variant={x & 0b01000000 ? "" : "outlined"} />
        <Chip label="-" size="small" variant={x & 0b00100000 ? "" : "outlined"} />
        <Chip label="H" size="small" variant={x & 0b00010000 ? "" : "outlined"} />
        <Chip label="-" size="small" variant={x & 0b00001000 ? "" : "outlined"} />
        <Chip label="P/V" size="small" variant={x & 0b00000100 ? "" : "outlined"} />
        <Chip label="N" size="small" variant={x & 0b00000010 ? "" : "outlined"} />
        <Chip label="C" size="small" variant={x & 0b00000001 ? "" : "outlined"} />
      </Stack>
    );
  };

  return (
    <React.Fragment>
      <TableRow>
        <TableCell component="th" scope="row">
          AF
        </TableCell>
        <TableCell align="left">
          {printVal(regs.AF, 4)} Flag: {(regs.AF & 0xff).toString(2).padStart(8, "0")}
          {printFlags(regs.AF & 0xff)}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          BC
        </TableCell>
        <TableCell align="left">{printVal(regs.BC, 4)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          DE
        </TableCell>
        <TableCell align="left">{printVal(regs.DE, 4)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          HL
        </TableCell>
        <TableCell align="left">{printVal(regs.HL, 4)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          SP
        </TableCell>
        <TableCell align="left">{printVal(regs.SP, 4)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          IX
        </TableCell>
        <TableCell align="left">{printVal(regs.IX, 4)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          IY
        </TableCell>
        <TableCell align="left">{printVal(regs.IY, 4)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          I
        </TableCell>
        <TableCell align="left">{printVal(regs.I, 2)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          R
        </TableCell>
        <TableCell align="left">{printVal(regs.R, 2)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          AF'
        </TableCell>
        <TableCell align="left">
          {printVal(regs.AFalt, 4)} Flag: {(regs.AFalt & 0xff).toString(2).padStart(8, "0")}
          {printFlags(regs.AFalt & 0xff)}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          BC'
        </TableCell>
        <TableCell align="left">{printVal(regs.BCalt, 4)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          DE'
        </TableCell>
        <TableCell align="left">{printVal(regs.DEalt, 4)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell component="th" scope="row">
          HL'
        </TableCell>
        <TableCell align="left">{printVal(regs.HLalt, 4)}</TableCell>
      </TableRow>
      <TableRow>
            <TableCell component="th" scope="row">
              Interrupt mode: {regs.INTmode} / {regs.INT & 0b00000010 ? "EI" : "DI"}
            </TableCell>
            <TableCell align="left">
              Border: {regs.border} ({regs.border & 0b00000111})
            </TableCell>
          </TableRow>
    </React.Fragment>
  );
}
