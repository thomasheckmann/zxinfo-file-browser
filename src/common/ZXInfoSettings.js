/**
 *
 * Common app settings - avail for all components
 */
import { createContext } from "react";

const defaultFileFilters = ["sna", "z80", "slt", "dsk", "trd", "scl", "mdr", "tap", "tzx", "p", "o", "p81", "81", "zip"];
const ZXInfoSettings = createContext();

const ConfigObj = {
  defaultFileFilters: defaultFileFilters,
  fileFilters: defaultFileFilters,
  hideZip: false,
  // persistent app config saved to config.json
  sortOrderFiles: true,
  sortOrderFolders: true,
  favorites: new Map(),
  zxdbIDs: new Map(),
};

export { ZXInfoSettings as ZXInfoSettingsCtx, ConfigObj as ZXInfoSettingsObj };
