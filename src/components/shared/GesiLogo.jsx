import React from "react";

export default function GesiLogo({ size = "md" }) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl"
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        <span className={`${sizes[size]} font-bold tracking-tight`}>
          <span className="text-white">g</span>
          <span className="text-white">.</span>
          <span className="text-white">e</span>
          <span className="text-white">.</span>
          <span className="text-white">s</span>
          <span className="text-white">.</span>
          <span className="text-white">i</span>
        </span>
        <span className="text-[#2dd4a8] mr-1 text-lg">⚡</span>
      </div>
      {size !== "sm" && (
        <span className="text-[10px] text-gray-400 leading-tight block mt-1">
          Invest For Your Future
        </span>
      )}
    </div>
  );
}