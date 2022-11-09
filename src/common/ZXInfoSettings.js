/**
 *
 * Common app settings - avail for all components
 * - filFilters
 * - isBusyWorking
 */
import { createContext } from "react";

const defaultFileFilters = ["sna", "z80", "slt", "dsk", "trd", "mdr", "tap", "tzx", "zip"];

const ZXInfoSettings = createContext({
  fileFilters: defaultFileFilters,
  isBusyWorking: false,
  showDrawerFolderLink: false,
  showDrawerSettings: false,

  // persistent app config saved to config.json
  sortOrderFiles: true,
  sortOrderFolders: true,
});

export default ZXInfoSettings;
