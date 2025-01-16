import { app, BrowserWindow, screen } from "electron";
import path from "path";
import fs from "fs";

export const getLastPosition = (): { x: number, y: number; } => {
  const positionFile = path.join(app.getPath("userData"), "window-position.json");
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  if (fs.existsSync(positionFile)) {
    const data = fs.readFileSync(positionFile, "utf-8");
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.x !== undefined && parsedData.y !== undefined) {
        return parsedData;
      }
    } catch (err) {
      console.log("Error reading position data", err);
    }
  }

  const windowSize = getLastSize(null);
  return {
    x: Math.round((width - windowSize.width) / 2),
    y: Math.round((height - windowSize.height) / 2),
  };
};

export const getLastSize = (window: BrowserWindow | null): { width: number, height: number; } => {
  const sizeFile = path.join(app.getPath("userData"), "window-size.json");

  if (fs.existsSync(sizeFile)) {
    const data = fs.readFileSync(sizeFile, "utf-8");
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.width && parsedData.height) {
        return parsedData;
      }
    } catch (err) {
      console.log("Error reading size data", err);
    }
  }

  if (!window) return { width: 1000, height: 595 };

  const [width, height] = window.getSize();
  return { width, height };

};

export const savePosition = (x: number, y: number): void => {
  const positionFile = path.join(app.getPath("userData"), "window-position.json");
  const data = JSON.stringify({ x, y });
  fs.writeFileSync(positionFile, data);
};

export const saveSize = (width: number, height: number): void => {
  const sizeFile = path.join(app.getPath("userData"), "window-size.json");
  const data = JSON.stringify({ width, height });
  fs.writeFileSync(sizeFile, data);
};
