const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Open file dialog or folder in args, from render to main
  openFolder: (args) => ipcRenderer.invoke("open-folder-dialog", args),

  // Scans a list of folders
  scanFolders: (folders) => ipcRenderer.invoke("scan-folders", folders),
  // Communicate back to main
  onFolderCompleted: (callback) => ipcRenderer.on('folder-completed', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Load file and return details about format, from render to main
  loadFile: (filename, isPreview) => ipcRenderer.invoke("load-file", filename, isPreview),

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

  // Load zxdb-id store
  getZXDBs: (args) => ipcRenderer.invoke("get-zxdb-id-store", args),

  // Save zxdb-id store
  setZXDBs: (key, value) => ipcRenderer.invoke("set-zxdb-id-store", key, value),

  // Convert SCR to 320x240 - centered (used when getting SCR from ZXInfo)
  // NOT USED
  convertSCR: (img) => ipcRenderer.invoke("convertSCR", img),

  createZX81List: (data) => ipcRenderer.invoke("create-zx81-basic-list", data),
  createZX80List: (data) => ipcRenderer.invoke("create-zx80-basic-list", data),

  // Open external browser with details, from render to main
  openZXINFODetail: (args) => ipcRenderer.invoke("open-zxinfo-detail", args),

  // Locate and open folder with file, from render to main
  locateFileAndFolder: (args) => ipcRenderer.invoke("locate-file-and-folder", args),

  // Locate file to launch in emulator, (extrac) and copy file to ./tmp folder. from render to main
  getFileForJSSpeccy: (args) => ipcRenderer.invoke("get-file-jsspeccy", args),

  // onUpdateStatusText: (callback) => ipcRenderer.on('update-status-text', callback),
});
