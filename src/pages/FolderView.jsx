import React from "react";
import FilesView from "../components/FilesView";

function FolderView({ folders }) {
  return (
    folders &&
    folders.length > 0 && (
      <React.Fragment>
        {folders.map((folder, index) => {
          return <FilesView key={folder.dir} foldername={folder.dir} filesInFolder={folder.files}></FilesView>;
        })}
      </React.Fragment>
    )
  );
}

export default FolderView;
