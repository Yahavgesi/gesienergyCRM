import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { ExternalLink, Edit2, PanelRight } from "lucide-react";

export default function LeadRowActions({ lead, onEditInline, onOpenDrawer }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
      <button
        title="פתח כרטיס"
        onClick={() => navigate(createPageUrl(`LeadCard?id=${lead.id}`))}
        className="p-1.5 rounded-lg hover:bg-[#2dd4a8]/10 text-gray-400 hover:text-[#2dd4a8] transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
      </button>
      <button
        title="עריכה מהירה"
        onClick={() => onEditInline(lead)}
        className="p-1.5 rounded-lg hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 transition-colors"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        title="פרטים מהירים"
        onClick={() => onOpenDrawer(lead)}
        className="p-1.5 rounded-lg hover:bg-purple-500/10 text-gray-400 hover:text-purple-400 transition-colors"
      >
        <PanelRight className="w-4 h-4" />
      </button>
    </div>
  );
}