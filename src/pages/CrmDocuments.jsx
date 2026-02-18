import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable from "../components/crm/DataTable";
import FormModal from "../components/crm/FormModal";
import StatusBadge from "../components/shared/StatusBadge";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";

const categoryLabels = { contract: "חוזה", utility_forms: "טפסי חברת חשמל", office_forms: "טפסי משרד", permits: "היתרים", other: "אחר" };
const statusLabels = { draft: "טיוטה", pending_signature: "ממתין לחתימה", signed: "נחתם", approved: "אושר", rejected: "נדחה" };
const statusMap = { draft: "pending", pending_signature: "waiting_customer", signed: "completed", approved: "completed", rejected: "blocked" };

const columns = [
  { key: "title", label: "מסמך" },
  { key: "category", label: "קטגוריה", render: (r) => categoryLabels[r.category] || r.category || '—' },
  { key: "version", label: "גרסה", render: (r) => `v${r.version || 1}` },
  { key: "status", label: "סטטוס", render: (r) => <StatusBadge status={statusMap[r.status]} label={statusLabels[r.status]} /> },
  { key: "created_date", label: "תאריך", render: (r) => new Date(r.created_date).toLocaleDateString('he-IL') },
];

const formFields = [
  { key: "title", label: "שם המסמך", placeholder: "שם" },
  { key: "category", label: "קטגוריה", type: "select", options: Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l })) },
  { key: "customer_email", label: "אימייל לקוח", type: "email", placeholder: "email@example.com" },
  { key: "project_id", label: "מזהה פרויקט", placeholder: "ID פרויקט" },
  { key: "status", label: "סטטוס", type: "select", options: Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l })) },
];

export default function CrmDocuments() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ status: "draft" });
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['crm-documents'], queryFn: () => base44.entities.Document.list('-created_date', 200), initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-documents'] }); setShowForm(false); setFormData({ status: "draft" }); },
  });

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">מסמכים</h1>
        <Button onClick={() => { setFormData({ status: "draft" }); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-2" /> מסמך חדש
        </Button>
      </div>
      {isLoading ? <SkeletonCard lines={5} /> : <DataTable columns={columns} data={documents} emptyMessage="אין מסמכים" />}
      <FormModal open={showForm} onClose={setShowForm} title="מסמך חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}