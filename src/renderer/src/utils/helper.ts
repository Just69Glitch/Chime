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

export const generateThumbnails = (filePath: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = filePath;
    video.crossOrigin = "anonymous";

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const thumbnails: string[] = [];

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration;
      const interval = 10;
      const numThumbnails = Math.floor(duration / interval);
      canvas.width = 160;
      canvas.height = 90;

      let currentTime = 0;
      let processedThumbnails = 0;

      video.addEventListener("seeked", function captureFrame() {
        context!.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailDataURL = canvas.toDataURL("image/jpeg");
        thumbnails.push(thumbnailDataURL);

        processedThumbnails += 1;
        if (processedThumbnails >= numThumbnails || currentTime + interval > duration) {
          video.removeEventListener("seeked", captureFrame);
          resolve(thumbnails);
        } else {
          currentTime += interval;
          video.currentTime = currentTime;
        }
      });

      video.currentTime = currentTime;
    });

    video.addEventListener("error", (error) => {
      reject(`Error loading video: ${error.message}`);
    });
  });
};

export const delay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
