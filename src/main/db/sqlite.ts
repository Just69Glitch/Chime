import { app } from "electron";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const databaseDirectory = path.join(app.getPath("userData"), "Database");
const databasePath = path.join(databaseDirectory, "mediaPlayer.db");

const connectDatabase = (): Database.Database => {
  try {
    if (!fs.existsSync(databaseDirectory)) {
      fs.mkdirSync(databaseDirectory, { recursive: true });
      console.log(`Directory created: ${databaseDirectory}`);
    }

    const db = new Database(databasePath);
    db.pragma("foreign_keys = ON");
    console.log("Database connected successfully");

    db.exec(`
          CREATE TABLE IF NOT EXISTS videos (
              md5_hash TEXT PRIMARY KEY,
              playback_speed REAL NOT NULL DEFAULT 1.0,
              volume REAL NOT NULL DEFAULT 1.0,
              is_muted INTEGER NOT NULL DEFAULT 0,
              current_seek_time REAL NOT NULL DEFAULT 0.0,
              last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS audio_tracks (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              video_md5_hash TEXT NOT NULL,
              track_index INTEGER NOT NULL,
              volume REAL NOT NULL DEFAULT 1.0,
              is_muted INTEGER NOT NULL DEFAULT 0,
              FOREIGN KEY (video_md5_hash) REFERENCES videos (md5_hash) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS subtitles (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              video_md5_hash TEXT NOT NULL,
              subtitle_name TEXT,
              language TEXT,
              size REAL NOT NULL DEFAULT 1.0,
              color TEXT NOT NULL DEFAULT "#FFFFFF",
              timing_adjustment REAL NOT NULL DEFAULT 0.0,
              file_path TEXT NOT NULL,
              FOREIGN KEY (video_md5_hash) REFERENCES videos (md5_hash) ON DELETE CASCADE
          );
      `);

    return db;
  } catch (error: any) {
    console.error("Failed to connect to the database:", error?.message);
    process.exit(1);
  }
};

export const closeDatabase = (): void => {
  try {
    db.close();
    console.log("Database connection closed successfully");
  } catch (error: any) {
    console.error("Failed to close the database:", error.message);
  }
};

export const db: Database.Database = connectDatabase();
