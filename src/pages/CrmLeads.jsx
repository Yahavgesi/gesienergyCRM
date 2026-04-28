import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FormModal from "../components/crm/FormModal";
import StatusBadge from "../components/shared/StatusBadge";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Bell } from "lucide-react";
import { createPageUrl } from "../utils";
import LeadRowActions from "../components/leads/LeadRowActions";
import LeadQuickEditRow from "../components/leads/LeadQuickEditRow";
import LeadSideDrawer from "../components/leads/LeadSideDrawer";
import LeadColumnManager, { ALL_COLUMNS } from "../components/leads/LeadColumnManager";
import LeadReminderModal from "../components/leads/LeadReminderModal";

const STATUS_MAP = { new: "pending", contacted: "in_progress", qualified: "completed", unqualified: "blocked", converted: "completed" };
const STATUS_LABELS = { new: "חדש", contacted: "נוצר קשר", qualified: "מתאים", unqualified: "לא מתאים", converted: "הומר" };
const SOURCE_LABELS = { website: "אתר", referral: "הפניה", facebook: "פייסבוק", google: "גוגל", phone: "טלפון", walk_in: "פנה ישירות", other: "אחר" };
const STAGE_LABELS = {
  new_lead: "ליד חדש", initial_contact: "יצירת קשר", site_survey: "סיור באתר",
  quote_sent: "הצעת מחיר", negotiation: "משא ומתן", closing: "סגירה", won: "נסגר", lost: "אבוד",
};
const PROP_LABELS = { residential: "פרטי", commercial: "מסחרי", industrial: "תעשייתי" };

const DEFAULT_COLUMNS = ["full_name", "phone", "city", "source", "sales_stage", "estimated_kwp", "status", "created_date"];

const formFields = [
  { key: "full_name", label: "שם מלא", placeholder: "שם הליד" },
  { key: "phone", label: "טלפון", placeholder: "050-0000000" },
  { key: "email", label: "אימייל", type: "email", placeholder: "email@example.com" },
  { key: "source", label: "מקור", type: "select", options: Object.entries(SOURCE_LABELS).map(([v, l]) => ({ value: v, label: l })) },
  { key: "address", label: "כתובת", placeholder: "כתובת הנכס" },
  { key: "city", label: "עיר", placeholder: "עיר" },
  { key: "property_type", label: "סוג נכס", type: "select", options: [
    { value: "residential", label: "פרטי" }, { value: "commercial", label: "מסחרי" }, { value: "industrial", label: "תעשייתי" }
  ]},
  { key: "roof_size_sqm", label: 'גודל גג (מ"ר)', type: "number", placeholder: "0" },
  { key: "estimated_kwp", label: "kWp משוער", type: "number", placeholder: "0" },
  { key: "assigned_agent", label: "סוכן מכירות", placeholder: "email@example.com" },
  { key: "notes", label: "הערות", type: "textarea", placeholder: "הערות פנימיות" },
];

function renderCell(col, row) {
  switch (col.key) {
    case "status": return <StatusBadge status={STATUS_MAP[row.status]} label={STATUS_LABELS[row.status]} />;
    case "source": return <span className="text-gray-300">{SOURCE_LABELS[row.source] || row.source || "—"}</span>;
    case "sales_stage": return <span className="text-gray-300 text-xs">{STAGE_LABELS[row.sales_stage] || row.sales_stage || "—"}</span>;
    case "property_type": return <span className="text-gray-300">{PROP_LABELS[row.property_type] || row.property_type || "—"}</span>;
    case "created_date": return <span className="text-gray-400 text-xs">{row.created_date ? new Date(row.created_date).toLocaleDateString('he-IL') : "—"}</span>;
    case "estimated_kwp": return row.estimated_kwp ? <span className="text-[#2dd4a8] font-semibold">{row.estimated_kwp}</span> : <span className="text-gray-600">—</span>;
    case "price_per_kwp": return row.price_per_kwp ? <span className="text-amber-400 font-semibold">₪{row.price_per_kwp.toLocaleString()}</span> : <span className="text-gray-600">—</span>;
    default: return <span className="text-gray-200">{row[col.key] || "—"}</span>;
  }
}

export default function CrmLeads() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [drawerLead, setDrawerLead] = useState(null);
  const [reminderLead, setReminderLead] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try { return JSON.parse(localStorage.getItem("leads_columns") || "null") || DEFAULT_COLUMNS; } catch { return DEFAULT_COLUMNS; }
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    localStorage.setItem("leads_columns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-leads'] }); setShowForm(false); setFormData({}); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-leads'] }); setEditingId(null); },
  });

  const filtered = leads
    .filter(l => l.status !== 'converted')
    .filter(l => !search ||
      l.full_name?.includes(search) ||
      l.phone?.includes(search) ||
      l.city?.includes(search) ||
      l.email?.includes(search)
    );

  const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key));

  return (
    <div className="p-4 lg:p-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">לידים</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש..."
              className="pr-9 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 w-52"
            />
          </div>
          <LeadColumnManager visibleColumns={visibleColumns} onChange={setVisibleColumns} />
          <Button onClick={() => { setFormData({}); setShowForm(true); }}
            style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-1.5" /> ליד חדש
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{filtered.length} לידים</span>
        <span>•</span>
        <span>{leads.filter(l => l.sales_stage === 'won').length} נסגרו</span>
        <span>•</span>
        <span>{leads.filter(l => l.sales_stage === 'negotiation').length} במשא ומתן</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonCard lines={5} />
      ) : (
        <div className="rounded-2xl overflow-hidden border border-[rgba(45,212,168,0.08)]"
          style={{ background: '#0d1f26' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(45,212,168,0.08)]"
                  style={{ background: '#0f2229' }}>
                  {activeColumns.map(col => (
                    <th key={col.key} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 w-32" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={activeColumns.length + 1} className="text-center py-10 text-gray-600">אין לידים עדיין</td></tr>
                )}
                {filtered.map(lead => (
                  editingId === lead.id ? (
                    <LeadQuickEditRow
                      key={lead.id}
                      lead={lead}
                      columns={activeColumns}
                      onSave={(data) => updateMutation.mutate({ id: lead.id, data })}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <tr
                      key={lead.id}
                      onClick={() => navigate(createPageUrl(`LeadCard?id=${lead.id}`))}
                      className="group border-b border-[rgba(45,212,168,0.05)] hover:bg-[rgba(45,212,168,0.03)] transition-colors cursor-pointer"
                    >
                      {activeColumns.map(col => (
                        <td key={col.key} className="px-4 py-3 text-sm whitespace-nowrap">
                          {renderCell(col, lead)}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="הוסף תזכורת"
                            onClick={e => { e.stopPropagation(); setReminderLead(lead); }}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-amber-500/10 text-gray-400 hover:text-amber-400 transition-all"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                          <LeadRowActions
                            lead={lead}
                            onEditInline={(l) => setEditingId(l.id)}
                            onOpenDrawer={(l) => setDrawerLead(l)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side Drawer */}
      <LeadSideDrawer lead={drawerLead} onClose={() => setDrawerLead(null)} />

      {/* Reminder Modal */}
      {reminderLead && (
        <LeadReminderModal open={!!reminderLead} onClose={() => setReminderLead(null)} lead={reminderLead} />
      )}

      {/* New Lead Modal */}
      <FormModal
        open={showForm}
        onClose={setShowForm}
        title="ליד חדש"
        fields={formFields}
        data={formData}
        setData={setFormData}
        onSubmit={() => createMutation.mutate(formData)}
        submitting={createMutation.isPending}
      />
    </div>
  );
}