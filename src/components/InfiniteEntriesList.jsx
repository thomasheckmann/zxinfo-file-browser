/**
 *
 * props.files - array with filenames, already filtered and sorted, to be displayed as InfinitiveList
 *
 * Based on: https://github.com/ankeetmaini/react-infinite-scroll-component
 */

import React, { useEffect, useState } from "react";
import { useRef } from "react";
import { Box, Container, createTheme, LinearProgress, Paper, useMediaQuery } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import styled from "@emotion/styled";
import InfiniteScroll from "react-infinite-scroll-component";
import { useIsVisible } from "react-is-visible";
import EntryCard from "./EntryCard";
import { useContext } from "react";
import { ZXInfoSettingsCtx } from "../common/ZXInfoSettings";
import { mylog } from "../App";

const ItemEnd = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#008000",
  ...theme.typography.button,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.primary,
}));

export default function InfiniteEntriesList(props) {
  const [appSettings] = useContext(ZXInfoSettingsCtx);
  const [infSettings, setInfSettings] = useState({ items: [], hasMore: true, index: 0 });

  const [maxSize, setMaxSize] = useState(8); // number of entries to fetch at a time
  const [visibleHeight, setVisibleHeight] = useState(Math.round(window.innerHeight * 0.75));

  const nodeRef = useRef();
  const isVisible = useIsVisible(nodeRef);

  const theme = createTheme();

  /**
   * xs, sm, md, lg, xl
   * @returns
   */
  const greaterThanLG = useMediaQuery(theme.breakpoints.up("xl"));
  const lgTOxl = useMediaQuery(theme.breakpoints.between("lg", "xl"));
  const mdTOlg = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const smTOmd = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const lessThanSM = useMediaQuery(theme.breakpoints.down("sm"));

  function getRowSize() {
    if (greaterThanLG) {
      return 4; // LG
    } else if (lgTOxl) {
      return 4; // XL
    } else if (mdTOlg) {
      return 3; // MD
    } else if (smTOmd) {
      return 2; // SM
    } else if (lessThanSM) {
      return 1; // XS
    }
  }

  const fetchMoreData = async () => {
    mylog("InfiniteEntriesList", "fetchMoreData", `no. of files: ${props.files.length}, index: ${infSettings.index} - ${props.foldername}`);
    var itemsToAdd = [];
    var newIndex;

    for (newIndex = infSettings.index; newIndex < props.files.length && itemsToAdd.length < maxSize; newIndex++) {
      const result = await window.electronAPI.loadFile(props.files[newIndex], true);
      if (result) {
        mylog("InfiniteEntriesList", "fetchMoreData", `${props.files[newIndex]} - contains ${result.length} file(s), hideZip: ${appSettings.hideZip}`);
        result.forEach(function (entry) {
          if (appSettings.hideZip && entry.filename.toLowerCase().endsWith("zip") && !entry.subfilename) {
            mylog("InfiniteEntriesList", "fetchMoreData", `removing ZIP ${entry.filename} from list - ${props.foldername}`);
          } else {
            itemsToAdd.push(entry);
          }
        });
      } else {
        mylog("InfiniteEntriesList", "fetchMoreData", `File NOT found: ${props.files[newIndex]}`);
      }
    }
    if (newIndex >= props.files.length) {
      if ([...infSettings.items, ...itemsToAdd].length === 0) {
        mylog("InfiniteEntriesList", "fetchMoreData", `nothing to show, adjusting element size...`);
        setVisibleHeight(45); // size of end message only
      }
      setInfSettings((infSettings) => ({ ...infSettings, items: [...infSettings.items, ...itemsToAdd], hasMore: false, index: newIndex }));
    } else {
      setInfSettings((infSettings) => ({ ...infSettings, items: [...infSettings.items, ...itemsToAdd], hasMore: true, index: newIndex }));
    }
  };

  useEffect(() => {
    mylog(
      "InfiniteEntriesList",
      "useEffect",
      `visible: ${isVisible} (${props.foldername}), no of files: ${props.files.length}, index: ${infSettings.index}, hide: ${appSettings.hideZip}`
    );

    if (isVisible && props.files.length > 0 && infSettings.index === 0) {
      mylog("InfiniteEntriesList", "useEffect", `FIRST TIME fetchMoreData() - ${props.foldername}`);
      fetchMoreData();
      const averageCardHeight = 500;
      const maxHeight = window.innerHeight - 40; // total files bare

      // avarage rows availble in space
      const maxRows = Math.round(maxHeight / averageCardHeight);
      setMaxSize(maxRows * getRowSize());

      // adjust height, if less than one row
      if (props.files.length < getRowSize()) {
        setVisibleHeight(averageCardHeight + 70);
      }
    } else if (isVisible && props.files.length > 0 && infSettings.index > 0 && props.foldername) {
      mylog("InfiniteEntriesList", "useEffect", `folder section back in viewport - ${props.foldername}`);
    } else if (isVisible && props.files.length === 0) {
      mylog("InfiniteEntriesList", "useEffect", `no files in ${props.foldername}`);
      setVisibleHeight(45); // size of end message only
      setInfSettings((infSettings) => ({ items: [], hasMore: false, index: 0 }));
    } else {
      mylog("InfiniteEntriesList", "useEffect", `SKIP - ${props.foldername} - nothing to do now`);
    }
  }, [isVisible]);

  return (
    <Container maxWidth="xl" sx={{ py: 2, mx: 0 }} id={"scrollableDiv" + props.foldername}>
      <div ref={nodeRef} style={{ height: visibleHeight, overflow: "auto" }}>
        <InfiniteScroll
          dataLength={infSettings.items.length}
          next={fetchMoreData}
          hasMore={infSettings.hasMore}
          loader={
            <Grid xs={12}>
              <Box>
                <LinearProgress />
              </Box>
            </Grid>
          }
          height={visibleHeight}
          scrollableTarget={"scrollableDiv" + props.foldername}
          endMessage={
            <Grid xs={12}>
              <ItemEnd>Total number of entries: {infSettings.items.length}</ItemEnd>
            </Grid>
          }
        >
          <Grid container spacing={2} sx={{ mx: 0, my: 0 }}>
            {infSettings.items.map((item, index) => (
              <Grid xs={12} sm={6} md={4} lg={3} xl={3} key={index}>
                <EntryCard key={index} entry={item}></EntryCard>
              </Grid>
            ))}
          </Grid>
        </InfiniteScroll>
      </div>
    </Container>
  );
}
