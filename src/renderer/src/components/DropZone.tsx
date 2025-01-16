import { useEffect, useState } from "react";

interface DropZoneProps {
  updateVideoUrl: (videoUrl: string) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ updateVideoUrl }) => {
  const [fileDropped, setFileDropped] = useState(false);

  useEffect(() => {
    const handleDragOver = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const files = e.dataTransfer.files;
      setFileDropped((prev) => !prev);
      for (const file of files) {
        const filePath = await window.utils.getPathForFile(file);
        if (!filePath) return alert("Invalid file path");
        const videoFile = await window.utils.isFile(filePath);
        if (!videoFile.isValid) return alert(videoFile.error);
        console.log(videoFile);
        //const audio = new Audio(videoFile?.file?.audioTracks[0]?.path);
        //const audio2 = new Audio(videoFile?.file?.audioTracks[1]?.path);
        updateVideoUrl(filePath);
      };
    };

    // Attach global event listeners
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    // Cleanup event listeners when the component unmounts
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [fileDropped]); // Trigger effect when key changes

  return null;
};

export default DropZone;
