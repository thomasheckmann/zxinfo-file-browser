/**
 *
 * props.files - array with filenames, already filtered and sorted, to be displayed as InfinitiveList
 *
 * Based on: https://github.com/ankeetmaini/react-infinite-scroll-component
 */

import React, { useEffect, useState } from "react";
import EntryCard from "./EntryCard";
import InfiniteScroll from "react-infinite-scroll-component";
import Grid from "@mui/material/Unstable_Grid2";

const NO_OF_ITEMS = 9; // number of files to fetch/display

function InfiniteEntriesList(props) {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [index, setIndex] = useState(0);

  const fetchMoreData = async () => {
    // console.log(`before: index=${index}, max: ${props.files.length}, current: ${items.length}, max=${NO_OF_ITEMS}`);
    var itemsToAdd = [];
    var newIndex = index;
    for (newIndex = index; newIndex < props.files.length && itemsToAdd.length < NO_OF_ITEMS; newIndex++) {
      const result = await window.electronAPI.loadFile(props.files[newIndex]);
      result.map((entry) => itemsToAdd.push(entry));
    }
    setIndex(newIndex);
    setItems(items.concat(itemsToAdd));
    if (newIndex >= props.files.length) {
      setHasMore(false);
    }
  };

  useEffect(() => {
    fetchMoreData();
    setHasMore(true);
  }, [props.files]);

  return (
    <div>
      <div id={"scrollableDiv" + props.foldername} style={{ height: 700, overflow: "auto" }}>
        <InfiniteScroll
          dataLength={items.length}
          next={fetchMoreData}
          hasMore={hasMore}
          loader={<h4>Loading...</h4>}
          height={650}
          scrollableTarget={"scrollableDiv" + props.foldername}
          endMessage={
            <p style={{ textAlign: "center" }}>
              <b>Yay! You have seen it all</b>
            </p>
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
    </div>
  );
}

export default InfiniteEntriesList;
