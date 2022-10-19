const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openFolder: () => ipcRenderer.invoke("dialog:openFolder"),
  scanFolder: (args) => ipcRenderer.invoke("scan-folder", args),
  loadFile: (args) => ipcRenderer.invoke("load-file", args),
  getStoreValue: (args) => ipcRenderer.invoke("getStoreValue", args),
  setStoreValue: (key, value) =>
    ipcRenderer.invoke("setStoreValue", key, value),
});
