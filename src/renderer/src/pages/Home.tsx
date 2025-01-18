import { useState, useRef, useEffect, Fragment } from "react";
import { formatTime } from "@/utils/helper";
import { FaPlay, FaPause, FaStop } from "react-icons/fa";
import RangeSlider from "@/components/RangeSlider";

const Home = ({ onTitleChange }: { onTitleChange: (title: string) => void; }) => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [audioTracks, setAudioTracks] = useState<HTMLAudioElement[]>([]);
  const [audioTracksVolume, setAudioTracksVolume] = useState<number[]>([]);
  const [masterVolume, setMasterVolume] = useState(1);
  const [audioContexts, setAudioContexts] = useState<AudioContext[]>([]);
  const [gainNodes, setGainNodes] = useState<GainNode[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.src = videoUrl;
    videoRef.current.muted = true;
    setIsPaused(true);
    // Reset audio track volumes and sliders when a new video is loaded
    audioContexts.forEach(context => {
      context.close().catch(() => { });
    });
    setAudioContexts([]);
    setGainNodes([]);
    setAudioTracksVolume([]);
    if (audioTracks.length > 0) {
      audioTracks.forEach((audioTrack, _) => {
        audioTrack.pause();
        audioTrack.currentTime = 0;
      });
    }

    // Stop all audio tracks when a new video is loaded
    return () => {
      setAudioTracksVolume([]);
      audioTracks.forEach((audioTrack) => {
        audioTrack.pause();
        audioTrack.currentTime = 0; // Reset the audio track to start position
      });
      audioContexts.forEach(context => {
        context.close().catch(() => { });
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
    if (audioTracks.length > 0) {
      const initialVolumes = audioTracks.map((audioTrack) => audioTrack.volume);
      setAudioTracksVolume(initialVolumes);
    }
  }, [audioTracks]);

  useEffect(() => {
    // Clean up existing contexts first
    audioContexts.forEach(context => {
      context.close().catch(() => { });
    });
    setAudioContexts([]);
    setGainNodes([]);

    // Create new contexts and nodes for each track
    const newContexts: AudioContext[] = [];
    const newGainNodes: GainNode[] = [];

    audioTracks.forEach((audioTrack) => {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(audioTrack);
      const gainNode = audioContext.createGain();

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      newContexts.push(audioContext);
      newGainNodes.push(gainNode);
    });

    setAudioContexts(newContexts);
    setGainNodes(newGainNodes);

    // Set initial volumes
    const initialVolumes = audioTracks.map(() => 1);
    setAudioTracksVolume(initialVolumes);

    return () => {
      newContexts.forEach(context => {
        context.close().catch(() => { });
      });
    };
  }, [audioTracks]);

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
        onTitleChange(filePath.split("\\").pop() || "");
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
    if (!videoRef.current) return;
    videoRef.current.pause();
    audioTracks.forEach((audioTrack) => {
      audioTrack.pause();
    });
  };

  const handleSeekEnd = () => {
    if (!videoRef.current || isPaused) return;
    videoRef.current.play();
    audioTracks.forEach((audioTrack) => {
      audioTrack.play();
    });

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

  const stop = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.src = "";
      videoRef.current.pause();
      setIsPaused(true);
      setCurrentTime(0);
      setDuration(0);
      setVideoUrl("");
      onTitleChange("");
      // Stop all audio tracks
      audioTracks.forEach((audioTrack) => {
        audioTrack.pause();
        audioTrack.currentTime = 0;
      });
      setAudioTracks([]);
    }
  };

  const handleVolumeChange = (index: number, value: number) => {
    setAudioTracksVolume((prev) => {
      const updatedVolumes = [...prev];
      updatedVolumes[index] = value;
      if (gainNodes[index]) gainNodes[index].gain.value = value * masterVolume;
      //audioTracks[index].volume = value; Not supported as it can not go past 1
      return updatedVolumes;
    });
  };

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
  };

  useEffect(() => {
    audioTracks.forEach((_, index) => {
      if (gainNodes[index]) gainNodes[index].gain.value = audioTracksVolume[index] * masterVolume;
      // audioTrack.volume = audioTracksVolume[index] * masterVolume;  Not supported as it can not go past 1
    });
  }, [audioTracksVolume, masterVolume]);

  return (
    <div className="absolute bg-black w-full h-[calc(100%-32px)] top-8 flex flex-col overflow-hidden">
      {videoUrl &&
        <Fragment>
          <div className="relative flex flex-1 justify-center items-center bg-black">
            <video
              ref={videoRef}
              controls={false}
              className="absolute w-full h-full object-container"
              muted={true}
            />
          </div>
          <div className="absolute z-30 bottom-28 h-24 bg-gradient-to-t from-background-900 to-transparent px-10 flex flex-wrap items-end rounded-t-md">
            <div className="flex flex-row space-x-4">
              <div className="flex flex-row space-x-2">
                <div key="master-volume" className="flex h-24 flex-col items-center">
                  <RangeSlider
                    min={0}
                    max={1.5}
                    orientation="vertical"
                    canInteract={!!(videoUrl && videoRef)}
                    value={masterVolume}
                    showTooltip={false}
                    onChange={(value: number) => handleMasterVolumeChange(value)}
                    onInput={(value: number) => console.log(value)}
                  />
                  <span className="text-white mt-2">Master</span>
                </div>
                {audioTracks.map((_, index) => (
                  <div key={index} className="flex h-24 flex-col items-center">
                    <RangeSlider
                      min={0}
                      max={1.5}
                      orientation="vertical"
                      canInteract={!!(videoUrl && videoRef && audioTracks[index])}
                      value={audioTracksVolume[index]}
                      showTooltip={false}
                      onChange={(value: number) => handleVolumeChange(index, value)}
                      onInput={(value: number) => console.log(value)}
                    />
                    <span className="text-white mt-2">Track {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Fragment>
      }
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-background-900 to-transparent px-10 flex flex-wrap items-end rounded-t-md">
        <div className="w-full h-2/6 flex items-end space-x-4 z-10">
          <RangeSlider
            min={0}
            max={duration}
            orientation="horizontal"
            canInteract={!!(videoUrl && videoRef)}
            value={currentTime}
            showTooltip={true}
            formatTooltipValue={(value: number) => {
              return `${formatTime(value)}`;
            }}
            onChange={(value: number) => setSeekCurrentTime(value)}
            onInput={(value: number) => console.log(value)}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            barStyle={{ borderRadius: "2px", transform: "scaleY(0.5)", transition: "transform 60ms ease-in-out" }}
            progressStyle={{ borderRadius: "4px" }}
            thumbStyle={{ visibility: "hidden", outline: "0px solid rgba(255, 255, 255, 0.5)", transition: "outline 60ms ease-in-out" }}
            hoverTimeout={{
              bar: [0, 1500],
              progress: [0, 0],
              thumb: [0, 0]
            }}
            onHoverStart={(bar: HTMLDivElement, _: HTMLDivElement, thumb: HTMLDivElement, current: "bar" | "progress" | "thumb") => {
              if (current === "bar") {
                bar.style.transform = "scaleY(1)";
                bar.style.borderRadius = "4px";
                thumb.style.visibility = "visible";
              } else if (current === "thumb") {
                thumb.style.outline = "8px solid rgba(255, 255, 255, 0.5)";
              }
            }}
            onHoverEnd={(bar: HTMLDivElement, _: HTMLDivElement, thumb: HTMLDivElement, current: "bar" | "progress" | "thumb") => {
              if (current === "bar") {
                bar.style.transform = "scaleY(0.5)";
                bar.style.borderRadius = "2px";
                thumb.style.visibility = "hidden";
              } else if (current === "thumb") {
                thumb.style.outline = "0px solid rgba(255, 255, 255, 0.5)";
              }
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
              onClick={stop}
              className="text-text-50"
            >
              <FaStop size={20} />
            </button>
          }
        </div>
        <div className="w-3/5 h-4/6 flex items-center space-x-2">
          <span className="w-full text-text-50 flex justify-center">
            Work In Progress
          </span>
        </div>
      </div>
    </div>
  );
};

export default Home;
