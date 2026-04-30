import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FormModal from "../components/crm/FormModal";
import StatusBadge from "../components/shared/StatusBadge";
import SkeletonCard from "../components/shared/SkeletonCard";
import RowActions from "../components/crm/RowActions";
import QuickEditRow from "../components/crm/QuickEditRow";
import SideDrawer from "../components/crm/SideDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, RotateCcw, Zap, ClipboardList, CheckCircle2, Clock, AlertTriangle, Settings2 } from "lucide-react";
import { createPageUrl } from "../utils";

const statusLabels = { active: "פעיל", on_hold: "מושהה", completed: "הושלם", cancelled: "בוטל" };
const statusMap = { active: "in_progress", on_hold: "pending", completed: "completed", cancelled: "blocked" };
const TYPE_LABELS = {
  residential: "מערכת ביתית",
  commercial: "מערכת מסחרית",
  commercial_storage: "מערכת מסחרית + אגירה",
  residential_storage: "מערכת ביתית + אגירה",
  storage_only: "מתקן אגירה",
};
const ENGAGEMENT_LABELS = { purchase: "רכישה", entrepreneurship: "יזמות", partnership: "שותפות" };
const FINANCING_LABELS = { cash: "מזומן", loan: "הלוואה", leasing: "ליסינג", ppa: "PPA", other: "אחר" };

const ALL_PROJECT_COLUMNS = [
  { key: "title", label: "שם פרויקט" },
  { key: "project_number", label: "מס' פרויקט" },
  { key: "customer_name", label: "לקוח" },
  { key: "customer_phone", label: "טלפון לקוח" },
  { key: "address", label: "כתובת" },
  { key: "city", label: "עיר" },
  { key: "type", label: "סוג פרויקט", type: "select", options: Object.entries(TYPE_LABELS).map(([v,l]) => ({ value: v, label: l })) },
  { key: "engagement_type", label: "סוג התקשרות", type: "select", options: Object.entries(ENGAGEMENT_LABELS).map(([v,l]) => ({ value: v, label: l })) },
  { key: "kwp", label: "kWp", type: "number" },
  { key: "num_panels", label: "מס' פאנלים", type: "number" },
  { key: "panel_brand", label: "יצרן פאנלים" },
  { key: "inverter_brand", label: "יצרן מהפך" },
  { key: "total_price", label: "מחיר כולל (₪)" },
  { key: "price_per_kwp", label: "₪/kWp" },
  { key: "financing_type", label: "מימון", type: "select", options: Object.entries(FINANCING_LABELS).map(([v,l]) => ({ value: v, label: l })) },
  { key: "current_step", label: "שלב נוכחי" },
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" }, { value: "on_hold", label: "מושהה" },
    { value: "completed", label: "הושלם" }, { value: "cancelled", label: "בוטל" },
  ]},
  { key: "assigned_agent", label: "סוכן" },
  { key: "assigned_installer", label: "מתקין" },
  { key: "start_date", label: "תאריך התחלה", type: "date" },
  { key: "installation_date", label: "תאריך התקנה", type: "date" },
  { key: "grid_connection_date", label: "חיבור לרשת", type: "date" },
  { key: "estimated_completion", label: "צפי סיום", type: "date" },
  { key: "permit_number", label: "מס' היתר" },
  { key: "meter_number", label: "מס' מונה" },
];

const DEFAULT_PROJECT_COLS = ["title", "customer_name", "city", "kwp", "total_price", "current_step", "assigned_agent", "status", "start_date"];

