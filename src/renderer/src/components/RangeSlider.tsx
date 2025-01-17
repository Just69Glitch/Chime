import React, { useState, useRef, useEffect } from "react";

interface RangeSlider {
  min?: number;
  max?: number;
  orientation?: "horizontal" | "vertical";
  value?: number;
  showTooltip?: boolean;
  formatTooltipValue?: (value: number) => string;
  onChange?: (value: number) => void;
  onInput?: (value: number) => void;
  barStyle?: React.CSSProperties;
  progressStyle?: React.CSSProperties;
  numbStyle?: React.CSSProperties;
}

const RangeSlider: React.FC<RangeSlider> = ({ min = 0, max = 1, orientation = "horizontal", value: propValue, showTooltip = false, formatTooltipValue, onChange, onInput, barStyle = {}, progressStyle = {}, numbStyle = {} }) => {
  const [value, setValue] = useState<number>(propValue || min);
  const [dragging, setDragging] = useState<boolean>(false);
  const rangeRef = useRef<HTMLDivElement>(null);

  const calculateValue = (e: MouseEvent | React.MouseEvent) => {
    if (!rangeRef.current) return value;

    const rect: DOMRect = rangeRef.current.getBoundingClientRect();
    let percentage: number = 0;
    switch (orientation) {
      case "horizontal":
        percentage = (Math.min(Math.max(e.clientX - rect.left, 0), rect.width) / rect.width) * 100;
        break;
      case "vertical":
        percentage = (1 - Math.min(Math.max(e.clientY - rect.top, 0), rect.height) / rect.height) * 100;
        break;
      default:
    }

    return min + (percentage / 100) * (max - min);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    const newValue = calculateValue(e);
    setValue(newValue);
    if (onChange) onChange(newValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const newValue = calculateValue(e);
    setValue(newValue);
    if (onChange) onChange(newValue);
    setDragging(true);
  };

  const handleMouseUp = () => {
    setDragging(false);
    if (onInput) {
      onInput(value);
    }
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, value]);

  useEffect(() => {
    if (propValue !== undefined) {
      setValue(propValue);
    }
  }, [propValue]);

  const progressDimension = orientation === "horizontal" ? { width: `${((value - min) / (max - min)) * 100}%` } : { height: `${((value - min) / (max - min)) * 100}%` };
  const thumbPosition = orientation === "horizontal" ? { left: `${((value - min) / (max - min)) * 100}%` } : { bottom: `${((value - min) / (max - min)) * 100}%` };
  const tooltipPosition = orientation === "horizontal" ? { left: `${((value - min) / (max - min)) * 100}%` } : { bottom: `${((value - min) / (max - min)) * 100}%` };
  return (
    <div
      ref={rangeRef}
      className={`relative flex items-center justify-center ${orientation === "horizontal" ? "w-full h-2" : "w-2 h-full"} bg-white cursor-pointer`}
      style={barStyle}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`absolute bg-red-500 ${orientation === "horizontal" ? "h-full left-0" : "w-full bottom-0"}`}
        style={{ ...progressStyle, ...progressDimension }}
      />
      <div
        className={`absolute bg-blue-500 ${orientation === "horizontal" ? "h-[calc(100%+5px)] -translate-x-1/2" : "w-[calc(100%+5px)] translate-y-1/2"} aspect-square rounded-full`}
        style={{
          ...numbStyle,
          ...thumbPosition,
        }}
      />
      <div
        className={`absolute ${dragging && showTooltip ? "block" : "hidden"} bg-gray-700 text-white px-2 py-1 rounded ${orientation === "horizontal" ? "-translate-x-1/2 -translate-y-8" : "-translate-x-8 translate-y-1/2"}`}
        style={tooltipPosition}
      >
        {formatTooltipValue ? formatTooltipValue(value) : value.toFixed(0)}
        <div
          className={`absolute border-solid border-transparent ${orientation === "horizontal" ? "top-full left-1/2 border-t-gray-700 border-t-8 border-l-8 border-r-8 -translate-x-1/2" : "left-full top-1/2 border-l-gray-700 border-l-8 border-t-8 border-b-8 -translate-y-1/2"}`}
        />
      </div>
    </div>
  );
};

export default RangeSlider;
