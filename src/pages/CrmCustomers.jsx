import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable from "../components/crm/DataTable";
import FormModal from "../components/crm/FormModal";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const onboardingLabels = { pending: "ממתין", details_confirmed: "פרטים אושרו", active: "פעיל" };

const columns = [
  { key: "full_name", label: "שם" },
  { key: "phone", label: "טלפון" },
  { key: "email", label: "אימייל" },
  { key: "city", label: "עיר" },
  { key: "onboarding_status", label: "סטטוס", render: (r) => (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
      r.onboarding_status === 'active' ? 'bg-[#2dd4a8]/10 text-[#2dd4a8]' :
      r.onboarding_status === 'details_confirmed' ? 'bg-blue-400/10 text-blue-400' :
      'bg-gray-400/10 text-gray-400'
    }`}>
      {onboardingLabels[r.onboarding_status] || 'ממתין'}
    </span>
  )},
  { key: "created_date", label: "תאריך", render: (r) => new Date(r.created_date).toLocaleDateString('he-IL') },
];

const formFields = [
  { key: "full_name", label: "שם מלא", placeholder: "שם הלקוח" },
  { key: "phone", label: "טלפון", placeholder: "050-0000000" },
  { key: "email", label: "אימייל", type: "email", placeholder: "email@example.com" },
  { key: "id_number", label: "תעודת זהות", placeholder: "ת.ז." },
  { key: "address", label: "כתובת", placeholder: "כתובת ההתקנה" },
  { key: "city", label: "עיר", placeholder: "עיר" },
  { key: "language", label: "שפה", type: "select", options: [
    { value: "he", label: "עברית" }, { value: "en", label: "English" }, { value: "ar", label: "عربي" }, { value: "ru", label: "Русский" }
  ]},
];

export default function CrmCustomers() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['crm-customers'], queryFn: () => base44.entities.Customer.list('-created_date', 200), initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-customers'] }); setShowForm(false); setFormData({}); },
  });

  const filtered = customers.filter(c =>
    !search || c.full_name?.includes(search) || c.phone?.includes(search) || c.email?.includes(search)
  );

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">לקוחות</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש..." className="pr-9 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 w-60" />
          </div>
          <Button onClick={() => { setFormData({}); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-2" />
            לקוח חדש
          </Button>
        </div>
      </div>

      {isLoading ? <SkeletonCard lines={5} /> : <DataTable columns={columns} data={filtered} emptyMessage="אין לקוחות עדיין" />}

      <FormModal
        open={showForm} onClose={setShowForm} title="לקוח חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending}
      />
    </div>
  );
}