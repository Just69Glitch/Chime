import { ipcMain, BrowserWindow } from "electron";

// Handle IPC messages
ipcMain.handle("minimize-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  win.minimize();
});

ipcMain.handle("toggle-maximize-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.handle("close-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  win.close();
});

export const registerWindowEvents = (win: BrowserWindow) => {
  if (!win) return;
  win.on("maximize", () => {
    win.webContents.send("window-maximized");
  });

  win.on("unmaximize", () => {
    win.webContents.send("window-unmaximized");
  });
};
