import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable from "../components/crm/DataTable";
import FormModal from "../components/crm/FormModal";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const categoryLabels = { battery: "סוללה", ev_charger: "עמדת טעינה", warranty: "אחריות", monitoring: "ניטור", panel_upgrade: "שדרוג פאנלים", other: "אחר" };

const columns = [
  { key: "name", label: "מוצר" },
  { key: "category", label: "קטגוריה", render: (r) => categoryLabels[r.category] || r.category || '—' },
  { key: "price", label: "מחיר", render: (r) => `₪${(r.price || 0).toLocaleString()}` },
  { key: "active", label: "פעיל", render: (r) => (
    <span className={`text-xs ${r.active !== false ? 'text-[#2dd4a8]' : 'text-gray-500'}`}>{r.active !== false ? 'כן' : 'לא'}</span>
  )},
];

const formFields = [
  { key: "name", label: "שם מוצר", placeholder: "שם" },
  { key: "description", label: "תיאור", type: "textarea", placeholder: "תיאור המוצר" },
  { key: "category", label: "קטגוריה", type: "select", options: Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l })) },
  { key: "price", label: "מחיר", type: "number", placeholder: "0" },
];

export default function CrmProducts() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['crm-products'], queryFn: () => base44.entities.Product.list('-created_date', 100), initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-products'] }); setShowForm(false); setFormData({}); },
  });

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">מוצרים</h1>
        <Button onClick={() => { setFormData({}); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-2" /> מוצר חדש
        </Button>
      </div>
      {isLoading ? <SkeletonCard lines={4} /> : <DataTable columns={columns} data={products} emptyMessage="אין מוצרים" />}
      <FormModal open={showForm} onClose={setShowForm} title="מוצר חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}