import { useState, useRef, useEffect, Fragment } from "react";
import { formatTime, generateThumbnails } from "@/utils/helper";
import { FaPlay, FaPause, FaStop } from "react-icons/fa";
import RangeSlider from "@/components/RangeSlider";

interface AudioTrackState {
  element: HTMLAudioElement;
  context: AudioContext;
  gainNode: GainNode;
  volume: number;
}

interface VideoFile {
  audioTracks: Array<{ id: number; volume: number; is_muted: boolean; path: string; }>;
  video: { md5_hash: string; volume: number; playback_speed: number; is_muted: boolean; current_seek_time: number; };
}

interface Props {
  onTitleChange: (title: string) => void;
}

const Home = ({ onTitleChange }: Props) => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [masterVolume, setMasterVolume] = useState<number>(0.2);
  const [videoThumbnailData, setVideoThumbnailData] = useState<string[]>([]);
  const transparentImage: string = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

  const [audioTracks, setAudioTracks] = useState<AudioTrackState[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoThumbnailRef = useRef<HTMLDivElement | null>(null);

  const loadVideoFile = async (files: FileList | undefined) => {
    if (!files?.length) return;

    if (files.length > 1) return alert("Not Supported multiple files (Soon)");
    const file = files[0];

    const filePath = await window.utils.getPathForFile(file);
    if (!filePath) return alert("Invalid file path");

    stop();
    const isFile = await window.utils.isFile(filePath);
    if (!isFile.status) return alert(isFile.error);

    const videoFile = await window.utils.getFile(filePath);
    if (!videoFile.status) return alert(videoFile.error);

    generateThumbnails(filePath, { width: 160, height: 90, quality: 0.7, maxThumbnails: 100 }).then((thumbnails) => {
      setVideoThumbnailData(thumbnails);
    });

    const fileData = videoFile.file as VideoFile;

    const newAudioTracks = fileData.audioTracks.map(track => createAudioTrack(track.path, track.volume));
    setVideoUrl(filePath);
    setAudioTracks(newAudioTracks);
    setSeekCurrentTime(videoFile.file.video.current_seek_time || 0);
    setDuration(0);
    setIsPaused(true);
    onTitleChange(filePath.split("\\").pop() || "");
  };

  const loadedVideoMetadata = () => {
    if (!videoRef.current || !videoUrl) return;
    const videoElement = videoRef.current;
    setDuration(videoElement.duration);
  };

  const createAudioTrack = (path: string, volume: number): AudioTrackState => {
    const element: HTMLAudioElement = new Audio(path);
    const context: AudioContext = new AudioContext();
    const source: MediaElementAudioSourceNode = context.createMediaElementSource(element);
    const gainNode: GainNode = context.createGain();
    source.connect(gainNode);
    gainNode.connect(context.destination);
    gainNode.gain.value = volume * masterVolume;
    return { element, context, gainNode, volume };
  };

  const cleanupAudioTracks = async () => {
    await Promise.all(
      audioTracks.map(async (track) => {
        track.element.pause();
        track.element.currentTime = 0;
        track.gainNode.disconnect();
        await track.context.close();
      })
    );
    setAudioTracks([]);
  };

  useEffect(() => {
    audioTracks.forEach(track => {
      track.gainNode.gain.value = track.volume * masterVolume;
    });
  }, [audioTracks, masterVolume]);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = videoRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      audioTracks.forEach(track => {
        track.element.currentTime = videoElement.currentTime;
      });
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [audioTracks]);

  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    const videoElement = videoRef.current;

    videoElement.addEventListener("loadedmetadata", loadedVideoMetadata);
    videoElement.load();

    return () => {
      videoElement.removeEventListener("loadedmetadata", loadedVideoMetadata);
    };
  }, [videoUrl]);

  useEffect(() => {
    const handleDefaultEvents = (e: DragEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      handleDefaultEvents(e);
      loadVideoFile(e?.dataTransfer?.files);
    };

    window.addEventListener("dragover", handleDefaultEvents);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDefaultEvents);
      window.removeEventListener("drop", handleDrop);
    };
  }, [videoUrl, audioTracks]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!videoThumbnailRef.current) return;
      const videoThumbnail = videoThumbnailRef.current;
      if (videoThumbnail.style.visibility === "hidden") return;
      const [firstChild, secondChild] = Array.from(videoThumbnail.children) as HTMLDivElement[];
      const firstChildRect = firstChild.getBoundingClientRect();
      const secondChildRect = secondChild.getBoundingClientRect();

      const mouseX = e.clientX;

      const windowWidth = window.innerWidth;

      const firstChildClampedX = Math.max(firstChildRect.width / 2, Math.min(mouseX, windowWidth - firstChildRect.width / 2));
      const secondChildClampedX = Math.max(secondChildRect.width / 2, Math.min(mouseX, windowWidth - secondChildRect.width / 2));

      firstChild.style.left = `${firstChildClampedX}px`;
      secondChild.style.left = `${secondChildClampedX}px`;
    };
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [videoThumbnailRef?.current?.style?.visibility]);

  const setSeekCurrentTime = (newTime: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    audioTracks.forEach(track => {
      track.element.currentTime = newTime;
    });
  };

  const handleSeekStart = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    audioTracks.forEach(track => track.element.pause());
  };

  const handleSeekEnd = () => {
    if (!videoRef.current || isPaused) return;
    videoRef.current.play();
    audioTracks.forEach(track => track.element.play());
  };

  const playPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        audioTracks.forEach(track => track.element.play());
      } else {
        videoRef.current.pause();
        audioTracks.forEach(track => track.element.pause());
      }
      setIsPaused(videoRef.current.paused);
    }
  };

  const stop = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.src = "";
    cleanupAudioTracks();
    setVideoThumbnailData([]);
    setVideoUrl("");
    setIsPaused(true);
    setCurrentTime(0);
    setDuration(0);
    onTitleChange("");

  };

  const handleVolumeChange = (index: number, value: number) => {
    setAudioTracks(tracks => tracks.map((track, i) => i === index ? { ...track, volume: value } : track));
  };

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
  };

  return (
    <div className="absolute bg-black w-full h-[calc(100%-32px)] top-8 flex flex-col overflow-hidden">
      {videoUrl &&
        <Fragment>
          <div className="relative flex flex-1 justify-center items-center bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
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
                    onChange={(value: number) => handleMasterVolumeChange(value)}
                    onInput={(value: number) => console.log(value)}
                  />
                  <span className="text-white mt-2">Master</span>
                </div>
                {
                  audioTracks.length > 1 &&
                  audioTracks.map((track, index) => (
                    <div key={index} className="flex h-24 flex-col items-center">
                      <RangeSlider
                        min={0}
                        max={1.5}
                        orientation="vertical"
                        canInteract={!!(videoUrl && videoRef && track)}
                        value={track.volume}
                        onChange={(value: number) => handleVolumeChange(index, value)}
                        onInput={(value: number) => console.log(value)}
                      />
                      <span className="text-white mt-2">Track {index + 1}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div
            ref={videoThumbnailRef}
            className="absolute bottom-28 w-full h-32 opacity-0 pointer-events-none"
            style={{ transition: "opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)" }}
          >
            <div className="absolute top-0 w-[160px] h-[90px] bg-black outline outline-2 outline-white rounded-md -translate-x-1/2">
              <img src={transparentImage} />
            </div>
            <div className="absolute bottom-0 w-[160px] flex justify-center -translate-x-1/2">
              <span className="bg-gray-700/60 text-white px-2 rounded"></span>
              <div className="absolute border-solid border-transparent top-full left-1/2 border-t-gray-700/60 border-t-8 border-l-8 border-r-8 -translate-x-1/2" />
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
            onChange={(value: number) => setSeekCurrentTime(value)}
            onInput={(value: number) => console.log(value)}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onMouseOver={(value) => {
              if (!videoThumbnailRef.current) return;
              const videoThumbnail = videoThumbnailRef.current;
              const [_, secondChild] = Array.from(videoThumbnail.children) as HTMLDivElement[];
              videoThumbnail.style.transition = "opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)";
              videoThumbnail.style.opacity = "1";
              secondChild.children[0].textContent = formatTime(value);
            }}
            onMouseLeave={() => {
              if (!videoThumbnailRef.current) return;
              const videoThumbnail = videoThumbnailRef.current;
              videoThumbnail.style.transition = "none";
              videoThumbnail.style.opacity = "0";
            }}
            onMouseOverMove={(value: number) => {
              if (!videoThumbnailRef.current) return;
              const videoThumbnail = videoThumbnailRef.current;
              const [firstChild, secondChild] = Array.from(videoThumbnail.children) as HTMLDivElement[];
              const image = firstChild.children[0] as HTMLImageElement;
              const index = Math.floor((value / duration) * videoThumbnailData.length);
              image.src = videoThumbnailData[index] || transparentImage;
              secondChild.children[0].textContent = formatTime(value);
            }}
            barStyle={{ borderRadius: "2px", transform: "scaleY(0.5)", transition: "transform 60ms ease-in-out" }}
            progressStyle={{ borderRadius: "2px" }}
            thumbStyle={{ scale: 0, outline: "0px solid rgba(255, 255, 255, 0.5)", transition: "scale 60ms ease-in-out, outline 60ms ease-in-out" }}
            hoverTimeout={{
              bar: [0, 1500],
              progress: [0, 0],
              thumb: [0, 0]
            }}
            onHoverStart={(bar: HTMLDivElement, progress: HTMLDivElement, thumb: HTMLDivElement, current: "bar" | "progress" | "thumb") => {
              if (current === "bar") {
                bar.style.transform = "scaleY(1)";
                bar.style.borderRadius = "4px";
                progress.style.borderRadius = "4px";
                thumb.style.scale = "1";
              } else if (current === "thumb") {
                thumb.style.outline = "8px solid rgba(255, 255, 255, 0.5)";
              }
            }}
            onHoverEnd={(bar: HTMLDivElement, progress: HTMLDivElement, thumb: HTMLDivElement, current: "bar" | "progress" | "thumb") => {
              if (current === "bar") {
                bar.style.transform = "scaleY(0.5)";
                bar.style.borderRadius = "2px";
                progress.style.borderRadius = "2px";
                thumb.style.scale = "0";
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
