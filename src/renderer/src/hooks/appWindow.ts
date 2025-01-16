import { useState, useEffect } from "react";

export const handleMinimize = () => window.appWindow.minimizeWindow();

export const handleMaximize = () => window.appWindow.toggleMaximizeWindow();

export const handleClose = () => window.appWindow.closeWindow();

export const useWindowMaximizeState = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const handleMaximize = () => setIsMaximized(true);
    const handleUnmaximize = () => setIsMaximized(false);

    window.appWindow.onMaximize(handleMaximize);
    window.appWindow.onUnmaximize(handleUnmaximize);

    return () => {
      window.appWindow.removeMaximizeListeners();
    };
  }, []);

  return isMaximized;
};