const formFields = [
  { key: "title", label: "שם הפרויקט", placeholder: "שם" },
  { key: "project_number", label: "מספר פרויקט", placeholder: "P-001" },
  { key: "customer_name", label: "שם לקוח", placeholder: "שם הלקוח" },
  { key: "customer_phone", label: "טלפון לקוח", placeholder: "050-0000000" },
  { key: "customer_email", label: "אימייל לקוח", type: "email", placeholder: "email@example.com" },
  { key: "type", label: "סוג פרויקט", type: "select", options: Object.entries(TYPE_LABELS).map(([v,l]) => ({ value: v, label: l })) },
  { key: "engagement_type", label: "סוג התקשרות", type: "select", options: Object.entries(ENGAGEMENT_LABELS).map(([v,l]) => ({ value: v, label: l })) },
  { key: "address", label: "כתובת התקנה", placeholder: "כתובת" },
  { key: "city", label: "עיר", placeholder: "עיר" },
  { key: "region", label: "אזור", placeholder: "אזור" },
  { key: "kwp", label: "גודל מערכת (kWp)", type: "number", placeholder: "0" },
  { key: "num_panels", label: "מספר פאנלים", type: "number", placeholder: "0" },
  { key: "panel_brand", label: "יצרן פאנלים", placeholder: "לדוגמה: Longi" },
  { key: "panel_model", label: "דגם פאנלים", placeholder: "דגם" },
  { key: "inverter_brand", label: "יצרן מהפך", placeholder: "לדוגמה: Solarmax" },
  { key: "inverter_model", label: "דגם מהפך", placeholder: "דגם" },
  { key: "price_per_kwp", label: "מחיר ל-kWp (ללא מע\"מ)", type: "number", placeholder: "0" },
  { key: "deposit_amount", label: "סכום מקדמה (₪)", type: "number", placeholder: "0" },
  { key: "financing_type", label: "אופן מימון", type: "select", options: Object.entries(FINANCING_LABELS).map(([v,l]) => ({ value: v, label: l })) },
  { key: "assigned_agent", label: "סוכן מכירות", placeholder: "שם הסוכן" },
  { key: "assigned_installer", label: "מתקין", placeholder: "שם המתקין" },
  { key: "start_date", label: "תאריך התחלה", type: "date" },
  { key: "installation_date", label: "תאריך התקנה", type: "date" },
  { key: "estimated_completion", label: "צפי סיום", type: "date" },
  { key: "permit_number", label: "מספר היתר", placeholder: "מס' היתר" },
  { key: "grid_application_number", label: "מספר בקשה לחברת חשמל", placeholder: "מס' בקשה" },
  { key: "meter_number", label: "מספר מונה", placeholder: "מס' מונה" },
  { key: "notes", label: "הערות", type: "textarea", placeholder: "הערות" },
];

const drawerSections = [
  { title: "פרטי פרויקט", fields: [
    { key: "title", label: "שם פרויקט" },
    { key: "project_number", label: "מספר פרויקט" },
    { key: "customer_name", label: "לקוח" },
    { key: "customer_phone", label: "טלפון לקוח" },
    { key: "address", label: "כתובת" },
    { key: "city", label: "עיר" },
    { key: "type", label: "סוג", type: "select", options: Object.entries(TYPE_LABELS).map(([v,l]) => ({ value: v, label: l })) },
    { key: "engagement_type", label: "סוג התקשרות", type: "select", options: Object.entries(ENGAGEMENT_LABELS).map(([v,l]) => ({ value: v, label: l })) },
    { key: "status", label: "סטטוס", type: "select", options: [
      { value: "active", label: "פעיל" }, { value: "on_hold", label: "מושהה" },
      { value: "completed", label: "הושלם" }, { value: "cancelled", label: "בוטל" },
    ]},
  ]},
  { title: "מערכת סולארית", fields: [
    { key: "kwp", label: "kWp", type: "number" },
    { key: "num_panels", label: "מס' פאנלים", type: "number" },
    { key: "panel_brand", label: "יצרן פאנלים" },
    { key: "panel_model", label: "דגם פאנלים" },
    { key: "inverter_brand", label: "יצרן מהפך" },
    { key: "inverter_model", label: "דגם מהפך" },
  ]},
  { title: "לוח זמנים", fields: [
    { key: "start_date", label: "תאריך התחלה", type: "date" },
    { key: "installation_date", label: "תאריך התקנה", type: "date" },
    { key: "grid_connection_date", label: "חיבור לרשת", type: "date" },
    { key: "estimated_completion", label: "צפי סיום", type: "date" },
    { key: "current_step", label: "שלב נוכחי", readOnly: true },
  ]},
  { title: "כספים ומסמכים", fields: [
    { key: "price_per_kwp", label: "מחיר ל-kWp (ללא מע\"מ)", type: "number" },
    { label: "מחיר כולל (כולל מע\"מ)", readOnly: true, render: r => r.total_price ? `₪${r.total_price.toLocaleString()}` : '—' },
    { key: "deposit_amount", label: "מקדמה (₪)", type: "number" },
    { key: "financing_type", label: "מימון", type: "select", options: Object.entries(FINANCING_LABELS).map(([v,l]) => ({ value: v, label: l })) },
    { key: "permit_number", label: "מס' היתר" },
    { key: "grid_application_number", label: "מס' בקשה חברת חשמל" },
    { key: "meter_number", label: "מס' מונה" },
  ]},
  { title: "הערות", fields: [
    { key: "notes", label: "הערות", type: "textarea" },
  ]},
];

