import { IconButton, Tooltip } from "@mui/material";
import InsertLinkOutlinedIcon from "@mui/icons-material/InsertLinkOutlined";

const openFolderFile = (name) => {
  window.electronAPI.locateFileAndFolder(name).then((res) => {});
};

export default function LocateFileAndFolder(props) {
  return (
    <Tooltip title="Locate file">
      <IconButton aria-label="Locate file" onClick={(name) => openFolderFile(props.path)} sx={{ ...props.sx }}>
        <InsertLinkOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}
