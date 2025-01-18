import { GoDash } from "react-icons/go";
import { RiCloseFill, RiCheckboxMultipleBlankLine, RiSquareLine } from "react-icons/ri";
import { handleMinimize, handleMaximize, handleClose, useWindowMaximizeState } from "@/hooks/appWindow";

const Titlebar: React.FC<{ title: string; }> = ({ title }) => {
  const isMaximized = useWindowMaximizeState();

  return (
    <div className="z-50 h-8 fixed bg-blue-500/20 w-full flex justify-between items-center region-drag">
      <div className=" region-drag-none flex items-center space-x-4 pl-4 whitespace-pre">
        <span className="text-lg text-white">Chime Media Player</span>
        <span className="text-xs text-white/80">{title && `${title}`}</span>
      </div>
      <div className="flex justify-end items-center h-full text-white region-drag-none">
        <button
          className="relative h-full w-12 hover:bg-background-50/10 flex justify-center items-center "
          tabIndex={-1}
          onClick={handleMinimize}
        >
          <GoDash size={18} />
        </button>
        <button
          className="relative h-full w-12 hover:bg-background-50/10 flex justify-center items-center region-drag-none"
          tabIndex={-1}
          onClick={handleMaximize}
        >
          {isMaximized ? <RiCheckboxMultipleBlankLine size={18} /> : <RiSquareLine size={18} />}
        </button>
        <button
          className="relative h-full w-12 hover:bg-red-500 flex justify-center items-center region-drag-none"
          tabIndex={-1}
          onClick={handleClose}
        >
          <RiCloseFill size={18} />
        </button>
      </div>
    </div>
  );
};

export default Titlebar;
