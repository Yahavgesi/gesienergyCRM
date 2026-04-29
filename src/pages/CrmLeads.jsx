import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FormModal from "../components/crm/FormModal";
import StatusBadge from "../components/shared/StatusBadge";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Bell, AlertTriangle, Clock, Filter, TrendingUp, Users, Target, Zap, RotateCcw, ChevronDown } from "lucide-react";
import { createPageUrl } from "../utils";
import LeadRowActions from "../components/leads/LeadRowActions";
import LeadQuickEditRow from "../components/leads/LeadQuickEditRow";
import LeadSideDrawer from "../components/leads/LeadSideDrawer";
import LeadColumnManager, { ALL_COLUMNS } from "../components/leads/LeadColumnManager";
import LeadReminderModal from "../components/leads/LeadReminderModal";
import { differenceInDays, differenceInHours, parseISO } from "date-fns";

const STATUS_MAP = { new: "pending", contacted: "in_progress", qualified: "completed", unqualified: "blocked", converted: "completed" };
const STATUS_LABELS = { new: "חדש", contacted: "נוצר קשר", qualified: "מתאים", unqualified: "לא מתאים", converted: "הומר" };
const SOURCE_LABELS = {
  website: "אתר", referral: "הפניה", facebook: "פייסבוק", google: "גוגל",
  phone: "טלפון", walk_in: "פנה ישירות", whatsapp: "וואטסאפ", tiktok: "טיקטוק",
  instagram: "אינסטגרם", yad2: "יד2", portal: "פורטל", other: "אחר"
};
const STAGE_LABELS = {
  new_lead: "ליד חדש", initial_contact: "יצירת קשר", site_survey: "סיור באתר",
  quote_sent: "הצעת מחיר", negotiation: "משא ומתן", closing: "סגירה", won: "נסגר", lost: "אבוד",
};
const STAGE_COLORS = {
  new_lead: "#94a3b8", initial_contact: "#60a5fa", site_survey: "#a78bfa",
  quote_sent: "#fbbf24", negotiation: "#fb923c", closing: "#22c55e", won: "#0ea5a0", lost: "#ef4444"
};
const PROP_LABELS = { residential: "פרטי", commercial: "מסחרי", industrial: "תעשייתי", agricultural: "חקלאי", parking: "חניון" };
const PRIORITY_LABELS = { low: "נמוכה", medium: "בינונית", high: "גבוהה" };
const PRIORITY_COLORS = { low: "#94a3b8", medium: "#fbbf24", high: "#ef4444" };

const DEFAULT_COLUMNS = ["full_name", "phone", "city", "source", "sales_stage", "estimated_kwp", "price_per_kwp", "assigned_agent", "next_follow_up", "status", "created_date"];

const SOURCE_OPTIONS = Object.entries(SOURCE_LABELS).map(([v, l]) => ({ value: v, label: l }));
const STAGE_OPTIONS = Object.entries(STAGE_LABELS).map(([v, l]) => ({ value: v, label: l }));
const PROP_OPTIONS = Object.entries(PROP_LABELS).map(([v, l]) => ({ value: v, label: l }));

const formFields = [
  { key: "full_name", label: "שם מלא", placeholder: "שם מלא" },
  { key: "phone", label: "טלפון נייד", placeholder: "050-0000000" },
  { key: "phone2", label: "טלפון נוסף", placeholder: "050-0000000" },
  { key: "email", label: "אימייל", type: "email", placeholder: "email@example.com" },
  { key: "id_number", label: "ת.ז.", placeholder: "תעודת זהות" },
  { key: "source", label: "מקור ליד", type: "select", options: SOURCE_OPTIONS },
  { key: "address", label: "כתובת", placeholder: "כתובת הנכס" },
  { key: "city", label: "עיר", placeholder: "עיר" },
  { key: "region", label: "אזור", placeholder: "צפון / מרכז / דרום..." },
  { key: "property_type", label: "סוג נכס", type: "select", options: PROP_OPTIONS },
  { key: "roof_type", label: "סוג גג", type: "select", options: [
    { value: "flat", label: "שטוח" }, { value: "sloped", label: "משופע" },
    { value: "tile", label: "רעפים" }, { value: "metal", label: "מתכת" }, { value: "other", label: "אחר" }
  ]},
  { key: "roof_size_sqm", label: 'שטח גג (מ"ר)', type: "number", placeholder: "0" },
  { key: "estimated_kwp", label: "kWp משוער", type: "number", placeholder: "0" },
  { key: "price_per_kwp", label: "מחיר ל-kWp (₪)", type: "number", placeholder: "0" },
  { key: "monthly_electricity_bill", label: "חשבון חשמל חודשי (₪)", type: "number", placeholder: "0" },
  { key: "electricity_provider", label: "ספק חשמל", placeholder: "חברת חשמל / ספק אחר" },
  { key: "sales_stage", label: "שלב במכירה", type: "select", options: STAGE_OPTIONS },
  { key: "priority", label: "עדיפות", type: "select", options: [
    { value: "low", label: "נמוכה" }, { value: "medium", label: "בינונית" }, { value: "high", label: "גבוהה" }
  ]},
  { key: "assigned_agent", label: "סוכן מכירות", placeholder: "שם הסוכן" },
  { key: "next_follow_up", label: "תאריך מעקב הבא", type: "date" },
  { key: "notes", label: "הערות", type: "textarea", placeholder: "הערות פנימיות" },
];