function renderProjectCell(col, project) {
  switch (col.key) {
    case "status": return <StatusBadge status={statusMap[project.status]} label={statusLabels[project.status]} />;
    case "type": return <span className="text-slate-500 text-xs">{TYPE_LABELS[project.type] || project.type || "—"}</span>;
    case "engagement_type": return <span className="text-slate-500 text-xs">{ENGAGEMENT_LABELS[project.engagement_type] || project.engagement_type || "—"}</span>;
    case "financing_type": return <span className="text-slate-500 text-xs">{FINANCING_LABELS[project.financing_type] || project.financing_type || "—"}</span>;
    case "kwp": return project.kwp ? <span className="text-[#0ea5a0] font-semibold">{project.kwp}</span> : <span className="text-slate-300">—</span>;
    case "total_price": return project.total_price ? <span className="text-amber-600 font-semibold">₪{project.total_price.toLocaleString()}</span> : <span className="text-slate-300">—</span>;
    case "price_per_kwp": return project.price_per_kwp ? <span className="text-slate-600">₪{project.price_per_kwp.toLocaleString()}</span> : <span className="text-slate-300">—</span>;
    case "start_date": case "installation_date": case "grid_connection_date": case "estimated_completion":
      return project[col.key] ? <span className="text-slate-400 text-xs">{new Date(project[col.key]).toLocaleDateString('he-IL')}</span> : <span className="text-slate-300">—</span>;
    default: return <span className="text-slate-700 text-sm">{project[col.key] || "—"}</span>;
  }
}

