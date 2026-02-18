import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable from "../components/crm/DataTable";
import FormModal from "../components/crm/FormModal";
import StatusBadge from "../components/shared/StatusBadge";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const statusLabels = { draft: "טיוטה", sent: "נשלח", approved: "אושר", rejected: "נדחה", expired: "פג תוקף" };
const statusMap = { draft: "pending", sent: "in_progress", approved: "completed", rejected: "blocked", expired: "blocked" };

const columns = [
  { key: "customer_name", label: "לקוח" },
  { key: "version", label: "גרסה", render: (r) => `v${r.version || 1}` },
  { key: "total_amount", label: "סכום", render: (r) => r.total_amount ? `₪${r.total_amount.toLocaleString()}` : '—' },
  { key: "status", label: "סטטוס", render: (r) => <StatusBadge status={statusMap[r.status]} label={statusLabels[r.status]} /> },
  { key: "valid_until", label: "תוקף", render: (r) => r.valid_until ? new Date(r.valid_until).toLocaleDateString('he-IL') : '—' },
  { key: "created_date", label: "תאריך", render: (r) => new Date(r.created_date).toLocaleDateString('he-IL') },
];

const formFields = [
  { key: "deal_id", label: "מזהה עסקה", placeholder: "ID עסקה" },
  { key: "customer_name", label: "שם לקוח", placeholder: "שם הלקוח" },
  { key: "total_amount", label: "סכום כולל", type: "number", placeholder: "0" },
  { key: "status", label: "סטטוס", type: "select", options: Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l })) },
  { key: "valid_until", label: "תוקף עד", type: "date" },
  { key: "notes", label: "הערות", type: "textarea" },
];

export default function CrmQuotes() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ status: "draft" });
  const queryClient = useQueryClient();

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['crm-quotes'], queryFn: () => base44.entities.Quote.list('-created_date', 100), initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Quote.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-quotes'] }); setShowForm(false); setFormData({ status: "draft" }); },
  });

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">הצעות מחיר</h1>
        <Button onClick={() => { setFormData({ status: "draft" }); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-2" /> הצעה חדשה
        </Button>
      </div>
      {isLoading ? <SkeletonCard lines={5} /> : <DataTable columns={columns} data={quotes} emptyMessage="אין הצעות מחיר" />}
      <FormModal open={showForm} onClose={setShowForm} title="הצעת מחיר חדשה" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}