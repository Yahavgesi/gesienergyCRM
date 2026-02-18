import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable from "../components/crm/DataTable";
import FormModal from "../components/crm/FormModal";
import StatusBadge from "../components/shared/StatusBadge";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const statusMap = { new: "pending", contacted: "in_progress", qualified: "completed", unqualified: "blocked", converted: "completed" };
const statusLabels = { new: "חדש", contacted: "נוצר קשר", qualified: "מתאים", unqualified: "לא מתאים", converted: "הומר" };

const sourceLabels = { website: "אתר", referral: "הפניה", facebook: "פייסבוק", google: "גוגל", phone: "טלפון", walk_in: "פנה ישירות", other: "אחר" };

const columns = [
  { key: "full_name", label: "שם" },
  { key: "phone", label: "טלפון" },
  { key: "city", label: "עיר" },
  { key: "source", label: "מקור", render: (r) => sourceLabels[r.source] || r.source || '—' },
  { key: "estimated_kwp", label: "kWp", render: (r) => r.estimated_kwp || '—' },
  { key: "status", label: "סטטוס", render: (r) => <StatusBadge status={statusMap[r.status]} label={statusLabels[r.status]} /> },
  { key: "created_date", label: "תאריך", render: (r) => new Date(r.created_date).toLocaleDateString('he-IL') },
];

const formFields = [
  { key: "full_name", label: "שם מלא", placeholder: "שם הליד" },
  { key: "phone", label: "טלפון", placeholder: "050-0000000" },
  { key: "email", label: "אימייל", type: "email", placeholder: "email@example.com" },
  { key: "source", label: "מקור", type: "select", options: Object.entries(sourceLabels).map(([v, l]) => ({ value: v, label: l })) },
  { key: "address", label: "כתובת", placeholder: "כתובת הנכס" },
  { key: "city", label: "עיר", placeholder: "עיר" },
  { key: "property_type", label: "סוג נכס", type: "select", options: [
    { value: "residential", label: "פרטי" }, { value: "commercial", label: "מסחרי" }, { value: "industrial", label: "תעשייתי" }
  ]},
  { key: "roof_size_sqm", label: 'גודל גג (מ"ר)', type: "number", placeholder: "0" },
  { key: "estimated_kwp", label: "kWp משוער", type: "number", placeholder: "0" },
  { key: "notes", label: "הערות", type: "textarea", placeholder: "הערות פנימיות" },
];

export default function CrmLeads() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['crm-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 200), initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-leads'] }); setShowForm(false); setFormData({}); },
  });

  const filtered = leads.filter(l =>
    !search || l.full_name?.includes(search) || l.phone?.includes(search) || l.city?.includes(search)
  );

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">לידים</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש..."
              className="pr-9 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 w-60"
            />
          </div>
          <Button onClick={() => { setFormData({}); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-2" />
            ליד חדש
          </Button>
        </div>
      </div>

      {isLoading ? <SkeletonCard lines={5} /> : <DataTable columns={columns} data={filtered} emptyMessage="אין לידים עדיין" />}

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