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

const COLUMNS = [
  { key: "title", label: "פרויקט" },
  { key: "customer_name", label: "לקוח" },
  { key: "kwp", label: "kWp", type: "number" },
  { key: "current_step", label: "שלב נוכחי" },
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" }, { value: "on_hold", label: "מושהה" },
    { value: "completed", label: "הושלם" }, { value: "cancelled", label: "בוטל" },
  ]},
  { key: "start_date", label: "התחלה", type: "date" },
];

const formFields = [
  { key: "title", label: "שם הפרויקט", placeholder: "שם" },
  { key: "customer_name", label: "שם לקוח", placeholder: "שם הלקוח" },
  { key: "customer_email", label: "אימייל לקוח", type: "email", placeholder: "email@example.com" },
  { key: "type", label: "סוג", type: "select", options: [
    { value: "residential", label: "פרטי" }, { value: "commercial", label: "מסחרי" }, { value: "tender", label: "מכרז" }
  ]},
  { key: "kwp", label: "kWp", type: "number", placeholder: "0" },
  { key: "address", label: "כתובת", placeholder: "כתובת ההתקנה" },
  { key: "start_date", label: "תאריך התחלה", type: "date" },
  { key: "estimated_completion", label: "צפי סיום", type: "date" },
];

const drawerSections = [
  { title: "פרטי פרויקט", fields: [
    { key: "title", label: "שם פרויקט" },
    { key: "customer_name", label: "לקוח" },
    { key: "kwp", label: "kWp", type: "number" },
    { key: "address", label: "כתובת" },
    { key: "type", label: "סוג", type: "select", options: [
      { value: "residential", label: "פרטי" }, { value: "commercial", label: "מסחרי" }, { value: "tender", label: "מכרז" }
    ]},
    { key: "status", label: "סטטוס", type: "select", options: [
      { value: "active", label: "פעיל" }, { value: "on_hold", label: "מושהה" },
      { value: "completed", label: "הושלם" }, { value: "cancelled", label: "בוטל" },
    ]},
  ]},
  { title: "לוח זמנים ועלויות", fields: [
    { key: "start_date", label: "תאריך התחלה", type: "date" },
    { key: "estimated_completion", label: "צפי סיום", type: "date" },
    { key: "current_step", label: "שלב נוכחי", readOnly: true },
    { key: "price_per_kwp", label: "מחיר לkWp (ללא מע״מ)", type: "number" },
    { label: "מחיר כולל", readOnly: true, render: r => r.total_price ? `₪${r.total_price.toLocaleString()}` : '—' },
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

  const filtered = projects.filter(p =>
    !search || p.title?.includes(search) || p.customer_name?.includes(search) || p.address?.includes(search)
  );

  return (
    <div className="p-4 lg:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">פרויקטים</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש..."
              className="pr-9 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 w-52" />
          </div>
          <Button onClick={() => { setFormData({}); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-2" /> פרויקט חדש
          </Button>
        </div>
      </div>

      {isLoading ? <SkeletonCard lines={5} /> : (
        <div className="rounded-2xl overflow-hidden border border-[rgba(45,212,168,0.08)]" style={{ background: '#0d1f26' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(45,212,168,0.08)]" style={{ background: '#0f2229' }}>
                  {COLUMNS.map(col => (
                    <th key={col.key} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={COLUMNS.length + 1} className="text-center py-10 text-gray-600">אין פרויקטים</td></tr>
                )}
                {filtered.map(project => (
                  editingId === project.id ? (
                    <QuickEditRow key={project.id} record={project} columns={COLUMNS}
                      onSave={data => updateMutation.mutate({ id: project.id, data })}
                      onCancel={() => setEditingId(null)} />
                  ) : (
                    <tr key={project.id}
                      onClick={() => navigate(createPageUrl(`ProjectCard?id=${project.id}`))}
                      className="group border-b border-[rgba(45,212,168,0.05)] hover:bg-[rgba(45,212,168,0.03)] transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-sm text-white font-medium">{project.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{project.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-[#2dd4a8] font-semibold">{project.kwp || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{project.current_step || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={statusMap[project.status]} label={statusLabels[project.status]} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {project.start_date ? new Date(project.start_date).toLocaleDateString('he-IL') : '—'}
                      </td>
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