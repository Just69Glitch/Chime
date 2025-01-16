// components/VideoContext.tsx
import React, { createContext, useContext, useRef } from "react";

interface VideoContextType {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode; }> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  return (
    <VideoContext.Provider value={{ videoRef }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = (): VideoContextType => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideoContext must be used within a VideoProvider");
  }
  return context;
};
