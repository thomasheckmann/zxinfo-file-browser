import React, { useContext, useEffect, useState } from "react";
import ZXInfoSettings from "../common/ZXInfoSettings";

import FilesView from "./filesview";

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

function FolderView(props) {
  const [appSettings, setAppSettings] = useContext(ZXInfoSettings);

  /**
  useEffect(() => {
    setState({ ...state, showDrawerFolders: props.showDrawerFolders });
  }, [props.showDrawerFolders]);
 */

  return (
    <React.Fragment>
      {isDev && "FolderView: " + JSON.stringify(appSettings)}
      {
        props.folders.map((folder, index) => {
        if (index === props.folders.length - 1) {
          // setAppSettings({ isBusyWorking: false });
          console.log("SETTING busy");
        }
        return <FilesView key={folder} foldername={folder}></FilesView>;
      })}

    </React.Fragment>
  );
}

export default FolderView;
