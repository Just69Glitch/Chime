export { };

declare global {
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

  interface FileValidationResponse {
    isValid: boolean;
    file?: VideoDetails;
    error?: string;
  }

  interface AudioExtractionResponse {
    success: boolean;
    error?: string;
  }
}
