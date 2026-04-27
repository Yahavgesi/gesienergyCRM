import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Receipt, CheckCircle2, XCircle } from "lucide-react";
import FormModal from "../components/crm/FormModal";
import DataTable from "../components/crm/DataTable";

const categoryLabels = { salary: "שכר", supplier: "ספק", equipment: "ציוד", fuel: "דלק", office: "משרד", marketing: "שיווק", permits: "היתרים", other: "אחר" };
const categoryColors = { salary: "text-purple-400", supplier: "text-orange-400", equipment: "text-blue-400", fuel: "text-yellow-400", office: "text-gray-400", marketing: "text-pink-400", permits: "text-green-400", other: "text-gray-400" };

export default function CrmExpenses() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ date: new Date().toISOString().slice(0, 10), is_paid: false });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['crm-expenses'],
    queryFn: () => base44.entities.Expense.list('-date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-expenses'] }); setShowForm(false); setFormData({ date: new Date().toISOString().slice(0, 10), is_paid: false }); },
  });

  const togglePaid = useMutation({
    mutationFn: ({ id, is_paid }) => base44.entities.Expense.update(id, { is_paid }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-expenses'] }),
  });

  const totalPaid = expenses.filter(e => e.is_paid).reduce((s, e) => s + (e.amount || 0), 0);
  const totalPending = expenses.filter(e => !e.is_paid).reduce((s, e) => s + (e.amount || 0), 0);
  const thisMonth = expenses.filter(e => e.date?.startsWith(new Date().toISOString().slice(0, 7)));
  const thisMonthTotal = thisMonth.reduce((s, e) => s + (e.amount || 0), 0);

  const filtered = expenses.filter(e =>
    (catFilter === "all" || e.category === catFilter) &&
    (!search || e.title?.includes(search) || e.invoice_number?.includes(search))
  );

  const formFields = [
    { key: "title", label: "כותרת", placeholder: "תיאור ההוצאה" },
    { key: "category", label: "קטגוריה", type: "select", options: Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l })) },
    { key: "amount", label: "סכום (₪)", type: "number", placeholder: "0" },
    { key: "date", label: "תאריך", type: "date" },
    { key: "invoice_number", label: "מספר חשבונית" },
    { key: "notes", label: "הערות", type: "textarea" },
  ];

  const columns = [
    { key: "title", label: "כותרת" },
    { key: "category", label: "קטגוריה", render: r => (
      <span className={`text-xs font-medium ${categoryColors[r.category]}`}>{categoryLabels[r.category] || r.category || '—'}</span>
    )},
    { key: "amount", label: "סכום", render: r => <span className="font-bold text-white">₪{(r.amount || 0).toLocaleString()}</span> },
    { key: "date", label: "תאריך", render: r => r.date ? new Date(r.date).toLocaleDateString('he-IL') : '—' },
    { key: "invoice_number", label: "חשבונית", render: r => r.invoice_number || '—' },
    { key: "is_paid", label: "שולם", render: r => (
      <button onClick={(e) => { e.stopPropagation(); togglePaid.mutate({ id: r.id, is_paid: !r.is_paid }); }}>
        {r.is_paid ? <CheckCircle2 className="w-5 h-5 text-[#2dd4a8]" /> : <XCircle className="w-5 h-5 text-gray-600 hover:text-gray-400" />}
      </button>
    )},
  ];

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">הוצאות</h1>
        <Button onClick={() => { setFormData({ date: new Date().toISOString().slice(0, 10), is_paid: false }); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-2" /> הוצאה חדשה
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "הוצאות החודש", value: `₪${thisMonthTotal.toLocaleString()}`, color: "text-white" },
          { label: "שולם", value: `₪${totalPaid.toLocaleString()}`, color: "text-[#2dd4a8]" },
          { label: "ממתין לתשלום", value: `₪${totalPending.toLocaleString()}`, color: "text-red-400" },
        ].map(card => (
          <div key={card.label} className="gesi-card p-4">
            <p className="text-xs text-gray-400 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש..." className="pr-9 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 w-56" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[["all", "הכל"], ...Object.entries(categoryLabels)].map(([val, label]) => (
            <button key={val} onClick={() => setCatFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${catFilter === val ? 'bg-[#2dd4a8] text-white' : 'bg-[#142e38] text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="h-64 rounded-xl bg-[#142e38] animate-pulse" /> : (
        <DataTable columns={columns} data={filtered} emptyMessage="אין הוצאות" />
      )}

      <FormModal open={showForm} onClose={setShowForm} title="הוצאה חדשה" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}