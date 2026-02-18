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

const statusLabels = { active: "פעיל", inactive: "לא פעיל", vip: "VIP" };
const statusMap = { active: "completed", inactive: "blocked", vip: "in_progress" };

const columns = [
  { key: "full_name", label: "שם" },
  { key: "phone", label: "טלפון" },
  { key: "email", label: "אימייל" },
  { key: "city", label: "עיר" },
  { key: "status", label: "סטטוס", render: (r) => <StatusBadge status={statusMap[r.status]} label={statusLabels[r.status]} /> },
  { key: "assigned_agent", label: "סוכן", render: (r) => r.assigned_agent || '—' },
  { key: "created_date", label: "תאריך", render: (r) => new Date(r.created_date).toLocaleDateString('he-IL') },
];

const formFields = [
  { key: "full_name", label: "שם מלא", placeholder: "שם הלקוח" },
  { key: "phone", label: "טלפון", placeholder: "050-0000000" },
  { key: "email", label: "אימייל", type: "email", placeholder: "email@example.com" },
  { key: "id_number", label: "תעודת זהות", placeholder: "ת.ז." },
  { key: "address", label: "כתובת", placeholder: "כתובת" },
  { key: "city", label: "עיר", placeholder: "עיר" },
  { key: "language", label: "שפה", type: "select", options: [
    { value: "he", label: "עברית" }, { value: "en", label: "English" }, { value: "ar", label: "عربي" }, { value: "ru", label: "Русский" }
  ]},
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }, { value: "vip", label: "VIP" }
  ]},
];

export default function CrmContacts() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      setShowForm(false);
      setFormData({});
    },
  });

  const filtered = contacts.filter(c =>
    !search || c.full_name?.includes(search) || c.phone?.includes(search) || c.email?.includes(search)
  );

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">אנשי קשר</h1>
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
            איש קשר חדש
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonCard lines={5} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="אין אנשי קשר עדיין"
          onRowClick={(contact) => navigate(createPageUrl(`ContactCard/${contact.id}`))}
        />
      )}

      <FormModal
        open={showForm}
        onClose={setShowForm}
        title="איש קשר חדש"
        fields={formFields}
        data={formData}
        setData={setFormData}
        onSubmit={() => createMutation.mutate(formData)}
        submitting={createMutation.isPending}
      />
    </div>
  );
}