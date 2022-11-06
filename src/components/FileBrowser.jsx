import React, { useContext, useEffect, useState } from "react";
import ZXInfoSettings from "../common/ZXInfoSettings";

import FilesView from "./filesview";

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

function FolderView(props) {
  return (
    <React.Fragment>
      {
        props.folders.map((folder, index) => {
        return <FilesView key={folder} foldername={folder}></FilesView>;
      })}

    </React.Fragment>
  );
}

export default FolderView;
