import React from "react";

import FilesView from "../components/FilesView";

function FolderView(props) {
  return (
    <React.Fragment>
      {props.folders.map((folder, index) => {
        return <FilesView key={folder} foldername={folder}></FilesView>;
      })}
    </React.Fragment>
  );
}

export default FolderView;
