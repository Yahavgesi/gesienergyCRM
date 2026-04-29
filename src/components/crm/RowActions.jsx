import React from "react";
import { ExternalLink, Edit2, PanelRight } from "lucide-react";

export default function RowActions({ onOpen, onEdit, onDrawer }) {
  return (
    <div
      className="flex items-center gap-1"
      onClick={e => e.stopPropagation()}
    >
      <button
        title="פתח כרטיס"
        onClick={onOpen}
        className="p-1.5 rounded-lg hover:bg-[#2dd4a8]/10 text-gray-400 hover:text-[#2dd4a8] transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
      </button>
      <button
        title="עריכה מהירה"
        onClick={onEdit}
        className="p-1.5 rounded-lg hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 transition-colors"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        title="פרטים מהירים"
        onClick={onDrawer}
        className="p-1.5 rounded-lg hover:bg-purple-500/10 text-gray-400 hover:text-purple-400 transition-colors"
      >
        <PanelRight className="w-4 h-4" />
      </button>
    </div>
  );
}