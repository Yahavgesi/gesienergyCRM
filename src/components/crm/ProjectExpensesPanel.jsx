import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, CheckCircle2, Clock } from "lucide-react";
import FormModal from "./FormModal";
import { toast } from "sonner";

const CAT_LABELS = {
  panels: 'פאנלים', inverters: 'מהפכים', installation: 'התקנה',
  permits: 'היתרים', transportation: 'הובלה', labor: 'עבודה', other: 'אחר'
};
const CAT_COLORS = {
  panels: 'text-blue-400 bg-blue-400/10', inverters: 'text-purple-400 bg-purple-400/10',
  installation: 'text-amber-400 bg-amber-400/10', permits: 'text-orange-400 bg-orange-400/10',
  transportation: 'text-cyan-400 bg-cyan-400/10', labor: 'text-[#2dd4a8] bg-[#2dd4a8]/10',
  other: 'text-gray-400 bg-gray-400/10'
};

export default function ProjectExpensesPanel({ project }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currency: 'ILS', is_paid: false });
  const queryClient = useQueryClient();

  const { data: expenses = [] } = useQuery({
    queryKey: ['project-expenses', project.id],
    queryFn: () => base44.entities.ProjectExpense.filter({ project_id: project.id }),
    enabled: !!project.id,
  });

  const createExpense = useMutation({
    mutationFn: (d) => base44.entities.ProjectExpense.create({ ...d, project_id: project.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses', project.id] });
      setOpen(false); setForm({ currency: 'ILS', is_paid: false });
      toast.success('הוצאה נרשמה');
    },
  });

  const togglePaid = useMutation({
    mutationFn: ({ id, is_paid }) => base44.entities.ProjectExpense.update(id, { is_paid: !is_paid, paid_date: !is_paid ? new Date().toISOString().slice(0,10) : null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-expenses', project.id] }),
  });

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalPaid = expenses.filter(e => e.is_paid).reduce((s, e) => s + (e.amount || 0), 0);
  const totalRevenue = project.total_price || 0;
  const margin = totalRevenue > 0 ? (((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1) : '—';

  const byCategory = expenses.reduce((acc, e) => {
    const c = e.category || 'other';
    if (!acc[c]) acc[c] = 0;
    acc[c] += (e.amount || 0);
    return acc;
  }, {});

  return (
    <div className="p-4 lg:p-6 space-y-5" dir="rtl">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'הכנסות פרויקט', val: `₪${totalRevenue.toLocaleString()}`, color: 'text-[#2dd4a8]' },
          { label: 'עלויות', val: `₪${totalExpenses.toLocaleString()}`, color: 'text-red-400' },
          { label: 'שולם לספקים', val: `₪${totalPaid.toLocaleString()}`, color: 'text-amber-400' },
          { label: 'מרווח', val: `${margin}%`, color: parseFloat(margin) > 0 ? 'text-[#2dd4a8]' : 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="gesi-card p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="gesi-card p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">פירוט לפי קטגוריה</h3>
          <div className="space-y-2">
            {Object.entries(byCategory).map(([cat, amt]) => {
              const pct = totalExpenses > 0 ? (amt / totalExpenses * 100).toFixed(0) : 0;
              const cls = CAT_COLORS[cat] || CAT_COLORS.other;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={cls.split(' ')[0]}>{CAT_LABELS[cat] || cat}</span>
                    <span className="text-white">₪{amt.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-[#142e38] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cls.split(' ')[1]?.replace('/10', '/50') || 'bg-gray-500/50'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-300">הוצאות ({expenses.length})</h3>
        <Button onClick={() => setOpen(true)} size="sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-1" /> הוצאה חדשה
        </Button>
      </div>

      <div className="space-y-2">
        {expenses.map(e => {
          const cls = CAT_COLORS[e.category] || CAT_COLORS.other;
          return (
            <div key={e.id} className="gesi-card p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cls.split(' ')[1]}`}>
                <Receipt className={`w-4 h-4 ${cls.split(' ')[0]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{e.description}</p>
                <p className="text-xs text-gray-400">{CAT_LABELS[e.category] || '—'} {e.supplier ? `• ${e.supplier}` : ''} {e.invoice_number ? `• חשב׳ ${e.invoice_number}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-red-400">₪{(e.amount || 0).toLocaleString()}</span>
                <button onClick={() => togglePaid.mutate({ id: e.id, is_paid: e.is_paid })}
                  className={`p-1.5 rounded-lg transition-colors ${e.is_paid ? 'text-[#2dd4a8] bg-[#2dd4a8]/10' : 'text-gray-500 hover:text-gray-300 hover:bg-[#142e38]'}`}
                  title={e.is_paid ? 'שולם' : 'סמן כשולם'}>
                  {e.is_paid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}
        {expenses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">אין הוצאות רשומות</p>
          </div>
        )}
      </div>

      <FormModal open={open} onClose={setOpen} title="הוצאת פרויקט"
        fields={[
          { key: 'description', label: 'תיאור', placeholder: 'תיאור ההוצאה' },
          { key: 'category', label: 'קטגוריה', type: 'select', options: Object.entries(CAT_LABELS).map(([v,l]) => ({ value: v, label: l })) },
          { key: 'amount', label: 'סכום', type: 'number', placeholder: '0' },
          { key: 'supplier', label: 'ספק', placeholder: 'שם הספק' },
          { key: 'invoice_number', label: 'מספר חשבונית', placeholder: '12345' },
          { key: 'notes', label: 'הערות', type: 'textarea' },
        ]}
        data={form} setData={setForm}
        onSubmit={() => createExpense.mutate(form)}
        submitting={createExpense.isPending}
      />
    </div>
  );
}