import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable from "../components/crm/DataTable";
import FormModal from "../components/crm/FormModal";
import StatusBadge from "../components/shared/StatusBadge";
import SkeletonCard from "../components/shared/SkeletonCard";
import KpiCard from "../components/crm/KpiCard";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, CreditCard, Clock, CheckCircle2 } from "lucide-react";

const statusLabels = { pending: "ממתין", processing: "בעיבוד", completed: "שולם", failed: "נכשל", refunded: "הוחזר" };
const statusMap = { pending: "pending", processing: "in_progress", completed: "completed", failed: "blocked", refunded: "blocked" };
const typeLabels = { deposit: "מקדמה", milestone: "אבן דרך", installment: "תשלום", product_purchase: "רכישת מוצר" };

const columns = [
  { key: "description", label: "תיאור", render: (r) => r.description || typeLabels[r.type] || '—' },
  { key: "amount", label: "סכום", render: (r) => `₪${(r.amount || 0).toLocaleString()}` },
  { key: "type", label: "סוג", render: (r) => typeLabels[r.type] || r.type || '—' },
  { key: "method", label: "אמצעי", render: (r) => r.method === 'credit_card' ? 'כרטיס אשראי' : r.method || '—' },
  { key: "status", label: "סטטוס", render: (r) => <StatusBadge status={statusMap[r.status]} label={statusLabels[r.status]} /> },
  { key: "created_date", label: "תאריך", render: (r) => new Date(r.created_date).toLocaleDateString('he-IL') },
];

const formFields = [
  { key: "description", label: "תיאור", placeholder: "תיאור התשלום" },
  { key: "amount", label: "סכום", type: "number", placeholder: "0" },
  { key: "type", label: "סוג", type: "select", options: Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l })) },
  { key: "method", label: "אמצעי תשלום", type: "select", options: [
    { value: "credit_card", label: "כרטיס אשראי" }, { value: "bank_transfer", label: "העברה בנקאית" }, { value: "check", label: "צ'ק" }, { value: "cash", label: "מזומן" }
  ]},
  { key: "customer_email", label: "אימייל לקוח", type: "email", placeholder: "email@example.com" },
  { key: "status", label: "סטטוס", type: "select", options: Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l })) },
  { key: "installment_number", label: "מספר תשלום", type: "number" },
  { key: "total_installments", label: 'סה"כ תשלומים', type: "number" },
];

export default function CrmPayments() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ status: "pending", type: "deposit" });
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['crm-payments-all'], queryFn: () => base44.entities.Payment.list('-created_date', 200), initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-payments-all'] }); setShowForm(false); setFormData({ status: "pending", type: "deposit" }); },
  });

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">תשלומים</h1>
        <Button onClick={() => { setFormData({ status: "pending", type: "deposit" }); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-2" /> תשלום חדש
        </Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title='סה"כ שולם' value={`₪${totalPaid.toLocaleString()}`} icon={CheckCircle2} />
        <KpiCard title="ממתין לתשלום" value={`₪${totalPending.toLocaleString()}`} icon={Clock} delay={0.05} />
        <KpiCard title="מספר תשלומים" value={payments.length} icon={CreditCard} delay={0.1} />
      </div>
      {isLoading ? <SkeletonCard lines={5} /> : <DataTable columns={columns} data={payments} emptyMessage="אין תשלומים" />}
      <FormModal open={showForm} onClose={setShowForm} title="תשלום חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}