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

interface VideoInfo {
  md5_hash: string;
  volume: number;
  playback_speed: number;
  is_muted: boolean;
  current_seek_time: number;
}

interface AudioTrack {
  id: number;
  volume: number;
  is_muted: boolean;
  track_index?: number;
  path?: string;  // Optional, will be added
}

interface VideoDetails {
  video: VideoInfo;
  audioTracks?: AudioTrack[];
}

export interface utilsAPI {
  getPathForFile(file: File): Promise<string | null>;
  isFile(path: string): Promise<{ isValid: boolean, file?: VideoDetails, error?: string; }>;
}



declare global {
  interface Window {
    electron: ElectronAPI;
    userDatabase: UserDatabaseAPI;
    appWindow: AppWindowAPI;
    utils: utilsAPI;
  }
}
