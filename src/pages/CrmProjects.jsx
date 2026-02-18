import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable from "../components/crm/DataTable";
import FormModal from "../components/crm/FormModal";
import StatusBadge from "../components/shared/StatusBadge";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createPageUrl } from "../utils";

const statusLabels = { active: "פעיל", on_hold: "מושהה", completed: "הושלם", cancelled: "בוטל" };
const statusMap = { active: "in_progress", on_hold: "pending", completed: "completed", cancelled: "blocked" };

const columns = [
  { key: "title", label: "פרויקט" },
  { key: "customer_name", label: "לקוח" },
  { key: "kwp", label: "kWp" },
  { key: "current_step", label: "שלב נוכחי", render: (r) => r.current_step || '—' },
  { key: "status", label: "סטטוס", render: (r) => <StatusBadge status={statusMap[r.status]} label={statusLabels[r.status]} /> },
  { key: "start_date", label: "התחלה", render: (r) => r.start_date ? new Date(r.start_date).toLocaleDateString('he-IL') : '—' },
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

export default function CrmProjects() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['crm-projects'], queryFn: () => base44.entities.Project.list('-created_date', 100), initialData: []
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const project = await base44.entities.Project.create(data);
      // Auto-create default steps
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

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">פרויקטים</h1>
        <Button onClick={() => { setFormData({}); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-2" /> פרויקט חדש
        </Button>
      </div>
      {isLoading ? <SkeletonCard lines={5} /> : <DataTable columns={columns} data={projects} emptyMessage="אין פרויקטים" onRowClick={(project) => navigate(createPageUrl(`ProjectCard?id=${project.id}`))} />}
      <FormModal open={showForm} onClose={setShowForm} title="פרויקט חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}