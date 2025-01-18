import { app } from "electron";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import ffmpeg, { FfprobeData } from "fluent-ffmpeg";
import { db as SQL } from "../db/sqlite";
const activeFfmpegProcesses: Set<any> = new Set();


// Defining ffmpeg path
ffmpeg.setFfmpegPath(
  (() => {
    const appPath = app.getAppPath().replace("app.asar", "app.asar.unpacked");
    if (process.platform === "win32") {
      return path.join(appPath, "resources", "ffmpeg", "ffmpeg.exe");
    } else if (process.platform === "darwin") {
      return path.join(appPath, "resources", "ffmpeg", "ffmpeg"); // macOS path
    } else if (process.platform === "linux") {
      return path.join(appPath, "resources", "ffmpeg", "ffmpeg"); // Linux path
    }
    throw new Error("Unsupported platform");
  })()
);

ffmpeg.setFfprobePath(
  (() => {
    const appPath = app.getAppPath().replace("app.asar", "app.asar.unpacked");
    if (process.platform === "win32") {
      return path.join(appPath, "resources", "ffmpeg", "ffprobe.exe");
    } else if (process.platform === "darwin") {
      return path.join(appPath, "resources", "ffmpeg", "ffprobe"); // macOS path
    } else if (process.platform === "linux") {
      return path.join(appPath, "resources", "ffmpeg", "ffprobe"); // Linux path
    }
    throw new Error("Unsupported platform");
  })()
);

function calculateCacheSize() {
  const baseDir = path.join(app.getPath("userData"), "database", "files");
  let totalSize = 0;
  function getDirSize(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        getDirSize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  }
  getDirSize(baseDir);
  return totalSize;
}

export const cleanupCache = () => {
  const maxSize = 10 * 1024 * 1024 * 1024;  // 10 GB in bytes
  const cacheSize = calculateCacheSize();
  if (cacheSize > maxSize) {
    const baseDir = path.join(app.getPath("userData"), "database", "files");
    const oldestVideos: { md5_hash: string; }[] = SQL.prepare(
      `SELECT md5_hash FROM videos ORDER BY last_accessed ASC LIMIT 50`
    ).all() as { md5_hash: string; }[];
    for (const video of oldestVideos) {
      const videoDir = path.join(baseDir, video.md5_hash);
      fs.rmSync(videoDir, { recursive: true, force: true });
      SQL.prepare(`DELETE FROM videos WHERE md5_hash = ?`).run(video.md5_hash);
      if (calculateCacheSize() <= maxSize) {
        break;
      }
    }
  }
};

export const clearActiveFfmpegProcesses = () => {
  activeFfmpegProcesses.forEach((process) => process.kill("SIGKILL"));
  activeFfmpegProcesses.clear();
};

export const isValidVideoFile = (filePath: string): boolean => {
  return fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();
};

export const isSupportedVideoFile = (filePath: string): boolean => {
  const supportedExtensions = [".mp4", ".webm", ".ogg"];
  return supportedExtensions.includes(path.extname(filePath).toLowerCase());
};

export const getFileMD5 = (filePath: string): Promise<string> => {
  const size = 100 * 1048575;
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath, { start: 0, end: size });
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
};

export const isCachedVideoFile = async (filePath: string): Promise<{ status: boolean, fileMD5: string; }> => {
  const fileMD5 = await getFileMD5(filePath);
  const video = await SQL.prepare(
    `SELECT md5_hash FROM videos WHERE md5_hash = ?`
  ).get(fileMD5);
  if (!video) return { status: false, fileMD5 };
  return { status: true, fileMD5 };
};

export const getVideoFileProbe = (filePath: string): Promise<FfprobeData> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(new Error(`FFprobe error: ${err.message}`));
      else resolve(metadata);
    });
  });
};

export const extractAudioTracks = async (metadata: FfprobeData, filePath: string, fileMD5: string): Promise<AudioExtractionResponse> => {
  const audioStreams = metadata.streams.filter((stream) => stream.codec_type === "audio");
  if (audioStreams.length === 0) {
    return { success: true };
  }
  const audioDir = path.join(app.getPath("userData"), "database", "files", fileMD5, "audio");
  fs.mkdirSync(audioDir, { recursive: true });

  try {
    await Promise.all(
      audioStreams.map((_, index) => {
        return new Promise<void>((resolve, reject) => {
          const audioFilePath = path.join(audioDir, `${index}.wav`);
          const ffmpegProcess = ffmpeg(filePath)
            .audioCodec("pcm_s16le")
            .audioBitrate("0")
            .audioFrequency(44100)
            .audioChannels(2)
            .outputOptions([`-map 0:a:${index}`, "-vn"])
            .format("wav")
            .save(audioFilePath)
            .on("start", () => {
              activeFfmpegProcesses.add(ffmpegProcess);
            })
            .on("end", () => {
              ffmpegProcess.kill("SIGKILL");
              activeFfmpegProcesses.delete(ffmpegProcess);
              insertNewAudioTrack(fileMD5, index);
              resolve();
            })
            .on("error", (err) => {
              ffmpegProcess.kill("SIGKILL");
              activeFfmpegProcesses.delete(ffmpegProcess);
              fs.unlink(audioFilePath, () => reject(new Error(`Audio extraction error: ${err.message}`)));
            });
        });
      })
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

export const insertNewAudioTrack = (videoMD5Hash: string, trackIndex: number) => {
  SQL.prepare(`
    INSERT INTO audio_tracks (video_md5_hash, track_index)
    VALUES (?, ?)
  `).run(videoMD5Hash, trackIndex);
};

export const insertNewVideoFile = (videoMD5Hash: string) => {
  SQL.prepare(`
    INSERT INTO videos (md5_hash)
    VALUES (?)
  `).run(videoMD5Hash);
};
