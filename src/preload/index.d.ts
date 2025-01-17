import { ElectronAPI } from "@electron-toolkit/preload";
import { IpcRendererEvent } from "electron";

export interface UserDatabaseAPI {
  saveFileState(fileHash: string, state: any): Promise<void>;
  getFileState(fileHash: string): Promise<any>;
  saveSubtitle(fileHash: string, subtitleName: string, subtitleData: Buffer, language: string): Promise<void>;
  getSubtitle(fileHash: string, subtitleName: string): Promise<Buffer>;
  getAllSubtitles(fileHash: string): Promise<string[]>;
}

export interface AppWindowAPI {
  minimizeWindow(): Promise<void>;
  toggleMaximizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;

  onMaximize(callback: (event: IpcRendererEvent, ...args: any[]) => void): void;
  onUnmaximize(callback: (event: IpcRendererEvent, ...args: any[]) => void): void;
  onReady(callback: (event: IpcRendererEvent, ...args: any[]) => void): void;

  removeMaximizeListeners(): void;
  removeWindowOnReadyListener(): void;
}

export interface utilsAPI {
  getPathForFile(file: File): Promise<string | null>;
  isFile(path: string): Promise<FileValidationResponse>;
  getFile(path: string): Promise<FileValidationResponse>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    userDatabase: UserDatabaseAPI;
    appWindow: AppWindowAPI;
    utils: utilsAPI;
  }
}
