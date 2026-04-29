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
import { Plus, Search } from "lucide-react";
import { createPageUrl } from "../utils";

const statusLabels = { active: "פעיל", on_hold: "מושהה", completed: "הושלם", cancelled: "בוטל" };
const statusMap = { active: "in_progress", on_hold: "pending", completed: "completed", cancelled: "blocked" };
const TYPE_LABELS = { residential: "פרטי", commercial: "מסחרי", industrial: "תעשייתי", agricultural: "חקלאי", tender: "מכרז" };
const FINANCING_LABELS = { cash: "מזומן", loan: "הלוואה", leasing: "ליסינג", ppa: "PPA", other: "אחר" };

const ALL_PROJECT_COLUMNS = [
  { key: "title", label: "שם פרויקט" },
  { key: "project_number", label: "מס' פרויקט" },
  { key: "customer_name", label: "לקוח" },
  { key: "customer_phone", label: "טלפון לקוח" },
  { key: "address", label: "כתובת" },
  { key: "city", label: "עיר" },
  { key: "type", label: "סוג פרויקט", type: "select", options: Object.entries(TYPE_LABELS).map(([v,l]) => ({ value: v, label: l })) },
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

export default function CrmProjects() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const queryClient = useQueryClient();

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

  const [visibleCols, setVisibleCols] = useState(() => {
    try { return JSON.parse(localStorage.getItem("projects_columns") || "null") || DEFAULT_PROJECT_COLS; } catch { return DEFAULT_PROJECT_COLS; }
  });

  const filtered = projects.filter(p =>
    !search || p.title?.includes(search) || p.customer_name?.includes(search) ||
    p.address?.includes(search) || p.city?.includes(search) || p.project_number?.includes(search)
  );

  const activeColumns = ALL_PROJECT_COLUMNS.filter(c => visibleCols.includes(c.key));

  function renderProjectCell(col, project) {
    switch (col.key) {
      case "status": return <StatusBadge status={statusMap[project.status]} label={statusLabels[project.status]} />;
      case "type": return <span className="text-slate-500 text-xs">{TYPE_LABELS[project.type] || project.type || "—"}</span>;
      case "financing_type": return <span className="text-slate-500 text-xs">{FINANCING_LABELS[project.financing_type] || project.financing_type || "—"}</span>;
      case "kwp": return project.kwp ? <span className="text-[#0ea5a0] font-semibold">{project.kwp}</span> : <span className="text-slate-300">—</span>;
      case "total_price": return project.total_price ? <span className="text-amber-600 font-semibold">₪{project.total_price.toLocaleString()}</span> : <span className="text-slate-300">—</span>;
      case "price_per_kwp": return project.price_per_kwp ? <span className="text-slate-600">₪{project.price_per_kwp.toLocaleString()}</span> : <span className="text-slate-300">—</span>;
      case "start_date": case "installation_date": case "grid_connection_date": case "estimated_completion":
        return project[col.key] ? <span className="text-slate-400 text-xs">{new Date(project[col.key]).toLocaleDateString('he-IL')}</span> : <span className="text-slate-300">—</span>;
      default: return <span className="text-slate-700 text-sm">{project[col.key] || "—"}</span>;
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-800">פרויקטים</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש..."
              className="pr-9 bg-white border-slate-200 text-slate-700 placeholder-slate-400 w-52" />
          </div>
          <Button onClick={() => { setFormData({}); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-2" /> פרויקט חדש
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>{filtered.length} פרויקטים</span>
      </div>

      {isLoading ? <SkeletonCard lines={5} /> : (
        <div className="rounded-xl overflow-hidden border" style={{ background: '#ffffff', borderColor: '#d1e3ec' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ background: '#f1f7fb', borderColor: '#d1e3ec' }}>
                  {activeColumns.map(col => (
                    <th key={col.key} className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 w-28" />
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
                      {activeColumns.map(col => (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                          {renderProjectCell(col, project)}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <RowActions
                          onOpen={e => { e.stopPropagation(); navigate(createPageUrl(`ProjectCard?id=${project.id}`)); }}
                          onEdit={e => { e.stopPropagation(); setEditingId(project.id); }}
                          onDrawer={e => { e.stopPropagation(); setDrawerRecord(project); }}
                        />
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SideDrawer
        record={drawerRecord}
        onClose={() => setDrawerRecord(null)}
        onSave={async (draft) => {
          await base44.entities.Project.update(drawerRecord.id, draft);
          queryClient.invalidateQueries({ queryKey: ['crm-projects'] });
          setDrawerRecord(prev => ({ ...prev, ...draft }));
        }}
        title={r => r.title}
        subtitle={drawerRecord ? statusLabels[drawerRecord.status] : ''}
        subtitleColor={drawerRecord?.status === 'completed' ? '#2dd4a8' : drawerRecord?.status === 'active' ? '#60a5fa' : '#94a3b8'}
        avatar={r => r.title?.[0] || 'P'}
        sections={drawerSections}
        cardPage="ProjectCard"
      />

      <FormModal open={showForm} onClose={setShowForm} title="פרויקט חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}