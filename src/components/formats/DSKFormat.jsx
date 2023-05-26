import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

export default function DSKFormat(props) {
  const { item } = props;

  return (
    item.data_ext.entries && <TableContainer component={Paper} sx={{ minWidth: 300 }}>
      <Table aria-label="Disk content" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Filename</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>read only</TableCell>
            <TableCell>system/hidden</TableCell>
            <TableCell>archived</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...item.data_ext.entries.values()].map((entry, i) => (
            <TableRow key={i}>
              <TableCell component="th" scope="row">
                <Typography variant="button" display="block" gutterBottom>
                  {entry.ua}:{entry.filename.trim()}
                  {entry.ext.trim().length > 0 ? "." + entry.ext.trim() : ""}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="button" display="block" gutterBottom>
                  {entry.file_size}K
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="button" display="block" gutterBottom>
                  {entry.read_only && "RO"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="button" display="block" gutterBottom>
                  {entry.hidden && "SYS"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="button" display="block" gutterBottom>
                  {entry.archived && "ARC"}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
