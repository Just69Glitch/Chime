import React, { useState, useRef, useEffect } from "react";

interface RangeSlider {
  min?: number;
  max?: number;
  orientation?: "horizontal" | "vertical";
  canInteract?: boolean;
  value?: number;
  showTooltip?: boolean;
  formatTooltipValue?: (value: number) => string;
  onChange?: (value: number) => void;
  onInput?: (value: number) => void;
  onMouseDown?: (e: MouseEvent | React.MouseEvent) => void;
  onMouseUp?: (e: MouseEvent | React.MouseEvent) => void;
  onMouseOver?: (value: number, percentage: number, events: React.MouseEvent) => void;
  onMouseOverMove?: (value: number, percentage: number, events: React.MouseEvent) => void;
  onMouseLeave?: (value: number, percentage: number, events: React.MouseEvent) => void;
  barStyle?: React.CSSProperties;
  progressStyle?: React.CSSProperties;
  thumbStyle?: React.CSSProperties;
  onHoverStart?: (bar: HTMLDivElement, progress: HTMLDivElement, thumb: HTMLDivElement, current: "bar" | "progress" | "thumb") => void;
  onHoverEnd?: (bar: HTMLDivElement, progress: HTMLDivElement, thumb: HTMLDivElement, current: "bar" | "progress" | "thumb") => void;
  hoverTimeout?: [number, number] | { bar?: [number, number]; progress?: [number, number]; thumb?: [number, number]; };
}

const RangeSlider: React.FC<RangeSlider> = ({ min = 0, max = 1, orientation = "horizontal", canInteract = true, value: propValue, showTooltip = false, formatTooltipValue, onChange, onInput, onMouseDown, onMouseUp, onMouseOver, onMouseOverMove, onMouseLeave, barStyle = {}, progressStyle = {}, thumbStyle = {}, onHoverStart, onHoverEnd, hoverTimeout = [0, 0] }) => {
  const [value, setValue] = useState<number>(propValue ?? min);
  const [dragging, setDragging] = useState<boolean>(false);
  const [hovering, setHovering] = useState<boolean>(false);
  const hoverStartTimeout = useRef<NodeJS.Timeout | null>(null);
  const hoverEndTimeout = useRef<NodeJS.Timeout | null>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

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
    if (!dragging || !canInteract) return;
    const newValue = calculateValue(e);
    setValue(newValue);
    onChange?.(newValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canInteract) return;
    const newValue = calculateValue(e);
    onMouseDown?.(e);
    setValue(newValue);
    onChange?.(newValue);
    setDragging(true);
  };

  const handleMouseUp = (e: MouseEvent) => {
    onMouseUp?.(e);
    setDragging(false);
    onInput?.(value);
    if (!hovering) {
      handleOnMouseLeave("bar", true);
      handleOnMouseLeave("progress", true);
      handleOnMouseLeave("thumb", true);
    }
  };

  const handleOnMouseEnter = (current: "bar" | "progress" | "thumb") => {
    if (!canInteract) return;
    if (hoverEndTimeout.current) clearTimeout(hoverEndTimeout.current);
    const timeout = Array.isArray(hoverTimeout)
      ? hoverTimeout[0]
      : hoverTimeout?.[current]?.[0] ?? 0;

    if (timeout > 0) {
      hoverStartTimeout.current = setTimeout(() => {
        setHovering(true);
        if (!rangeRef.current || !progressRef.current || !thumbRef.current) return;
        onHoverStart?.(rangeRef.current, progressRef.current, thumbRef.current, current);
      }, timeout);
    } else {
      setHovering(true);
      if (!rangeRef.current || !progressRef.current || !thumbRef.current) return;
      onHoverStart?.(rangeRef.current, progressRef.current, thumbRef.current, current);
    }
  };

  const handleOnMouseLeave = (current: "bar" | "progress" | "thumb", forced: boolean = false) => {
    if (hoverStartTimeout.current) clearTimeout(hoverStartTimeout.current);
    const timeout = Array.isArray(hoverTimeout)
      ? hoverTimeout[1]
      : hoverTimeout?.[current]?.[1] ?? 0;
    if (timeout > 0) {
      hoverEndTimeout.current = setTimeout(() => {
        setHovering(false);
        if ((dragging && !forced) || !rangeRef.current || !progressRef.current || !thumbRef.current) return;
        onHoverEnd?.(rangeRef.current, progressRef.current, thumbRef.current, current);
      }, timeout);
    } else {
      setHovering(false);
      if ((dragging && !forced) || !rangeRef.current || !progressRef.current || !thumbRef.current) return;
      onHoverEnd?.(rangeRef.current, progressRef.current, thumbRef.current, current);
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

  useEffect(() => {
    return () => {
      if (hoverStartTimeout.current) clearTimeout(hoverStartTimeout.current);
      if (hoverEndTimeout.current) clearTimeout(hoverEndTimeout.current);
    };
  }, []);

  const progressDimension = orientation === "horizontal" ? { width: value <= min ? "0%" : `${((value - min) / (max - min)) * 100}%` } : { height: value <= min ? "0%" : `${((value - min) / (max - min)) * 100}%` };
  const thumbPosition = orientation === "horizontal" ? { left: value <= min ? "0%" : `${((value - min) / (max - min)) * 100}%` } : { bottom: value <= min ? "0%" : `${((value - min) / (max - min)) * 100}%` };
  const tooltipPosition = orientation === "horizontal" ? { left: value <= min ? "0%" : `${((value - min) / (max - min)) * 100}%` } : { bottom: value <= min ? "0%" : `${((value - min) / (max - min)) * 100}%` };
  return (
    <div
      ref={rangeRef}
      className={`relative flex items-center justify-center bg-gray-600 ${orientation === "horizontal" ? "w-full h-2" : "w-2 h-full"} ${canInteract ? "cursor-pointer" : "cursor-not-allowed"}`}
      style={barStyle}
      onMouseEnter={(e: React.MouseEvent) => {
        handleOnMouseEnter("bar");
        if (!canInteract) return;
        const newValue = calculateValue(e);
        onMouseOver?.(newValue, (newValue - min) / (max - min) * 100, e);
      }}
      onMouseLeave={(e: React.MouseEvent) => {
        handleOnMouseLeave("bar");
        const newValue = calculateValue(e);
        onMouseLeave?.(newValue, (newValue - min) / (max - min) * 100, e);
      }}
      onMouseMove={(e: React.MouseEvent) => {
        if (!canInteract) return;
        const newValue = calculateValue(e);
        onMouseOverMove?.(newValue, (newValue - min) / (max - min) * 100, e);
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        ref={progressRef}
        className={`absolute bg-gray-800 ${orientation === "horizontal" ? "h-full left-0" : "w-full bottom-0"}`}
        style={{
          ...progressStyle,
          ...progressDimension
        }}
        onMouseEnter={() => handleOnMouseEnter("progress")}
        onMouseLeave={() => handleOnMouseLeave("progress")}
      />
      <div
        ref={thumbRef}
        className={`absolute bg-gray-50 ${orientation === "horizontal" ? "h-[calc(100%+calc(100%-25%))] -translate-x-1/2" : "w-[calc(100%+calc(100%-25%))] translate-y-1/2"} aspect-square rounded-full`}
        style={{
          ...thumbStyle,
          ...thumbPosition,
        }}
        onMouseEnter={() => handleOnMouseEnter("thumb")}
        onMouseLeave={() => handleOnMouseLeave("thumb")}
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