// --- Smart indicators ---
function getLeadAlerts(lead) {
  const alerts = [];
  const now = new Date();

  // No contact in 7+ days
  if (lead.last_contact_date) {
    const daysSince = differenceInDays(now, parseISO(lead.last_contact_date));
    if (daysSince >= 7 && lead.sales_stage !== 'won' && lead.sales_stage !== 'lost') {
      alerts.push({ type: "cold", label: `${daysSince} ימים ללא קשר`, color: "#ef4444" });
    }
  } else if (lead.created_date) {
    const daysSince = differenceInDays(now, new Date(lead.created_date));
    if (daysSince >= 3 && lead.sales_stage === 'new_lead') {
      alerts.push({ type: "new_no_contact", label: `ליד חדש ללא מגע (${daysSince} ימים)`, color: "#f97316" });
    }
  }

  // Overdue follow-up
  if (lead.next_follow_up) {
    const followDate = parseISO(lead.next_follow_up);
    if (followDate < now && lead.sales_stage !== 'won' && lead.sales_stage !== 'lost') {
      const daysOverdue = differenceInDays(now, followDate);
      alerts.push({ type: "overdue", label: `מעקב באיחור של ${daysOverdue} ימים`, color: "#ef4444" });
    }
  }

  // High priority lead stuck
  if (lead.priority === 'high' && lead.sales_stage === 'new_lead') {
    const daysSince = differenceInDays(now, new Date(lead.created_date || now));
    if (daysSince >= 1) {
      alerts.push({ type: "hot", label: "עדיפות גבוהה ממתין", color: "#ef4444" });
    }
  }

  return alerts;
}

