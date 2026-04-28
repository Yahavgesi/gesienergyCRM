import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { X, Phone, Mail, MapPin, Zap, ExternalLink, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function LeadSideDrawer({ lead, onClose }) {
  const navigate = useNavigate();
  if (!lead) return null;

  const stageColor = STAGE_COLORS[lead.sales_stage] || "#64748b";

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
            initial={{ x: -400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 left-0 h-full w-80 z-50 flex flex-col shadow-2xl"
            style={{ background: '#0d1f26', borderRight: '1px solid rgba(45,212,168,0.12)' }}
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
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Contact */}
              <div className="space-y-2">
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#142e38]/60 hover:bg-[#142e38] transition-colors">
                    <Phone className="w-4 h-4 text-[#2dd4a8] flex-shrink-0" />
                    <span className="text-sm text-white">{lead.phone}</span>
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#142e38]/60 hover:bg-[#142e38] transition-colors">
                    <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-white truncate">{lead.email}</span>
                  </a>
                )}
                {lead.city && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#142e38]/60">
                    <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="text-sm text-white">{lead.city}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#142e38]/60 rounded-xl p-3 text-center">
                  <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{lead.estimated_kwp || "—"}</p>
                  <p className="text-[10px] text-gray-500">kWp משוער</p>
                </div>
                <div className="bg-[#142e38]/60 rounded-xl p-3 text-center">
                  <TrendingUp className="w-4 h-4 text-[#2dd4a8] mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">
                    {lead.price_per_kwp ? `₪${lead.price_per_kwp.toLocaleString()}` : "—"}
                  </p>
                  <p className="text-[10px] text-gray-500">₪/kWp</p>
                </div>
              </div>

              {/* Details */}
              <div className="rounded-xl bg-[#142e38]/60 p-3 space-y-2">
                <Row label="מקור" value={SOURCE_LABELS[lead.source] || lead.source} />
                <Row label="סוג נכס" value={lead.property_type === 'residential' ? 'פרטי' : lead.property_type === 'commercial' ? 'מסחרי' : lead.property_type === 'industrial' ? 'תעשייתי' : '—'} />
                {lead.roof_size_sqm && <Row label='גג (מ"ר)' value={lead.roof_size_sqm} />}
                {lead.assigned_agent && <Row label="סוכן" value={lead.assigned_agent} />}
                <Row label="נוצר" value={lead.created_date ? new Date(lead.created_date).toLocaleDateString('he-IL') : '—'} />
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="rounded-xl bg-[#142e38]/60 p-3">
                  <p className="text-xs text-gray-500 mb-1">הערות</p>
                  <p className="text-sm text-gray-300">{lead.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t" style={{ borderColor: 'rgba(45,212,168,0.1)' }}>
              <Button
                onClick={() => navigate(createPageUrl(`LeadCard?id=${lead.id}`))}
                className="w-full text-white flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}
              >
                <ExternalLink className="w-4 h-4" /> פתח כרטיס ליד מלא
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
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-white font-medium">{value || "—"}</span>
    </div>
  );
}