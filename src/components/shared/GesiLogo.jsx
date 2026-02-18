import React from "react";

export default function GesiLogo({ size = "md", className = "" }) {
  const heights = {
    sm: "h-7",
    md: "h-12",
    lg: "h-20"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6995ed5199090d8bd1c5003b/11a5751fa_Artboard1copy3.png"
        alt="Gesi Logo"
        className={`${heights[size]} w-auto object-contain brightness-110 contrast-110 transition-all duration-300 hover:brightness-125`}
        style={{ 
          filter: 'drop-shadow(0 0 12px rgba(45, 212, 168, 0.15))',
          imageRendering: 'crisp-edges'
        }}
      />
    </div>
  );
}