/**
 *
 * Mapping:
 * sha512 => {zxdbid, [filepath]}
 *
 *
 */

import { IconButton, InputAdornment, Snackbar, TextField } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { mylog } from "../../App";
import { ZXInfoSettingsCtx } from "../ZXInfoSettings";
import LaunchTwoToneIcon from "@mui/icons-material/LaunchTwoTone";

export default function ZXdbID({ entry }) {
  const [customZXDBid, setCustomZXDBid] = useState(null);
  const [appSettings, setAppSettings] = useContext(ZXInfoSettingsCtx);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  // Map (sha512 -> zxdbid)
  const handleZXdbID = async (event) => {
    var map = appSettings.zxdbIDs;

    if (event.target.value.length === 0) {
      mylog("ZXdbID", "handleZXdbID", `empty, remove from map...`);
      if (map.size === 0) {
        return;
      }
      const mapEntry = map.get(entry.sha512);
      if (mapEntry) {
        // remove filepath from array
        mylog("ZXdbID", "handleZXdbID", `empty, remove from array...`);
        const newArr = mapEntry.files.filter((object) => {
          return object !== entry.filepath;
        });

        if (newArr.length === 0) {
          mylog("ZXdbID", "handleZXdbID", `empty, no more files in array, remove from map`);
          map.delete(entry.sha512);
        } else {
          map.set(entry.sha512, { zxdbid: mapEntry.zxdbid, files: newArr });
        }
      }
    } else if (map.size === 0) {
      // first time...
      mylog("ZXdbID", "handleZXdbID", `first time, creating the map`);
      mylog("ZXdbID", "handleZXdbID", `hash: ${entry.sha512}, file: ${entry.filepath}`);
      map = new Map();
      map.set(entry.sha512, { zxdbid: event.target.value, files: [entry.filepath] });
    } else {
      const mapEntry = map.get(entry.sha512);
      if (mapEntry) {
        // zxdb id entry exists, check if its a new filename
        mylog("ZXdbID", "handleZXdbID", `${mapEntry.zxdbid} - exists in map...`);
        const files = mapEntry.files;
        if (files.includes(entry.filepath)) {
          mylog("ZXdbID", "handleZXdbID", `${entry.filepath} - exists in list, updating `);
          map.set(entry.sha512, { zxdbid: event.target.value, files: files });
        } else {
          mylog("ZXdbID", "handleZXdbID", `${entry.filepath} - new, add to list`);
          map.set(entry.sha512, { zxdbid: event.target.value, files: [...files, entry.filepath] });
        }
      } else {
        // new (zxdb id) entry
        mylog("ZXdbID", "handleZXdbID", `${event.target.value} - new entry to map`);
        map.set(entry.sha512, { zxdbid: event.target.value, files: [entry.filepath] });
      }
    }

    setAppSettings((appSettings) => ({ ...appSettings, zxdbIDs: map }));
    setCustomZXDBid(event.target.value);
    var obj = Object.fromEntries(map);
    var jsonString = JSON.stringify(obj);
    window.electronAPI.setZXDBs("zxdb-id-store", jsonString);
    handleClick();
  };

  const handleInputChange = (event) => {
    setCustomZXDBid(event.target.value);
  };

  const openLink = () => {
    window.electronAPI.openZXINFODetail(customZXDBid).then((res) => {});
  };

  useEffect(() => {
    mylog("ZXdbID", "useEffect", `init: ${entry.sha512}`);
    const customId = appSettings.zxdbIDs.get(entry.sha512);
    if (customId) {
      setCustomZXDBid(customId.zxdbid);
      mylog("ZXdbID", "useEffect", `found ZXDB ID: ${customId.zxdbid}`);
    }
  }, [entry.sha512, appSettings.zxdbIDs]);

  return (
    <React.Fragment>
      <Snackbar open={open} autoHideDuration={2000} onClose={handleClose} message={`ZXDB ID - ${customZXDBid} saved`} />
      <TextField
        label="ZXDB ID"
        id="outlined-size-small"
        size="small"
        value={customZXDBid}
        type="number"
        InputProps={{
          endAdornment: customZXDBid && (
            <InputAdornment position="end">
              <IconButton aria-label="More details at ZXInfo.dk" onClick={openLink} edge="end">
                <LaunchTwoToneIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        onChange={handleInputChange}
        onKeyPress={(ev) => {
          if (ev.key === "Enter") {
            handleZXdbID(ev);
            // Do code here
            ev.preventDefault();
          }
        }}
      />{" "}
    </React.Fragment>
  );
}
