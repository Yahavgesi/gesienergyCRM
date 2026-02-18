import React from "react";

export default function GesiLogo({ size = "md" }) {
  const heights = {
    sm: "h-8",
    md: "h-10",
    lg: "h-16"
  };

  return (
    <img 
      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6995ed5199090d8bd1c5003b/11a5751fa_Artboard1copy3.png"
      alt="Gesi Logo"
      className={`${heights[size]} w-auto object-contain`}
    />
  );
}