import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

/**
 * Generic side drawer.
 * Props:
 *   record      - the row object
 *   onClose     - close callback
 *   title       - main title (string or fn(record))
 *   subtitle    - optional badge/subtitle text
 *   subtitleColor - hex color for badge
 *   fields      - [{ label, render: (record) => node/string }]
 *   cardPage    - page name to navigate to (e.g. "ProjectCard")
 *   cardIdParam - how to build the ?id= param (e.g. record.id)
 *   avatar      - fn(record) => letter to show in circle
 *   avatarColor - gradient start hex
 *   extraContent - optional React node rendered at bottom of content
 */
export default function SideDrawer({
  record, onClose, title, subtitle, subtitleColor = "#2dd4a8",
  fields = [], cardPage, cardIdParam, avatar, avatarColor = "#2dd4a8", extraContent
}) {
  const navigate = useNavigate();
  if (!record) return null;

  const titleStr = typeof title === 'function' ? title(record) : title;
  const avatarLetter = avatar ? avatar(record) : titleStr?.[0] || '?';

  const goToCard = () => {
    if (!cardPage) return;
    const param = cardIdParam || record.id;
    navigate(createPageUrl(`${cardPage}?id=${param}`));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <motion.div
        initial={{ x: -400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -400, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed top-0 left-0 h-full w-80 z-50 flex flex-col shadow-2xl"
        style={{ background: '#0d1f26', borderRight: '1px solid rgba(45,212,168,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-start justify-between gap-3"
          style={{ borderColor: 'rgba(45,212,168,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` }}>
              {avatarLetter}
            </div>
            <div>
              <h3 className="text-white font-bold text-base leading-tight">{titleStr}</h3>
              {subtitle && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                  style={{ background: `${subtitleColor}20`, color: subtitleColor }}>
                  {subtitle}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          <div className="rounded-xl bg-[#142e38]/60 p-3 space-y-2">
            {fields.map((f, i) => {
              const val = typeof f.render === 'function' ? f.render(record) : record[f.key];
              return (
                <div key={i} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                  <span className="text-xs text-gray-500">{f.label}</span>
                  <span className="text-xs text-white font-medium text-left max-w-[55%] truncate">
                    {val || '—'}
                  </span>
                </div>
              );
            })}
          </div>
          {extraContent}
        </div>

        {/* Footer */}
        {cardPage && (
          <div className="p-4 border-t" style={{ borderColor: 'rgba(45,212,168,0.1)' }}>
            <Button onClick={goToCard}
              className="w-full text-white flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
              <ExternalLink className="w-4 h-4" /> פתח כרטיס מלא
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}