import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ALL_COLUMNS = [
  { key: "full_name", label: "שם", fixed: true },
  { key: "phone", label: "טלפון" },
  { key: "email", label: "אימייל" },
  { key: "city", label: "עיר" },
  { key: "source", label: "מקור" },
  { key: "sales_stage", label: "שלב מכירה" },
  { key: "status", label: "סטטוס" },
  { key: "estimated_kwp", label: "kWp" },
  { key: "price_per_kwp", label: "₪/kWp" },
  { key: "roof_size_sqm", label: 'גג (מ"ר)' },
  { key: "property_type", label: "סוג נכס" },
  { key: "assigned_agent", label: "סוכן" },
  { key: "created_date", label: "תאריך יצירה" },
];

export default function LeadColumnManager({ visibleColumns, onChange }) {
  const [open, setOpen] = useState(false);

  const toggle = (key) => {
    if (visibleColumns.includes(key)) {
      onChange(visibleColumns.filter(k => k !== key));
    } else {
      onChange([...visibleColumns, key]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="הגדרת עמודות"
        className="p-2 rounded-lg bg-[#142e38] border border-[rgba(45,212,168,0.1)] text-gray-400 hover:text-[#2dd4a8] hover:border-[#2dd4a8]/30 transition-all"
      >
        <Settings2 className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              className="absolute left-0 top-10 w-56 rounded-xl shadow-xl z-50 p-3"
              style={{ background: '#0f2229', border: '1px solid rgba(45,212,168,0.15)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white">עמודות מוצגות</span>
                <button onClick={() => setOpen(false)}><X className="w-3.5 h-3.5 text-gray-500" /></button>
              </div>
              <div className="space-y-1">
                {ALL_COLUMNS.map(col => {
                  const active = visibleColumns.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      onClick={() => !col.fixed && toggle(col.key)}
                      disabled={col.fixed}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors
                        ${col.fixed ? 'opacity-50 cursor-default' : 'cursor-pointer hover:bg-[#142e38]'}
                        ${active ? 'text-white' : 'text-gray-500'}
                      `}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                        ${active ? 'bg-[#2dd4a8] border-[#2dd4a8]' : 'border-gray-600'}
                      `}>
                        {active && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                      </div>
                      {col.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}