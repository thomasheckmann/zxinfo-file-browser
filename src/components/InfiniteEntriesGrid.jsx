/**
 *
 * props.files - array with filenames, already filtered and sorted, to be displayed as InfinitiveList
 *
 * Based on: https://github.com/ankeetmaini/react-infinite-scroll-component
 */

import React, { useEffect, useState } from "react";
import { Container, ImageList, LinearProgress, Paper } from "@mui/material";
import styled from "@emotion/styled";
import InfiniteScroll from "react-infinite-scroll-component";
import { useContext } from "react";
import { ZXInfoSettingsCtx } from "../common/ZXInfoSettings";
import { mylog } from "../App";
import { Box } from "@mui/system";

import GridItem from "./GridItem";

const ItemEnd = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#008000",
  ...theme.typography.button,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.primary,
}));

export default function InfiniteEntriesGrid(props) {
  const [appSettings] = useContext(ZXInfoSettingsCtx);
  const [infSettings, setInfSettings] = useState({ items: [], hasMore: true, index: 0 });

  const [maxSize, setMaxSize] = useState(24); // number of entries to fetch at a time
  const [visibleHeight, setVisibleHeight] = useState(Math.round(window.innerHeight * 0.75));

  function getRowSize() {
    return 6;
  }

  const fetchMoreData = async () => {
    var itemsToAdd = [];
    var newIndex;

    for (newIndex = infSettings.index; newIndex < props.files.length && itemsToAdd.length < maxSize; newIndex++) {
      const result = await window.electronAPI.loadFile(props.files[newIndex]);
      if (result) {
        result.forEach(function (e) {
          if (appSettings.hideZip && e.filename.toLowerCase().endsWith("zip") && !e.subfilename) {
            mylog("InfiniteEntriesGrid", "fetchMoreData", `removing ZIP ${e.filename} from list - ${props.foldername}`);
          } else {
            itemsToAdd.push(e);
          }
        });
      }
    }
    if (newIndex >= props.files.length) {
      setInfSettings((infSettings) => ({ ...infSettings, items: [...infSettings.items, ...itemsToAdd], hasMore: false, index: newIndex }));
      if ([...infSettings.items, ...itemsToAdd].length === 0) {
        mylog("InfiniteEntriesGrid", "fetchMoreData", `nothing to show, adjusting element size...`);
        setVisibleHeight(45); // size of end message only
      }
    } else {
      setInfSettings((infSettings) => ({ ...infSettings, items: [...infSettings.items, ...itemsToAdd], hasMore: true, index: newIndex }));
    }
  };

  useEffect(() => {
    mylog(
      "InfiniteEntriesGrid",
      "useEffect",
      `(${props.foldername}), no of files: ${props.files.length}, index: ${infSettings.index}, hide: ${appSettings.hideZip}`
    );

    if (props.files.length > 0 && infSettings.index === 0) {
      mylog("InfiniteEntriesGrid", "useEffect", `FIRST TIME fetchMoreData() - ${props.foldername}`);
      fetchMoreData();
      const averageCardHeight = 170;
      const maxHeight = window.innerHeight - 40; // total files bare

      // avarage rows availble in space
      const maxRows = Math.round(maxHeight / averageCardHeight);
      setMaxSize(maxRows * getRowSize());

      // adjust height, if less than one row
      if (props.files.length < getRowSize()) {
        setVisibleHeight(maxHeight + 70);
      }
    } else if (props.files.length > 0 && infSettings.index > 0 && props.foldername) {
      mylog("InfiniteEntriesGrid", "useEffect", `folder section back in viewport - ${props.foldername}`);
    } else if (props.files.length === 0) {
      mylog("InfiniteEntriesGrid", "useEffect", `no files in ${props.foldername}`);
      setVisibleHeight(45); // size of end message only
      setInfSettings((infSettings) => ({ items: [], hasMore: false, index: 0 }));
    } else {
      mylog("InfiniteEntriesGrid", "useEffect", `SKIP - ${props.foldername} - nothing to do now`);
    }
  }, [appSettings.hideZip, infSettings.index, props.files, props.foldername]);

  return (
    <Container maxWidth="xl" sx={{ py: 0, mx: 0, my: 2 }} id={"scrollableDiv" + props.foldername}>
      <InfiniteScroll
        dataLength={infSettings.items.length}
        next={fetchMoreData}
        hasMore={infSettings.hasMore}
        loader={
          <Box>
            <LinearProgress color="success" />
          </Box>
        }
        endMessage={<ItemEnd>Total number of entries: {infSettings.items.length}</ItemEnd>}
      >
        <ImageList sx={{ width: "100%", height: "vh" }} cols={6}>
          {infSettings.items.map((item, index) => (
            <GridItem entry={item} key={index}></GridItem>
          ))}
        </ImageList>
      </InfiniteScroll>
    </Container>
  );
}
