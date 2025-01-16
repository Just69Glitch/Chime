import { useEffect } from "react";
import { useVideoContext } from "@/context/VideoContext";

interface VideoWrapperProps {
  videoUrl: string;
}

const VideoWrapper: React.FC<VideoWrapperProps> = ({ videoUrl }) => {
  const { videoRef } = useVideoContext();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.muted = true;
    }
  }, [videoUrl, videoRef]);

  return (
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
  );
};

export default VideoWrapper;
