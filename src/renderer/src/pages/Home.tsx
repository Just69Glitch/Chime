import { useState, useRef, useEffect, Fragment } from "react";
import { formatTime } from "@/utils/helper";
import { FaPlay, FaPause, FaStop } from "react-icons/fa";
import RangeSlider from "@/components/RangeSlider";


const Home = () => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [audioTracks, setAudioTracks] = useState<HTMLAudioElement[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.src = videoUrl;
    videoRef.current.muted = true;
    setIsPaused(true);
    // Reset audio track volumes and sliders when a new video is loaded
    if (audioTracks.length > 0) {
      audioTracks.forEach((audioTrack, index) => {
        audioTrack.pause();
        audioTrack.currentTime = 0; // Reset the audio track to start position
        const slider = document.querySelectorAll(`.audio-slider`)[index];
        if (slider) {
          (slider as HTMLInputElement).value = String(audioTrack.volume);
        }
      });
    }

    // Stop all audio tracks when a new video is loaded
    return () => {
      audioTracks.forEach((audioTrack) => {
        audioTrack.pause();
        audioTrack.currentTime = 0; // Reset the audio track to start position
      });
    };
  }, [videoUrl]);

  useEffect(() => {
    if (!videoRef.current) return;
    const handleTimeUpdate = () => {
      if (!videoRef.current) return;
      setCurrentTime(videoRef.current.currentTime);
      audioTracks.forEach((audioTrack) => {
        audioTrack.currentTime = videoRef.current!.currentTime;
      });
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

  }, [videoUrl, videoRef]);

  useEffect(() => {
    const handleDragOver = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const files = e.dataTransfer.files;
      for (const file of files) {
        const filePath = await window.utils.getPathForFile(file);
        if (!filePath) return alert("Invalid file path");
        const isFile = await window.utils.isFile(filePath);
        if (!isFile.status) return alert(isFile.error);
        const videoFile = await window.utils.getFile(filePath);
        if (!videoFile.status) return alert(videoFile.error);
        const audioElements: HTMLAudioElement[] = [];
        if (videoFile.file && videoFile.file.audioTracks && videoFile.file.audioTracks.length > 0) {
          for (let i = 0; i < videoFile.file.audioTracks.length; i++) {
            const audioTrack = videoFile.file.audioTracks[i];
            const audioElement = new Audio(audioTrack.path);
            audioElement.volume = audioTrack.volume;
            audioElements.push(audioElement);
          }
        }
        setVideoUrl(filePath);
        setAudioTracks(audioElements);
        setSeekCurrentTime(videoFile.file.video.current_seek_time || 0);
      };
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  const handleSeekBarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    setSeekCurrentTime(newTime);
  };

  const setSeekCurrentTime = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      audioTracks.forEach((audioTrack) => {
        audioTrack.currentTime = newTime;
      });
    }
  };

  const handleSeekStart = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      audioTracks.forEach((audioTrack) => {
        audioTrack.pause();
      });
    }
  };

  const handleSeekEnd = () => {
    if (videoRef.current && !isPaused) {
      videoRef.current.play();
      audioTracks.forEach((audioTrack) => {
        audioTrack.play();
      });
    }
  };

  const playPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        // Play all audio tracks
        audioTracks.forEach((audioTrack) => {
          audioTrack.play();
        });
      } else {
        videoRef.current.pause();
        // Pause all audio tracks
        audioTracks.forEach((audioTrack) => {
          audioTrack.pause();
        });
      }
      setIsPaused(videoRef.current.paused);
    }
  };

  const playStop = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.src = "";
      videoRef.current.pause();
      setIsPaused(true);
      setCurrentTime(0);
      setDuration(0);
      setVideoUrl("");
      // Stop all audio tracks
      audioTracks.forEach((audioTrack) => {
        audioTrack.pause();
        audioTrack.currentTime = 0;
      });
      setAudioTracks([]);
    }
  };

  const handleVolumeChange = (index: number, value: number) => {
    if (audioTracks[index]) {
      audioTracks[index].volume = value;
    }
  };

  return (
    <div className="absolute bg-black w-full h-[calc(100%-32px)] top-8 flex flex-col overflow-hidden">
      {videoUrl &&
        <Fragment>
          <div className="relative flex flex-1 justify-center items-center bg-black">
            <img
              src="../assets/sample.jpg"
              alt="Logo"
              className="absolute max-h-20 object-container"
            />
            <video
              ref={videoRef}
              controls={false}
              className="absolute w-full h-full object-container"
              muted={true}
            />
          </div>
          <div className="absolute z-30 bottom-30 h-24 bg-gradient-to-t from-background-900 to-transparent px-10 flex flex-wrap items-end rounded-t-md">
            <div className="flex flex-row space-x-4">
              <div className="flex flex-row space-x-2">
                {audioTracks.map((_, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      defaultValue="0"
                      className="audio-slider w-20 h-1 -rotate-90 appearance-none bg-gray-400"
                      onChange={(e) => handleVolumeChange(index, parseFloat(e.target.value))}
                    />
                    <span className="text-white mt-2">Track {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Fragment>
      }
      <div className="absolute top-0 w-full h-10 bg-gradient-to-b from-background-900 to-transparent px-10 flex flex-wrap items-center">
        TITLE BAR
      </div>
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
        <div className="w-2/5 h-4/6 flex items-center space-x-5">
          <button
            onClick={playPause}
            className="text-text-50"
          >
            {isPaused ? <FaPlay size={20} /> : <FaPause size={20} />}
          </button>
          {videoUrl &&
            <button
              onClick={playStop}
              className="text-text-50"
            >
              <FaStop size={20} />
            </button>
          }
        </div>
        <div className="w-3/5 h-4/6 flex items-center space-x-2">
          <span className="w-full text-text-50 flex justify-center">
            Work On Progress
          </span>
        </div>
      </div>
      <div className="absolute w-60 h-28 top-20 left-32 bg-red-100/20 p-3">
        <RangeSlider
          min={0}
          max={200}
          showTooltip={true}
          formatTooltipValue={(value: number) => {
            return `${formatTime(value)}`;
          }}
          onChange={(value) => console.log(value)}
        />
      </div>
      <div className="absolute w-10 h-28 top-20 left-10 bg-red-100/20 p-3">
        <RangeSlider
          min={0}
          max={100}
          orientation="vertical"
          onChange={(value) => console.log(value)}
          progressStyle={{ background: "linear-gradient(to top, #00a2ed 0%, #00a2ed 80%, #ffffff 100%)" }}
        />
      </div>
    </div>
  );
};

export default Home;