function renderCell(col, row) {
  switch (col.key) {
    case "status": return <StatusBadge status={STATUS_MAP[row.status]} label={STATUS_LABELS[row.status]} />;
    case "source": return <span className="text-slate-600">{SOURCE_LABELS[row.source] || row.source || "—"}</span>;
    case "sales_stage": {
      const c = STAGE_COLORS[row.sales_stage] || "#94a3b8";
      return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${c}20`, color: c }}>{STAGE_LABELS[row.sales_stage] || "—"}</span>;
    }
    case "property_type": return <span className="text-slate-600">{PROP_LABELS[row.property_type] || row.property_type || "—"}</span>;
    case "priority": {
      const c = PRIORITY_COLORS[row.priority] || "#94a3b8";
      return row.priority ? <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${c}20`, color: c }}>{PRIORITY_LABELS[row.priority]}</span> : <span className="text-slate-300">—</span>;
    }
    case "created_date": return <span className="text-slate-500 text-xs">{row.created_date ? new Date(row.created_date).toLocaleDateString('he-IL') : "—"}</span>;
    case "next_follow_up": {
      if (!row.next_follow_up) return <span className="text-slate-300">—</span>;
      const d = parseISO(row.next_follow_up);
      const overdue = d < new Date();
      return <span className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-amber-600'}`}>{d.toLocaleDateString('he-IL')}{overdue ? ' ⚠️' : ''}</span>;
    }
    case "estimated_kwp": return row.estimated_kwp ? <span className="text-[#0ea5a0] font-semibold">{row.estimated_kwp}</span> : <span className="text-slate-300">—</span>;
    case "price_per_kwp": return row.price_per_kwp ? <span className="text-amber-600 font-semibold">₪{row.price_per_kwp.toLocaleString()}</span> : <span className="text-slate-300">—</span>;
    case "monthly_electricity_bill": return row.monthly_electricity_bill ? <span className="text-slate-600">₪{row.monthly_electricity_bill.toLocaleString()}</span> : <span className="text-slate-300">—</span>;
    case "full_name": {
      const alerts = getLeadAlerts(row);
      return (
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <div className="relative group/alert">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: alerts[0].color }} />
              <div className="absolute bottom-full right-0 mb-1 hidden group-hover/alert:block z-50 bg-slate-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                {alerts.map((a, i) => <div key={i}>{a.label}</div>)}
              </div>
            </div>
          )}
          <span className="text-slate-800 font-medium">{row.full_name || "—"}</span>
        </div>
      );
    }
    default: return <span className="text-slate-700">{row[col.key] || "—"}</span>;
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
  const [stageFilter, setStageFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [alertFilter, setAlertFilter] = useState("all"); // all | overdue | cold | hot
  const [showFilters, setShowFilters] = useState(false);
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

  const activeLeads = leads.filter(l => l.status !== 'converted');

  // Derive unique agents
  const agents = [...new Set(activeLeads.map(l => l.assigned_agent).filter(Boolean))];

  // Alert counts for quick stats
  const overdueCount = activeLeads.filter(l => l.next_follow_up && parseISO(l.next_follow_up) < new Date() && l.sales_stage !== 'won' && l.sales_stage !== 'lost').length;
  const coldCount = activeLeads.filter(l => {
    if (!l.last_contact_date) {
      return differenceInDays(new Date(), new Date(l.created_date || new Date())) >= 3 && l.sales_stage === 'new_lead';
    }
    return differenceInDays(new Date(), parseISO(l.last_contact_date)) >= 7 && l.sales_stage !== 'won' && l.sales_stage !== 'lost';
  }).length;
  const hotCount = activeLeads.filter(l => l.priority === 'high' && (l.sales_stage === 'new_lead' || l.sales_stage === 'initial_contact')).length;

  const filtered = activeLeads
    .filter(l => !search || l.full_name?.includes(search) || l.phone?.includes(search) || l.city?.includes(search) || l.email?.includes(search))
    .filter(l => stageFilter === "all" || l.sales_stage === stageFilter)
    .filter(l => agentFilter === "all" || l.assigned_agent === agentFilter)
    .filter(l => {
      if (alertFilter === "all") return true;
      const alerts = getLeadAlerts(l);
      if (alertFilter === "overdue") return alerts.some(a => a.type === "overdue");
      if (alertFilter === "cold") return alerts.some(a => a.type === "cold" || a.type === "new_no_contact");
      if (alertFilter === "hot") return l.priority === 'high';
      return true;
    });

  const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key));

  const totalKwp = filtered.reduce((s, l) => s + (l.estimated_kwp || 0), 0);
  const wonThisMonth = leads.filter(l => l.sales_stage === 'won' && l.updated_date && new Date(l.updated_date).getMonth() === new Date().getMonth()).length;

  return (
    <div className="p-4 lg:p-6 space-y-4" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-800">לידים</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש..."
              className="pr-9 bg-white border-slate-200 text-slate-700 placeholder-slate-400 w-52" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 gap-1">
            <Filter className="w-4 h-4" /> פילטרים {showFilters ? "▲" : "▼"}
          </Button>
          <LeadColumnManager visibleColumns={visibleColumns} onChange={setVisibleColumns} />
          <Button onClick={() => { setFormData({}); setShowForm(true); }}
            className="bg-[#0ea5a0] hover:bg-[#0c8c88] text-white">
            <Plus className="w-4 h-4 ml-1.5" /> ליד חדש
          </Button>
        </div>
      </div>

      {/* Smart Alert Strip */}
      {(overdueCount > 0 || coldCount > 0 || hotCount > 0) && (
        <div className="flex items-center gap-3 flex-wrap">
          {overdueCount > 0 && (
            <button onClick={() => setAlertFilter(alertFilter === 'overdue' ? 'all' : 'overdue')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${alertFilter === 'overdue' ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {overdueCount} מעקבים באיחור
            </button>
          )}
          {coldCount > 0 && (
            <button onClick={() => setAlertFilter(alertFilter === 'cold' ? 'all' : 'cold')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${alertFilter === 'cold' ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
              <Clock className="w-3.5 h-3.5" />
              {coldCount} לידים קרים
            </button>
          )}
          {hotCount > 0 && (
            <button onClick={() => setAlertFilter(alertFilter === 'hot' ? 'all' : 'hot')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${alertFilter === 'hot' ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'}`}>
              <Zap className="w-3.5 h-3.5" />
              {hotCount} לידים חמים
            </button>
          )}
          {alertFilter !== 'all' && (
            <button onClick={() => setAlertFilter('all')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
              <RotateCcw className="w-3 h-3" /> נקה פילטר
            </button>
          )}
        </div>
      )}

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-44 h-8 text-xs bg-white border-slate-200 text-slate-700">
              <SelectValue placeholder="שלב מכירה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל השלבים</SelectItem>
              {STAGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-44 h-8 text-xs bg-white border-slate-200 text-slate-700">
              <SelectValue placeholder="סוכן" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסוכנים</SelectItem>
              {agents.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          {(stageFilter !== 'all' || agentFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setStageFilter('all'); setAgentFilter('all'); }}
              className="text-xs text-slate-400 hover:text-slate-600 h-8">
              <RotateCcw className="w-3 h-3 ml-1" /> נקה
            </Button>
          )}
        </div>
      )}

      {/* KPI mini-bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniKpi icon={<Users className="w-4 h-4" />} label="לידים פעילים" value={filtered.length} color="text-slate-700" />
        <MiniKpi icon={<Target className="w-4 h-4" />} label="נסגרו החודש" value={wonThisMonth} color="text-[#0ea5a0]" />
        <MiniKpi icon={<Zap className="w-4 h-4" />} label="סה״כ kWp בצנרת" value={`${totalKwp.toFixed(1)}`} color="text-amber-600" />
        <MiniKpi icon={<TrendingUp className="w-4 h-4" />} label="במשא ומתן" value={leads.filter(l => l.sales_stage === 'negotiation').length} color="text-purple-600" />
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonCard lines={5} />
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ background: '#ffffff', borderColor: '#d1e3ec' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <span className="text-xs text-slate-400">{filtered.length} לידים</span>
            {alertFilter !== 'all' && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">מסונן לפי: {alertFilter === 'overdue' ? 'באיחור' : alertFilter === 'cold' ? 'קרים' : 'חמים'}</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ background: '#f1f7fb', borderColor: '#d1e3ec' }}>
                  <th className="px-4 py-3 w-32" />
                  {activeColumns.map(col => (
                    <th key={col.key} className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={activeColumns.length + 1} className="text-center py-12 text-slate-400">אין לידים</td></tr>
                )}
                {filtered.map(lead => {
                  const alerts = getLeadAlerts(lead);
                  const rowBg = alerts.length > 0 ? 'bg-red-50/30' : '';
                  return editingId === lead.id ? (
                    <LeadQuickEditRow key={lead.id} lead={lead} columns={activeColumns}
                      onSave={(data) => updateMutation.mutate({ id: lead.id, data })}
                      onCancel={() => setEditingId(null)} />
                  ) : (
                    <tr key={lead.id}
                      onClick={() => navigate(createPageUrl(`LeadCard?id=${lead.id}`))}
                      className={`group border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${rowBg}`}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button title="הוסף תזכורת"
                            onClick={e => { e.stopPropagation(); setReminderLead(lead); }}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all">
                            <Bell className="w-4 h-4" />
                          </button>
                          <LeadRowActions lead={lead}
                            onEditInline={(l) => setEditingId(l.id)}
                            onOpenDrawer={(l) => setDrawerLead(l)} />
                        </div>
                      </td>
                      {activeColumns.map(col => (
                        <td key={col.key} className="px-4 py-3 text-sm whitespace-nowrap">
                          {renderCell(col, lead)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LeadSideDrawer lead={drawerLead} onClose={() => setDrawerLead(null)} />
      {reminderLead && <LeadReminderModal open={!!reminderLead} onClose={() => setReminderLead(null)} lead={reminderLead} />}
      <FormModal open={showForm} onClose={setShowForm} title="ליד חדש" fields={formFields}
        data={formData} setData={setFormData}
        onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}

function MiniKpi({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
      <div className={`${color} opacity-80`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}