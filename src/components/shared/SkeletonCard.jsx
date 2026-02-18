import React from "react";

export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="gesi-card p-5 space-y-3 animate-pulse">
      <div className="h-4 w-2/3 rounded skeleton-shimmer" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className="h-3 rounded skeleton-shimmer" style={{ width: `${70 - i * 15}%` }} />
      ))}
    </div>
  );
}