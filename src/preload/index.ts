import { contextBridge, ipcRenderer, IpcRendererEvent, webUtils } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Helper function to handle exposing APIs
const exposeAPI = (name: string, apiObject: any) => {
  if (process.contextIsolated) {
    contextBridge.exposeInMainWorld(name, apiObject);
  } else {
    // @ts-ignore (defined in dts)
    window[name] = apiObject;
  }
};

const userDatabaseAPI = {
  saveFileState: (fileHash: string, state: any) =>
    ipcRenderer.invoke("save-file-state", fileHash, state),

  getFileState: (fileHash: string) =>
    ipcRenderer.invoke("get-file-state", fileHash),

  saveSubtitle: (fileHash: string, subtitleName: string, subtitleData: Buffer, language: string) =>
    ipcRenderer.invoke("save-subtitle", fileHash, subtitleName, subtitleData, language),

  getSubtitle: (fileHash: string, subtitleName: string) =>
    ipcRenderer.invoke("get-subtitle", fileHash, subtitleName),

  getAllSubtitles: (fileHash: string) =>
    ipcRenderer.invoke("get-all-subtitles", fileHash),
};

const appWindowAPI = {
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("toggle-maximize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),

  onMaximize: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on("window-maximized", callback),

  onUnmaximize: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on("window-unmaximized", callback),

  onReady: (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on("window-ready", callback),

  removeMaximizeListeners: () => {
    ipcRenderer.removeAllListeners("window-maximized");
    ipcRenderer.removeAllListeners("window-unmaximized");
  },

  removeWindowOnReadyListener: () => ipcRenderer.removeAllListeners("window-ready"),
};

const UtilsAPI = {
  getPathForFile: (file: File) => {
    return webUtils.getPathForFile(file);
  },
  isFile: (path: string) => {
    return ipcRenderer.invoke("dropped-is-file", path);
  },
  getFile: (path: string) => {
    return ipcRenderer.invoke("get-dropped-file", path);
  }
};


// Expose the APIs dynamically
try {
  exposeAPI("electron", { electronAPI });
  exposeAPI("userDatabase", userDatabaseAPI);
  exposeAPI("appWindow", appWindowAPI);
  exposeAPI("utils", UtilsAPI);
} catch (error) {
  console.error("Error exposing APIs: ", error);
}
