import { useState } from "react";
import type { ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  type?: "error" | "success" | "info" | "warning";
}

export default function Tooltip({ 
  content, 
  children, 
  position = "top",
  type = "info" 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent";
      case "bottom":
        return "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent";
      case "left":
        return "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent";
      case "right":
        return "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent";
      default:
        return "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent";
    }
  };

  const getTypeClasses = () => {
    switch (type) {
      case "error":
        return "bg-red-600 text-white border-red-600";
      case "success":
        return "bg-green-600 text-white border-green-600";
      case "warning":
        return "bg-orange-500 text-white border-orange-500";
      case "info":
      default:
        return "bg-[#2F6C92] text-white border-[#2F6C92]";
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div className={`absolute z-50 ${getPositionClasses()}`}>
          <div className={`px-3 py-2 text-xs rounded-lg shadow-lg whitespace-nowrap max-w-xs ${getTypeClasses()}`}>
            {content}
            <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()} ${getTypeClasses().split(' ')[0].replace('bg-', 'border-t-')}`}></div>
          </div>
        </div>
      )}
    </div>
  );
}
