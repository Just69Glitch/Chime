import { useState } from "react";
import CoreMediaPlayer from "@/components/CoreMediaPlayer";
import Titlebar from "@/components/Titlebar";
import VideoWrapper from "@/components/VideoWrapper";
import { VideoProvider } from "@/context/VideoContext";
import DropZone from "@/components/DropZone";

const Home = () => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  return (
    <VideoProvider>
      <div className="absolute bg-black w-full h-[calc(100%-32px)] top-8 flex flex-col overflow-hidden">
        <DropZone updateVideoUrl={setVideoUrl} />
        {videoUrl && <VideoWrapper videoUrl={videoUrl} />}
        <Titlebar />
        <CoreMediaPlayer />
      </div>
    </VideoProvider>
  );
};

export default Home;
