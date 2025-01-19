export const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  } else {
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }
};

export const generateThumbnails = (filePath: string, options: Partial<{ width: number; height: number; quality: number; maxThumbnails: number; }> = {}): Promise<string[]> => {
  const { width = 160, height = 90, quality = 0.7, maxThumbnails = 100 } = options;
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = filePath;
    video.crossOrigin = "anonymous";

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    const thumbnails: string[] = [];

    let isProcessing = false;
    const processQueue: number[] = [];

    const processThumbnail = async (time: number) => {
      if (isProcessing) {
        processQueue.push(time);
        return;
      }

      isProcessing = true;
      video.currentTime = time;

      await new Promise<void>((seekResolve) => {
        video.onseeked = () => {
          context!.drawImage(video, 0, 0, width, height);
          thumbnails.push(canvas.toDataURL("image/jpeg", quality));
          seekResolve();
        };
      });

      isProcessing = false;

      if (processQueue.length > 0) {
        const nextTime = processQueue.shift()!;
        processThumbnail(nextTime);
      }
    };

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration;
      canvas.width = width;
      canvas.height = height;

      // Calculate optimal interval based on video duration and maxThumbnails
      const numThumbnails = Math.min(Math.floor(duration), maxThumbnails);
      const interval = duration / numThumbnails;

      // Generate thumbnail timestamps
      const timestamps = Array.from(
        { length: numThumbnails },
        (_, i) => i * interval
      );

      // Process thumbnails in chunks
      const chunkSize = 5;
      const processChunk = async (chunk: number[]) => {
        await Promise.all(chunk.map(time => processThumbnail(time)));
      };

      const chunks: number[][] = [];
      for (let i = 0; i < timestamps.length; i += chunkSize) {
        chunks.push(timestamps.slice(i, i + chunkSize));
      }

      // Process chunks sequentially
      (async () => {
        for (const chunk of chunks) {
          await processChunk(chunk);
        }
        resolve(thumbnails);
      })();
    });

    video.addEventListener("error", (error) => {
      reject(new Error(`Failed to load video: ${error.message}`));
    });

    // Cleanup function
    const cleanup = () => {
      video.remove();
      canvas.remove();
    };

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Thumbnail generation timed out"));
    }, 30000); // 30 second timeout

    video.addEventListener("loadedmetadata", () => clearTimeout(timeout));
  });
};

export const delay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
