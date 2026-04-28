import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

const inputCls = "h-8 text-xs bg-[#0a1a1f] border-[rgba(45,212,168,0.2)] text-white";

/**
 * Generic side drawer with inline editing.
 * Props:
 *   record        - the row object
 *   onClose       - close callback
 *   onSave        - fn(draft) called when saving
 *   title         - string or fn(record)
 *   subtitle      - string
 *   subtitleColor - hex
 *   sections      - [{ title, fields: [{ key, label, type?, options?, render? }] }]
 *   cardPage      - page path to navigate to
 *   avatar        - fn(record) => letter
 *   avatarColor   - hex
 */
export default function SideDrawer({
  record, onClose, onSave,
  title, subtitle, subtitleColor = "#2dd4a8",
  sections = [], cardPage, avatar, avatarColor = "#2dd4a8",
}) {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  if (!record) return null;

  const titleStr = typeof title === 'function' ? title(record) : title;
  const avatarLetter = avatar ? avatar(record) : titleStr?.[0] || '?';
  const current = { ...record, ...draft };

  const set = (key, val) => setDraft(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditMode(false);
    setDraft({});
  };

  const goToCard = () => {
    if (!cardPage) return;
    // cardPage can be "ProjectCard" (we add ?id=) or "CompanyCard/id" (full path)
    const url = cardPage.includes('/') ? cardPage : `${cardPage}?id=${record.id}`;
    navigate(createPageUrl(url));
  };

  const renderField = (field) => {
    const val = current[field.key];
    if (!editMode) {
      const display = field.render ? field.render(current) : (val || '—');
      return (
        <div key={field.key} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
          <span className="text-xs text-gray-500">{field.label}</span>
          <span className="text-xs text-white font-medium text-left max-w-[58%] truncate">{display}</span>
        </div>
      );
    }

    // Edit mode
    if (field.readOnly || field.render) {
      const display = field.render ? field.render(record) : (record[field.key] || '—');
      return (
        <div key={field.key} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
          <span className="text-xs text-gray-500">{field.label}</span>
          <span className="text-xs text-gray-400 italic">{display}</span>
        </div>
      );
    }

    if (field.type === 'select' && field.options) return (
      <div key={field.key} className="space-y-1 py-1 border-b border-white/5 last:border-0">
        <span className="text-xs text-gray-500">{field.label}</span>
        <Select value={draft[field.key] ?? record[field.key] ?? ''} onValueChange={v => set(field.key, v)}>
          <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#142e38] border-[rgba(45,212,168,0.15)]">
            {field.options.map(o => <SelectItem key={o.value} value={o.value} className="text-xs text-gray-300">{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );

    if (field.type === 'number') return (
      <div key={field.key} className="space-y-1 py-1 border-b border-white/5 last:border-0">
        <span className="text-xs text-gray-500">{field.label}</span>
        <Input type="number" value={draft[field.key] ?? record[field.key] ?? ''} onChange={e => set(field.key, e.target.value)} className={inputCls} />
      </div>
    );

    if (field.type === 'date') return (
      <div key={field.key} className="space-y-1 py-1 border-b border-white/5 last:border-0">
        <span className="text-xs text-gray-500">{field.label}</span>
        <Input type="date" value={draft[field.key] ?? record[field.key] ?? ''} onChange={e => set(field.key, e.target.value)} className={inputCls} />
      </div>
    );

    if (field.type === 'textarea') return (
      <div key={field.key} className="space-y-1 py-1 border-b border-white/5 last:border-0">
        <span className="text-xs text-gray-500">{field.label}</span>
        <textarea value={draft[field.key] ?? record[field.key] ?? ''} onChange={e => set(field.key, e.target.value)}
          className="w-full bg-[#0a1a1f] border border-[rgba(45,212,168,0.2)] rounded-md text-white text-xs p-2 min-h-[60px] resize-none" />
      </div>
    );

    return (
      <div key={field.key} className="space-y-1 py-1 border-b border-white/5 last:border-0">
        <span className="text-xs text-gray-500">{field.label}</span>
        <Input value={draft[field.key] ?? record[field.key] ?? ''} onChange={e => set(field.key, e.target.value)} className={inputCls} />
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <motion.div
        initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed top-0 right-0 h-full z-50 flex flex-col shadow-2xl"
        style={{ background: '#0d1f26', borderLeft: '1px solid rgba(45,212,168,0.12)', width: '340px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-start justify-between gap-3"
          style={{ borderColor: 'rgba(45,212,168,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}bb)` }}>
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
          <div className="flex items-center gap-1">
            {editMode ? (
              <button onClick={handleSave} disabled={saving}
                className="p-1.5 rounded-lg bg-[#2dd4a8]/10 text-[#2dd4a8] hover:bg-[#2dd4a8]/20 transition-colors">
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => { setDraft({}); setEditMode(true); }}
                className="p-1.5 rounded-lg hover:bg-[#142e38] text-gray-400 hover:text-white transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {sections.map((section, si) => (
            <div key={si} className="rounded-xl bg-[#142e38]/60 p-3">
              {section.title && (
                <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-3">{section.title}</p>
              )}
              <div className={editMode ? "space-y-2" : ""}>
                {section.fields.map(field => renderField(field))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cardPage && (
          <div className="p-4 border-t flex gap-2" style={{ borderColor: 'rgba(45,212,168,0.1)' }}>
            {editMode && (
              <Button variant="outline" onClick={() => { setEditMode(false); setDraft({}); }}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-[#142e38] text-xs">
                ביטול
              </Button>
            )}
            <Button
              onClick={editMode ? handleSave : goToCard}
              disabled={saving}
              className="flex-1 text-white flex items-center justify-center gap-2 text-xs"
              style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}
            >
              {editMode ? (saving ? 'שומר...' : 'שמור שינויים') : <><ExternalLink className="w-4 h-4" /> פתח כרטיס מלא</>}
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}