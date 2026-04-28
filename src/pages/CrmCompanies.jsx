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

const statusLabels = { active: "פעיל", inactive: "לא פעיל" };
const statusMap = { active: "completed", inactive: "blocked" };

const COLUMNS = [
  { key: "name", label: "שם חברה" },
  { key: "business_number", label: "ח.פ." },
  { key: "phone", label: "טלפון" },
  { key: "email", label: "אימייל" },
  { key: "city", label: "עיר" },
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }
  ]},
  { key: "assigned_agent", label: "סוכן" },
];

const formFields = [
  { key: "name", label: "שם חברה", placeholder: "שם החברה" },
  { key: "business_number", label: "ח.פ.", placeholder: "מספר ח.פ." },
  { key: "phone", label: "טלפון", placeholder: "050-0000000" },
  { key: "email", label: "אימייל", type: "email", placeholder: "email@example.com" },
  { key: "address", label: "כתובת", placeholder: "כתובת" },
  { key: "city", label: "עיר", placeholder: "עיר" },
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }
  ]},
];

const drawerSections = [
  { title: "פרטי חברה", fields: [
    { key: "name", label: "שם חברה" },
    { key: "business_number", label: "ח.פ." },
    { key: "phone", label: "טלפון" },
    { key: "email", label: "אימייל" },
  ]},
  { title: "מיקום ופרטים", fields: [
    { key: "address", label: "כתובת" },
    { key: "city", label: "עיר" },
    { key: "assigned_agent", label: "סוכן" },
    { key: "status", label: "סטטוס", type: "select", options: [
      { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }
    ]},
    { label: "תאריך הצטרפות", readOnly: true, render: r => r.created_date ? new Date(r.created_date).toLocaleDateString('he-IL') : '—' },
  ]},
];

export default function CrmCompanies() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['crm-companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-companies'] }); setShowForm(false); setFormData({}); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-companies'] }); setEditingId(null); },
  });

  const filtered = companies.filter(c =>
    !search || c.name?.includes(search) || c.business_number?.includes(search) || c.phone?.includes(search)
  );

  return (
    <div className="p-4 lg:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">חברות</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש..."
              className="pr-9 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 w-60" />
          </div>
          <Button onClick={() => { setFormData({}); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-2" /> חברה חדשה
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
                  <tr><td colSpan={COLUMNS.length + 1} className="text-center py-10 text-gray-600">אין חברות</td></tr>
                )}
                {filtered.map(company => (
                  editingId === company.id ? (
                    <QuickEditRow key={company.id} record={company} columns={COLUMNS}
                      onSave={data => updateMutation.mutate({ id: company.id, data })}
                      onCancel={() => setEditingId(null)} />
                  ) : (
                    <tr key={company.id}
                      onClick={() => navigate(createPageUrl(`CompanyCard/${company.id}`))}
                      className="group border-b border-[rgba(45,212,168,0.05)] hover:bg-[rgba(45,212,168,0.03)] transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-sm text-white font-medium">{company.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{company.business_number || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{company.phone || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{company.email || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{company.city || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={statusMap[company.status]} label={statusLabels[company.status]} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{company.assigned_agent || '—'}</td>
                      <td className="px-3 py-3">
                        <RowActions
                          onOpen={e => { e.stopPropagation(); navigate(createPageUrl(`CompanyCard/${company.id}`)); }}
                          onEdit={e => { e.stopPropagation(); setEditingId(company.id); }}
                          onDrawer={e => { e.stopPropagation(); setDrawerRecord(company); }}
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
          await base44.entities.Company.update(drawerRecord.id, draft);
          queryClient.invalidateQueries({ queryKey: ['crm-companies'] });
          setDrawerRecord(prev => ({ ...prev, ...draft }));
        }}
        title={r => r.name}
        subtitle={drawerRecord ? statusLabels[drawerRecord.status] : ''}
        subtitleColor={drawerRecord?.status === 'active' ? '#2dd4a8' : '#94a3b8'}
        avatar={r => r.name?.[0] || 'C'}
        avatarColor="#60a5fa"
        sections={drawerSections}
        cardPage={drawerRecord ? `CompanyCard/${drawerRecord.id}` : null}
      />

      <FormModal open={showForm} onClose={setShowForm} title="חברה חדשה" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}