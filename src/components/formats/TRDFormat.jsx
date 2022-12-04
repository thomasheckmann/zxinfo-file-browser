import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

export default function TRDFormat(props) {
  const { item } = props;
 
  return (
    item.diskdata.dir_info && <React.Fragment>
    <Typography variant="button" display="block" gutterBottom>
    {item.text}
  </Typography>
<TableContainer component={Paper} sx={{ minWidth: 300 }}>
      <Table aria-label="Disk content" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Filename</TableCell>
            <TableCell>Size</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...item.diskdata.dir_info.values()].map((entry, i) => (
            <TableRow key={i}>
              <TableCell component="th" scope="row">
                <Typography variant="button" display="block" gutterBottom>
                  {entry.filename.trim()}
                  {entry.ext.trim().length > 0 ? "." + entry.ext.trim() : ""}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="button" display="block" gutterBottom>
                  {entry.file_len_sectors} sector(s)
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer></React.Fragment>
  );
}
