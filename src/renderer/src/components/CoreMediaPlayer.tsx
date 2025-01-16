import { useEffect, useState } from "react";
import { useVideoContext } from "@/context/VideoContext";
import { formatTime } from "@/utils/helper";

const CoreMediaPlayer = () => {
  const { videoRef } = useVideoContext();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  useEffect(() => {

    if (!videoRef.current) return;
    const handleTimeUpdate = () => {
      if (!videoRef.current) return;
      setCurrentTime(videoRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (!videoRef.current) return;
      setDuration(videoRef.current.duration);
    };

    const videoElement = videoRef.current;
    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("durationchange", handleLoadedMetadata);

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("durationchange", handleLoadedMetadata);
    };
  }, [videoRef]);

  // Seek to a specific time when the seek bar changes
  const handleSeekBarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = parseFloat(event.target.value);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSeekStart = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleSeekEnd = () => {
    if (videoRef.current && !isPaused) {
      videoRef.current.play();
    }
  };


  const playPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
      setIsPaused(videoRef.current.paused);
    }
  };

  return (
    <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-background-900 to-transparent px-10 flex flex-wrap items-end rounded-t-md">
      <div className="w-full h-2/6 flex items-end space-x-4 z-10">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          step={0.01}
          aria-label="Video Seek Bar"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          onChange={handleSeekBarChange}
          onMouseDown={handleSeekStart}
          onMouseUp={handleSeekEnd}
          onTouchStart={handleSeekStart}
          onTouchEnd={handleSeekEnd}
          className="w-full h-2 range-thumb bg-gray-400 rounded-full appearance-none cursor-pointer duration-150"
          style={{
            backgroundSize: `${(currentTime / duration) * 100}% 100%`,
            background: `linear-gradient(to right, #00a2ed ${((currentTime / duration) * 100) + 0.15}%, #ffffff 0%)`,
          }}
        />

        <div className="text-text-50 flex-shrink-0 h-4">
          <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
        </div>
      </div>
      <div className="w-2/5 h-4/6 flex items-center space-x-2">
        <button onClick={playPause}>Play/Pause</button>
      </div>
      <div className="w-3/5 h-4/6 flex items-center space-x-2">

      </div>
    </div>
  );
};

export default CoreMediaPlayer;
