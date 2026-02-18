import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable from "../components/crm/DataTable";
import FormModal from "../components/crm/FormModal";
import StatusBadge from "../components/shared/StatusBadge";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "../utils";

const statusLabels = { active: "פעיל", inactive: "לא פעיל" };
const statusMap = { active: "completed", inactive: "blocked" };

const columns = [
  { key: "name", label: "שם חברה" },
  { key: "business_number", label: "ח.פ." },
  { key: "phone", label: "טלפון" },
  { key: "email", label: "אימייל" },
  { key: "city", label: "עיר" },
  { key: "status", label: "סטטוס", render: (r) => <StatusBadge status={statusMap[r.status]} label={statusLabels[r.status]} /> },
  { key: "assigned_agent", label: "סוכן", render: (r) => r.assigned_agent || '—' },
  { key: "created_date", label: "תאריך", render: (r) => new Date(r.created_date).toLocaleDateString('he-IL') },
];

const formFields = [
  { key: "name", label: "שם חברה", placeholder: "שם החברה" },
  { key: "business_number", label: "ח.פ.", placeholder: "מספר ח.פ." },
  { key: "phone", label: "טלפון", placeholder: "050-0000000" },
  { key: "email", label: "אימייל", type: "email", placeholder: "email@example.com" },
  { key: "address", label: "כתובת", placeholder: "כתובת" },
  { key: "city", label: "עיר", placeholder: "עיר" },
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" },
    { value: "inactive", label: "לא פעיל" },
  ]},
];

export default function CrmCompanies() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['crm-companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-companies'] });
      setShowForm(false);
      setFormData({});
    },
  });

  const filtered = companies.filter(c =>
    !search || c.name?.includes(search) || c.business_number?.includes(search) || c.phone?.includes(search)
  );

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">חברות</h1>
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
            חברה חדשה
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonCard lines={5} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="אין חברות עדיין"
          onRowClick={(company) => navigate(createPageUrl(`CompanyCard/${company.id}`))}
        />
      )}

      <FormModal
        open={showForm}
        onClose={setShowForm}
        title="חברה חדשה"
        fields={formFields}
        data={formData}
        setData={setFormData}
        onSubmit={() => createMutation.mutate(formData)}
        submitting={createMutation.isPending}
      />
    </div>
  );
}