function ColumnManager({ visibleCols, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen(!open)} className="border-slate-200 text-slate-600 gap-1 text-xs h-9">
        <Settings2 className="w-3.5 h-3.5" /> עמודות
      </Button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-52" onClick={e => e.stopPropagation()}>
          <p className="text-xs font-semibold text-slate-500 mb-2">הצג עמודות</p>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {ALL_PROJECT_COLUMNS.map(col => (
              <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={visibleCols.includes(col.key)}
                  onChange={e => {
                    const next = e.target.checked ? [...visibleCols, col.key] : visibleCols.filter(k => k !== col.key);
                    if (next.length > 0) { onChange(next); localStorage.setItem("projects_columns", JSON.stringify(next)); }
                  }} className="rounded" />
                <span className="text-xs text-slate-700">{col.label}</span>
              </label>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="mt-2 w-full text-xs text-slate-400">סגור</Button>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function CrmProjects() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState("all"); // all | on_hold | no_price | overdue
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  const [visibleCols, setVisibleCols] = useState(() => {
    try { return JSON.parse(localStorage.getItem("projects_columns") || "null") || DEFAULT_PROJECT_COLS; } catch { return DEFAULT_PROJECT_COLS; }
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['crm-projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const project = await base44.entities.Project.create(data);
      const defaultSteps = [
        { name: "חתימת חוזה", description: "חתימה על חוזה התקנה", step_index: 0 },
        { name: "תשלום מקדמה", description: "תשלום מקדמה לפני תחילת עבודה", step_index: 1 },
        { name: "סקר גג", description: "ביצוע סקר הנדסי של הגג", step_index: 2 },
        { name: "תכנון מערכת", description: "תכנון ועיצוב המערכת הסולארית", step_index: 3 },
        { name: "היתרים ואישורים", description: "קבלת היתרים מחברת החשמל", step_index: 4 },
        { name: "הזמנת ציוד", description: "הזמנת פאנלים ומהפכים", step_index: 5 },
        { name: "התקנה", description: "התקנת המערכת על הגג", step_index: 6 },
        { name: "חיבור לרשת", description: "חיבור לרשת החשמל", step_index: 7 },
        { name: "בדיקות סופיות", description: "בדיקות ואישור תקינות", step_index: 8 },
        { name: "הפעלה", description: "הפעלת המערכת", step_index: 9 },
      ];
      await base44.entities.ProjectStep.bulkCreate(
        defaultSteps.map(s => ({ ...s, project_id: project.id, customer_email: data.customer_email, status: s.step_index === 0 ? "in_progress" : "pending" }))
      );
      await base44.entities.Project.update(project.id, { current_step: defaultSteps[0].name, current_step_index: 0 });
      return project;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-projects'] }); setShowForm(false); setFormData({}); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-projects'] }); setEditingId(null); },
  });

  const agents = [...new Set(projects.map(p => p.assigned_agent).filter(Boolean))];

  // Quick filter counts
  const onHoldCount = projects.filter(p => p.status === 'on_hold').length;
  const noPriceCount = projects.filter(p => p.status === 'active' && !p.total_price).length;
  const overdueCount = projects.filter(p => p.status === 'active' && p.estimated_completion && new Date(p.estimated_completion) < new Date()).length;

  const filtered = projects
    .filter(p => !search || p.title?.includes(search) || p.customer_name?.includes(search) || p.address?.includes(search) || p.city?.includes(search) || p.project_number?.includes(search))
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .filter(p => agentFilter === "all" || p.assigned_agent === agentFilter)
    .filter(p => {
      if (quickFilter === "all") return true;
      if (quickFilter === "on_hold") return p.status === 'on_hold';
      if (quickFilter === "no_price") return p.status === 'active' && !p.total_price;
      if (quickFilter === "overdue") return p.status === 'active' && p.estimated_completion && new Date(p.estimated_completion) < new Date();
      return true;
    });

  const activeColumns = ALL_PROJECT_COLUMNS.filter(c => visibleCols.includes(c.key));
  const totalKwp = projects.filter(p => p.status === 'active').reduce((s, p) => s + (p.kwp || 0), 0);
  const totalRevenuePipeline = projects.filter(p => p.status === 'active').reduce((s, p) => s + (p.total_price || 0), 0);
  const completedCount = projects.filter(p => p.status === 'completed').length;

  return (
    <div className="p-4 lg:p-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-800">פרויקטים</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש..."
              className="pr-9 bg-white border-slate-200 text-slate-700 placeholder-slate-400 w-52" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="border-slate-200 text-slate-600 gap-1 text-xs h-9">
            <Filter className="w-3.5 h-3.5" /> פילטרים {showFilters ? "▲" : "▼"}
          </Button>
          <ColumnManager visibleCols={visibleCols} onChange={setVisibleCols} />
          <Button onClick={() => { setFormData({}); setShowForm(true); }} className="bg-[#0ea5a0] hover:bg-[#0c8c88] text-white">
            <Plus className="w-4 h-4 ml-1.5" /> פרויקט חדש
          </Button>
        </div>
      </div>

      {/* Quick filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {onHoldCount > 0 && (
          <button onClick={() => setQuickFilter(quickFilter === 'on_hold' ? 'all' : 'on_hold')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${quickFilter === 'on_hold' ? 'bg-slate-500 text-white border-slate-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <Clock className="w-3.5 h-3.5" /> {onHoldCount} מושהים
          </button>
        )}
        {noPriceCount > 0 && (
          <button onClick={() => setQuickFilter(quickFilter === 'no_price' ? 'all' : 'no_price')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${quickFilter === 'no_price' ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'}`}>
            <AlertTriangle className="w-3.5 h-3.5" /> {noPriceCount} ללא מחיר
          </button>
        )}
        {overdueCount > 0 && (
          <button onClick={() => setQuickFilter(quickFilter === 'overdue' ? 'all' : 'overdue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${quickFilter === 'overdue' ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
            <AlertTriangle className="w-3.5 h-3.5" /> {overdueCount} עבר מועד
          </button>
        )}
        {quickFilter !== 'all' && (
          <button onClick={() => setQuickFilter('all')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
            <RotateCcw className="w-3 h-3" /> נקה
          </button>
        )}
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-xs bg-white border-slate-200 text-slate-700"><SelectValue placeholder="סטטוס" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="active">פעיל</SelectItem>
              <SelectItem value="on_hold">מושהה</SelectItem>
              <SelectItem value="completed">הושלם</SelectItem>
              <SelectItem value="cancelled">בוטל</SelectItem>
            </SelectContent>
          </Select>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-40 h-8 text-xs bg-white border-slate-200 text-slate-700"><SelectValue placeholder="סוכן" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסוכנים</SelectItem>
              {agents.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          {(statusFilter !== 'all' || agentFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setAgentFilter('all'); }} className="text-xs text-slate-400 h-8">
              <RotateCcw className="w-3 h-3 ml-1" /> נקה
            </Button>
          )}
        </div>
      )}

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "פרויקטים פעילים", value: projects.filter(p => p.status === 'active').length, color: "text-[#0ea5a0]", icon: <ClipboardList className="w-4 h-4" /> },
          { label: "הושלמו", value: completedCount, color: "text-green-600", icon: <CheckCircle2 className="w-4 h-4" /> },
          { label: "kWp בפעילות", value: totalKwp.toFixed(1), color: "text-amber-600", icon: <Zap className="w-4 h-4" /> },
          { label: "שווי צנרת", value: `₪${(totalRevenuePipeline / 1000).toFixed(0)}K`, color: "text-purple-600", icon: <ClipboardList className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <div className={`${s.color} opacity-70`}>{s.icon}</div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? <SkeletonCard lines={5} /> : (
        <div className="rounded-xl overflow-hidden border" style={{ background: '#ffffff', borderColor: '#d1e3ec' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <span className="text-xs text-slate-400">{filtered.length} פרויקטים</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ background: '#f1f7fb', borderColor: '#d1e3ec' }}>
                  <th className="px-4 py-3 w-28" />
                  {activeColumns.map(col => (
                    <th key={col.key} className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={activeColumns.length + 1} className="text-center py-10 text-slate-400">אין פרויקטים</td></tr>
                )}
                {filtered.map(project => (
                  editingId === project.id ? (
                    <QuickEditRow key={project.id} record={project} columns={activeColumns}
                      onSave={data => updateMutation.mutate({ id: project.id, data })}
                      onCancel={() => setEditingId(null)} />
                  ) : (
                    <tr key={project.id}
                      onClick={() => navigate(createPageUrl(`ProjectCard?id=${project.id}`))}
                      className="group border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-3 py-3">
                        <RowActions
                          onOpen={e => { e.stopPropagation(); navigate(createPageUrl(`ProjectCard?id=${project.id}`)); }}
                          onEdit={e => { e.stopPropagation(); setEditingId(project.id); }}
                          onDrawer={e => { e.stopPropagation(); setDrawerRecord(project); }}
                        />
                      </td>
                      {activeColumns.map(col => (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                          {renderProjectCell(col, project)}
                        </td>
                      ))}
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SideDrawer
        record={drawerRecord} onClose={() => setDrawerRecord(null)}
        onSave={async (draft) => {
          await base44.entities.Project.update(drawerRecord.id, draft);
          queryClient.invalidateQueries({ queryKey: ['crm-projects'] });
          setDrawerRecord(prev => ({ ...prev, ...draft }));
        }}
        title={r => r.title}
        subtitle={drawerRecord ? statusLabels[drawerRecord.status] : ''}
        subtitleColor={drawerRecord?.status === 'completed' ? '#2dd4a8' : drawerRecord?.status === 'active' ? '#60a5fa' : '#94a3b8'}
        avatar={r => r.title?.[0] || 'P'}
        sections={drawerSections} cardPage="ProjectCard"
      />

      <FormModal open={showForm} onClose={setShowForm} title="פרויקט חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}