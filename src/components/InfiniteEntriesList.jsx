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
import ZXInfoSettings from "../common/ZXInfoSettings";

const ItemEnd = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#ccc",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

function InfiniteEntriesList(props) {
  const [appSettings] = useContext(ZXInfoSettings);

  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [index, setIndex] = useState(0);
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
    var itemsToAdd = [];
    var newIndex = index;
    for (newIndex = index; newIndex < props.files.length && itemsToAdd.length < maxSize; newIndex++) {
      const result = await window.electronAPI.loadFile(props.files[newIndex]);
      result.map((entry) => itemsToAdd.push(entry));
    }
    setIndex(newIndex);
    setItems(items.concat(itemsToAdd));
    if (newIndex >= props.files.length) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchMoreData();
      const averageCardHeight = 450;
      const maxHeight = window.innerHeight - 40; // total files bare

      // avarage rows availble in space
      const maxRows = Math.round(maxHeight / averageCardHeight);
      setMaxSize(maxRows * getRowSize());

      // adjust height, if less than one row
      if(props.files.length < getRowSize()) {
        setVisibleHeight(averageCardHeight + 120);
      }
    }
  }, [props.files, isVisible, appSettings.sortOrderFiles]);

  return (
    <Container maxWidth="xl">
      <div ref={nodeRef} id={"scrollableDiv" + props.foldername} style={{ height: visibleHeight, overflow: "auto" }}>
        <InfiniteScroll
          dataLength={items.length}
          next={fetchMoreData}
          hasMore={hasMore}
          loader={
            <Grid xs={12}>
              <Box sx={{ width: "100%" }}>
                <LinearProgress />
              </Box>
            </Grid>
          }
          height={visibleHeight}
          scrollableTarget={"scrollableDiv" + props.foldername}
          endMessage={
            <Grid xs={12}>
              <ItemEnd>Total number of entries: {items.length}</ItemEnd>
            </Grid>
          }
        >
          <Grid container spacing={2} sx={{ my: 2 }}>
            {items.map((item, index) => (
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

export default InfiniteEntriesList;
