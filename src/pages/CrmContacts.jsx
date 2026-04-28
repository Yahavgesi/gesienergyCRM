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

const statusLabels = { active: "פעיל", inactive: "לא פעיל", vip: "VIP" };
const statusMap = { active: "completed", inactive: "blocked", vip: "in_progress" };

const COLUMNS = [
  { key: "full_name", label: "שם" },
  { key: "phone", label: "טלפון" },
  { key: "email", label: "אימייל" },
  { key: "city", label: "עיר" },
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }, { value: "vip", label: "VIP" }
  ]},
  { key: "assigned_agent", label: "סוכן" },
  { key: "created_date", label: "תאריך" },
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

const drawerSections = [
  { title: "פרטי קשר", fields: [
    { key: "full_name", label: "שם מלא" },
    { key: "phone", label: "טלפון" },
    { key: "email", label: "אימייל" },
    { key: "id_number", label: "ת.ז." },
  ]},
  { title: "מיקום ופרטים", fields: [
    { key: "address", label: "כתובת" },
    { key: "city", label: "עיר" },
    { key: "assigned_agent", label: "סוכן" },
    { key: "status", label: "סטטוס", type: "select", options: [
      { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }, { value: "vip", label: "VIP" }
    ]},
    { key: "language", label: "שפה", type: "select", options: [
      { value: "he", label: "עברית" }, { value: "en", label: "English" }, { value: "ar", label: "عربي" }, { value: "ru", label: "Русский" }
    ]},
    { label: "תאריך הצטרפות", readOnly: true, render: r => r.created_date ? new Date(r.created_date).toLocaleDateString('he-IL') : '—' },
  ]},
];

export default function CrmContacts() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-contacts'] }); setShowForm(false); setFormData({}); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-contacts'] }); setEditingId(null); },
  });

  const filtered = contacts.filter(c =>
    !search || c.full_name?.includes(search) || c.phone?.includes(search) || c.email?.includes(search)
  );

  return (
    <div className="p-4 lg:p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">אנשי קשר</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש..."
              className="pr-9 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 w-60" />
          </div>
          <Button onClick={() => { setFormData({}); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-2" /> איש קשר חדש
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
                  <tr><td colSpan={COLUMNS.length + 1} className="text-center py-10 text-gray-600">אין אנשי קשר</td></tr>
                )}
                {filtered.map(contact => (
                  editingId === contact.id ? (
                    <QuickEditRow key={contact.id} record={contact} columns={COLUMNS}
                      onSave={data => updateMutation.mutate({ id: contact.id, data })}
                      onCancel={() => setEditingId(null)} />
                  ) : (
                    <tr key={contact.id}
                      onClick={() => navigate(createPageUrl(`ContactCard?id=${contact.id}`))}
                      className="group border-b border-[rgba(45,212,168,0.05)] hover:bg-[rgba(45,212,168,0.03)] transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-sm text-white font-medium">{contact.full_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{contact.phone || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{contact.email || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{contact.city || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={statusMap[contact.status]} label={statusLabels[contact.status]} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{contact.assigned_agent || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {contact.created_date ? new Date(contact.created_date).toLocaleDateString('he-IL') : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <RowActions
                          onOpen={e => { e.stopPropagation(); navigate(createPageUrl(`ContactCard?id=${contact.id}`)); }}
                          onEdit={e => { e.stopPropagation(); setEditingId(contact.id); }}
                          onDrawer={e => { e.stopPropagation(); setDrawerRecord(contact); }}
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
          await base44.entities.Contact.update(drawerRecord.id, draft);
          queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
          setDrawerRecord(prev => ({ ...prev, ...draft }));
        }}
        title={r => r.full_name}
        subtitle={drawerRecord ? statusLabels[drawerRecord.status] : ''}
        subtitleColor={drawerRecord?.status === 'vip' ? '#fbbf24' : drawerRecord?.status === 'active' ? '#2dd4a8' : '#94a3b8'}
        avatar={r => r.full_name?.[0] || 'C'}
        sections={drawerSections}
        cardPage="ContactCard"
      />

      <FormModal open={showForm} onClose={setShowForm} title="איש קשר חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}