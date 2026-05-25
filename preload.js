"use strict";

// src/main/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("noorai", {
  getSystemInfo: () => import_electron.ipcRenderer.invoke("get-system-info"),
  scanGames: () => import_electron.ipcRenderer.invoke("scan-games"),
  checkDrivers: () => import_electron.ipcRenderer.invoke("check-drivers"),
  cleanShaderCache: (paths) => import_electron.ipcRenderer.invoke("clean-shader-cache", paths),
  analyzeCrash: (text) => import_electron.ipcRenderer.invoke("analyze-crash", text),
  getFPS: () => import_electron.ipcRenderer.invoke("get-fps")
});
