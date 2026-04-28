import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { X, Phone, Mail, MapPin, Zap, ExternalLink, TrendingUp, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const STAGE_LABELS = {
  new_lead: "ליד חדש", initial_contact: "יצירת קשר", site_survey: "סיור באתר",
  quote_sent: "הצעת מחיר", negotiation: "משא ומתן", closing: "סגירה",
  won: "נסגר בהצלחה", lost: "אבוד",
};
const STAGE_COLORS = {
  new_lead: "#94a3b8", initial_contact: "#60a5fa", site_survey: "#a78bfa",
  quote_sent: "#fbbf24", negotiation: "#fb923c", closing: "#22c55e",
  won: "#2dd4a8", lost: "#ef4444",
};
const SOURCE_LABELS = {
  website: "אתר", referral: "הפניה", facebook: "פייסבוק",
  google: "גוגל", phone: "טלפון", walk_in: "פנה ישירות", other: "אחר",
};

const inputCls = "h-8 text-xs bg-[#0a1a1f] border-[rgba(45,212,168,0.2)] text-white";

export default function LeadSideDrawer({ lead, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  if (!lead) return null;

  const stageColor = STAGE_COLORS[lead.sales_stage] || "#64748b";
  const current = editMode ? { ...lead, ...draft } : lead;

  const set = (key, val) => setDraft(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Lead.update(lead.id, draft);
    queryClient.invalidateQueries({ queryKey: ['crm-leads'] });
    setSaving(false);
    setEditMode(false);
    setDraft({});
  };

  return (
    <AnimatePresence>
      {lead && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-84 z-50 flex flex-col shadow-2xl"
            style={{ background: '#0d1f26', borderLeft: '1px solid rgba(45,212,168,0.12)', width: '340px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b flex items-start justify-between gap-3"
              style={{ borderColor: 'rgba(45,212,168,0.1)' }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2dd4a8] to-[#1fa882] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {lead.full_name?.[0] || "?"}
                </div>
                <div>
                  <h3 className="text-white font-bold text-base leading-tight">{lead.full_name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                    style={{ background: `${stageColor}20`, color: stageColor }}>
                    {STAGE_LABELS[lead.sales_stage] || "—"}
                  </span>
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
              {/* Contact */}
              <div className="rounded-xl bg-[#142e38]/60 p-3 space-y-2">
                <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-2">פרטי קשר</p>
                <EditRow label="טלפון" editMode={editMode}
                  display={<a href={`tel:${current.phone}`} className="text-[#2dd4a8] hover:underline text-xs">{current.phone || '—'}</a>}
                  input={<Input value={draft.phone ?? lead.phone ?? ''} onChange={e => set('phone', e.target.value)} className={inputCls} />}
                />
                <EditRow label="אימייל" editMode={editMode}
                  display={<a href={`mailto:${current.email}`} className="text-blue-400 hover:underline text-xs truncate">{current.email || '—'}</a>}
                  input={<Input value={draft.email ?? lead.email ?? ''} onChange={e => set('email', e.target.value)} className={inputCls} />}
                />
                <EditRow label="עיר" editMode={editMode}
                  display={<span className="text-xs text-white">{current.city || '—'}</span>}
                  input={<Input value={draft.city ?? lead.city ?? ''} onChange={e => set('city', e.target.value)} className={inputCls} />}
                />
                <EditRow label="כתובת" editMode={editMode}
                  display={<span className="text-xs text-white">{current.address || '—'}</span>}
                  input={<Input value={draft.address ?? lead.address ?? ''} onChange={e => set('address', e.target.value)} className={inputCls} />}
                />
              </div>

              {/* Solar Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#142e38]/60 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1">kWp משוער</p>
                  {editMode
                    ? <Input type="number" value={draft.estimated_kwp ?? lead.estimated_kwp ?? ''} onChange={e => set('estimated_kwp', parseFloat(e.target.value))} className={inputCls} />
                    : <p className="text-lg font-bold text-yellow-400">{current.estimated_kwp || "—"}</p>
                  }
                </div>
                <div className="bg-[#142e38]/60 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1">₪/kWp</p>
                  {editMode
                    ? <Input type="number" value={draft.price_per_kwp ?? lead.price_per_kwp ?? ''} onChange={e => set('price_per_kwp', parseFloat(e.target.value))} className={inputCls} />
                    : <p className="text-lg font-bold text-[#2dd4a8]">{current.price_per_kwp ? `₪${current.price_per_kwp.toLocaleString()}` : "—"}</p>
                  }
                </div>
                <div className="bg-[#142e38]/60 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1">גג (מ"ר)</p>
                  {editMode
                    ? <Input type="number" value={draft.roof_size_sqm ?? lead.roof_size_sqm ?? ''} onChange={e => set('roof_size_sqm', parseFloat(e.target.value))} className={inputCls} />
                    : <p className="text-base font-bold text-white">{current.roof_size_sqm || "—"}</p>
                  }
                </div>
                <div className="bg-[#142e38]/60 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1">שלב</p>
                  {editMode
                    ? <Select value={draft.sales_stage ?? lead.sales_stage ?? ''} onValueChange={v => set('sales_stage', v)}>
                        <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#142e38] border-[rgba(45,212,168,0.15)]">
                          {Object.entries(STAGE_LABELS).map(([v, l]) => <SelectItem key={v} value={v} className="text-xs text-gray-300">{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    : <p className="text-xs font-medium text-white">{STAGE_LABELS[current.sales_stage] || '—'}</p>
                  }
                </div>
              </div>

              {/* More details */}
              <div className="rounded-xl bg-[#142e38]/60 p-3 space-y-2">
                <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-2">פרטים נוספים</p>
                <EditRow label="מקור" editMode={editMode}
                  display={<span className="text-xs text-white">{SOURCE_LABELS[current.source] || current.source || '—'}</span>}
                  input={
                    <Select value={draft.source ?? lead.source ?? ''} onValueChange={v => set('source', v)}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#142e38] border-[rgba(45,212,168,0.15)]">
                        {Object.entries(SOURCE_LABELS).map(([v, l]) => <SelectItem key={v} value={v} className="text-xs text-gray-300">{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  }
                />
                <EditRow label="סוג נכס" editMode={editMode}
                  display={<span className="text-xs text-white">{{ residential: 'פרטי', commercial: 'מסחרי', industrial: 'תעשייתי' }[current.property_type] || '—'}</span>}
                  input={
                    <Select value={draft.property_type ?? lead.property_type ?? ''} onValueChange={v => set('property_type', v)}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#142e38] border-[rgba(45,212,168,0.15)]">
                        <SelectItem value="residential" className="text-xs text-gray-300">פרטי</SelectItem>
                        <SelectItem value="commercial" className="text-xs text-gray-300">מסחרי</SelectItem>
                        <SelectItem value="industrial" className="text-xs text-gray-300">תעשייתי</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
                <EditRow label="סוכן" editMode={editMode}
                  display={<span className="text-xs text-white">{current.assigned_agent || '—'}</span>}
                  input={<Input value={draft.assigned_agent ?? lead.assigned_agent ?? ''} onChange={e => set('assigned_agent', e.target.value)} className={inputCls} />}
                />
                <Row label="נוצר" value={lead.created_date ? new Date(lead.created_date).toLocaleDateString('he-IL') : '—'} />
              </div>

              {/* Notes */}
              <div className="rounded-xl bg-[#142e38]/60 p-3">
                <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-2">הערות</p>
                {editMode
                  ? <textarea value={draft.notes ?? lead.notes ?? ''} onChange={e => set('notes', e.target.value)}
                      className="w-full bg-[#0a1a1f] border border-[rgba(45,212,168,0.2)] rounded-md text-white text-xs p-2 min-h-[60px] resize-none" />
                  : <p className="text-xs text-gray-300">{current.notes || '—'}</p>
                }
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex gap-2" style={{ borderColor: 'rgba(45,212,168,0.1)' }}>
              {editMode && (
                <Button variant="outline" onClick={() => { setEditMode(false); setDraft({}); }}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-[#142e38] text-xs">
                  ביטול
                </Button>
              )}
              <Button
                onClick={editMode ? handleSave : () => navigate(createPageUrl(`LeadCard?id=${lead.id}`))}
                disabled={saving}
                className="flex-1 text-white flex items-center justify-center gap-2 text-xs"
                style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}
              >
                {editMode ? (saving ? 'שומר...' : 'שמור שינויים') : <><ExternalLink className="w-4 h-4" /> פתח כרטיס מלא</>}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-white font-medium">{value || "—"}</span>
    </div>
  );
}

function EditRow({ label, editMode, display, input }) {
  return (
    <div className={`flex items-center py-0.5 gap-2 ${editMode ? 'flex-col items-start' : 'justify-between'}`}>
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      {editMode ? <div className="w-full">{input}</div> : display}
    </div>
  );
}