import { app, ipcMain } from "electron";
import path from "path";
import { cleanupCache, isValidVideoFile, isSupportedVideoFile, isCachedVideoFile, getVideoFileProbe, extractAudioTracks, insertNewVideoFile } from "../utils/videoHandler";
import { db as SQL } from "../db/sqlite";


// Main IPC handler: Validate file and extract video details
ipcMain.handle("dropped-is-file", async (_, filePath: string): Promise<FileValidationResponse> => {
  try {
    if (!isValidVideoFile(filePath)) {
      return { isValid: false, error: "Not a valid file." };
    }

    if (!isSupportedVideoFile(filePath)) {
      return {
        isValid: false,
        error: "Unsupported video format. Only MP4, WebM, and OGG are supported.",
      };
    }

    const isCached = await isCachedVideoFile(filePath);
    const fileMD5 = isCached.fileMD5;
    if (!isCached.status) {
      insertNewVideoFile(fileMD5);
      const metadata = await getVideoFileProbe(filePath);
      if (!metadata.streams || metadata.streams.length === 0) {
        return { isValid: false, error: "No video streams found in the file." };
      }
      await extractAudioTracks(metadata, filePath, fileMD5);
      cleanupCache();
    }

    const video: VideoInfo = await SQL.prepare(
      `SELECT md5_hash, playback_speed, volume, is_muted, current_seek_time FROM videos WHERE md5_hash = ?`
    ).get(fileMD5) as VideoInfo;
    const audioTracks: AudioTrack[] = await SQL.prepare(
      `SELECT id, track_index, volume, is_muted FROM audio_tracks WHERE video_md5_hash = ? ORDER BY track_index ASC`
    ).all(fileMD5) as AudioTrack[];

    audioTracks.forEach(track => {
      track.path = path.join(app.getPath("userData"), "database", "files", fileMD5, "audio", `${track.track_index}.wav`);
      delete (track as any).track_index;
    });

    //console.log(video);
    //console.log(audioTracks);

    return {
      isValid: true,
      file: {
        video: video,
        audioTracks: audioTracks,
      },
    };
  } catch (error) {
    return { isValid: false, error: `Unexpected error: ${(error as Error).message}` };
  }
});
