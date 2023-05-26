import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

export default function MDRFormat(props) {
  const { item } = props;

  return (
    item.data_ext.catalog && (
      <React.Fragment>
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
            {[...item.data_ext.catalog.values()].map((entry, i) => (
              <TableRow key={i}>
                <TableCell component="th" scope="row">
                  <Typography variant="button" display="block" gutterBottom>
                    {entry.filename}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="button" display="block" gutterBottom>
                    {entry.size} bytes
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer></React.Fragment>
    )
  );
}
