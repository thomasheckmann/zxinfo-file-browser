import React, { useEffect, useState } from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";

import { isDev } from "../../App";

export default function PFormat(props) {
  const { item } = props;
  const [listningScr, setListningScr] = useState();

  useEffect(() => {
    window.electronAPI.createZX81List(item.data.zx81data).then((img) => {
      setListningScr(img);
    }) ;

  }, [item]);

  return (
    <TableContainer component={Paper} sx={{ minWidth: 300 }}>
      <Table aria-label="Snapshot registers" size="small">
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row">
              {item.text}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Full BASIC listning
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <img src={listningScr} alt="BASIC List"/>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}