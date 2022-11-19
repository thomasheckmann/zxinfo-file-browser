const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Open file dialog or folder in args, from render to main
  openFolder: (args) => ipcRenderer.invoke("dialog:openFolder", args),

  // Scan folder, from render to main
  scanFolder: (args) => ipcRenderer.invoke("scan-folder", args),

  // Load file and return details about format, from render to main
  loadFile: (args) => ipcRenderer.invoke("load-file", args),

  // Load store value (settings), from render to main
  getStoreValue: (args) => ipcRenderer.invoke("getStoreValue", args),

  // Save store value (settings), from render to main
  setStoreValue: (key, value) => ipcRenderer.invoke("setStoreValue", key, value),

  // Load favorites
  getFavorites: (args) => ipcRenderer.invoke("getFavorites", args),

  // Save favorites
  setFavorites: (key, value) => ipcRenderer.invoke("setFavorites", key, value),

  // Load zxinfoSCRStore
  getZxinfoSCR: (args) => ipcRenderer.invoke("getZxinfoSCR", args),

  // Save zxinfoSCRStore
  setZxinfoSCR: (key, value) => ipcRenderer.invoke("setZxinfoSCR", key, value),

  // Convert SCR to 320x240 - centered (used when getting SCR from ZXInfo)
  convertSCR: (img) => ipcRenderer.invoke("convertSCR", img),

  // Open external browser with details, from render to main
  openZXINFODetail: (args) => ipcRenderer.invoke("open-zxinfo-detail", args),

  // Locate and open folder with file, from render to main
  locateFileAndFolder: (args) => ipcRenderer.invoke("locate-file-and-folder", args),
});
