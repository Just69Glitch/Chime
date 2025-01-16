import { app, shell, BrowserWindow } from "electron";
import path from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { closeDatabase } from "./db/sqlite";
import "./types";
import "./ipc";
import { registerWindowEvents } from "./ipc";
import { clearActiveFfmpegProcesses } from "./utils/videoHandler";
import { getLastPosition, getLastSize, savePosition, saveSize } from "./utils/windowHandlers";

let mainWindow: BrowserWindow | null = null;


// Create the main application window
const createMainWindow = () => {
  const lastPosition = getLastPosition();
  const lastSize = getLastSize(mainWindow);
  mainWindow = new BrowserWindow({
    title: "Chime Media Player",
    width: lastSize.width,
    height: lastSize.height,
    minWidth: 1000,
    minHeight: 595,
    show: false,
    x: lastPosition.x,
    y: lastPosition.y,
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      allowRunningInsecureContent: true,
      webSecurity: false,
    },
  });

  // Show the main window when it is ready and hide the splash screen
  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) return;
    mainWindow?.show();
    mainWindow?.focus();
    mainWindow?.webContents.openDevTools();
  });

  // Prevent external links from opening in the app
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  mainWindow.on("close", () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      const size = mainWindow.getSize();
      savePosition(bounds.x, bounds.y);
      saveSize(size[0], size[1]);
    }
  });

  // Load the remote URL for development or local HTML file for production
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
};

// Initialize the app when Electron is ready
app.whenReady().then(() => {
  const startTime = Date.now();

  // Set app user model ID for Windows
  electronApp.setAppUserModelId("com.chime-media-player.app");

  // Register global shortcuts and events for each window
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
    registerWindowEvents(window);
  });

  // Create the main window
  createMainWindow();

  // Re-create a window in the app when the dock icon is clicked (macOS)
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });

  console.log(`App started in ${(Date.now() - startTime) / 1000}s`);
});

// Close the database and quit the app when all windows are closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    clearActiveFfmpegProcesses();
    closeDatabase();
    app.quit();
  }
});

app.on("quit", () => {
  clearActiveFfmpegProcesses();
  closeDatabase();
});

// Handle unexpected errors to improve debugging
process.on("uncaughtException", (error) => {
  console.error("Unhandled exception:", error);
  clearActiveFfmpegProcesses();
  app.quit();
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  clearActiveFfmpegProcesses();
  app.quit();
});
