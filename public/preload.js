const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Open file dialog, from render to main
  openFolder: () => ipcRenderer.invoke("dialog:openFolder"),

  // Scan folder, from render to main
  scanFolder: (args) => ipcRenderer.invoke("scan-folder", args),

  // Load file and return details about format, from render to main
  loadFile: (args) => ipcRenderer.invoke("load-file", args),

  // Load store value (settings), from render to main
  getStoreValue: (args) => ipcRenderer.invoke("getStoreValue", args),

  // Save store value (settings), from render to main
  setStoreValue: (key, value) => ipcRenderer.invoke("setStoreValue", key, value),

  // Open external browser with details, from render to main
  openZXINFODetail: (args) => ipcRenderer.invoke("open-zxinfo-detail", args),

  // Locate and open folder with file, from render to main
  locateFileAndFolder: (args) => ipcRenderer.invoke("locate-file-and-folder", args),

  // Notify when folder found, from main to render
  onNotifyAboutFolder: (callback) => ipcRenderer.on("notify-about-folder", callback),

  // Notify when file found, from main to render
  onNotifyAboutFile: (callback) => ipcRenderer.on("notify-about-file", callback),
});
