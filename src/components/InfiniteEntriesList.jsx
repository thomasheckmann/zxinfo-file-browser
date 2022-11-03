/**
 *
 * props.files - array with filenames, already filtered and sorted, to be displayed as InfinitiveList
 *
 * Based on: https://github.com/ankeetmaini/react-infinite-scroll-component
 */

import React, { useEffect, useState } from "react";
import { useRef } from "react";
import { Box, Container, LinearProgress, Paper } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import styled from "@emotion/styled";
import InfiniteScroll from "react-infinite-scroll-component";
import { useIsVisible } from "react-is-visible";
import EntryCard from "./EntryCard";

const ItemEnd = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#ccc",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

function InfiniteEntriesList(props) {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [index, setIndex] = useState(0);
  const [maxSize, setMaxSize] = useState(props.maxsize);

  const nodeRef = useRef();
  const isVisible = useIsVisible(nodeRef);

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
    }
  }, [props.files, isVisible, props.sortOrderFiles]);

  return (
    <Container ref={nodeRef} maxWidth="xl">
      <div id={"scrollableDiv" + props.foldername} style={{ height: 750, overflow: "auto" }}>
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
          height={700}
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
