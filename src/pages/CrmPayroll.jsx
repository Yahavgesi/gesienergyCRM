import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, CheckCircle2 } from "lucide-react";
import FormModal from "../components/crm/FormModal";
import { motion } from "framer-motion";

export default function CrmPayroll() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ month: new Date().toISOString().slice(0, 7), status: "pending" });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ['crm-employees'],
    queryFn: () => base44.entities.Employee.list(),
  });

  const { data: salaries = [], isLoading } = useQuery({
    queryKey: ['crm-salaries', selectedMonth],
    queryFn: () => base44.entities.SalaryPayment.list('-month', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const emp = employees.find(e => e.id === data.employee_id);
      const total = (parseFloat(data.base_salary) || 0) + (parseFloat(data.commission) || 0) + (parseFloat(data.bonuses) || 0) - (parseFloat(data.deductions) || 0);
      return base44.entities.SalaryPayment.create({ ...data, employee_name: emp?.full_name, total });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-salaries'] }); setShowForm(false); },
  });

  const markPaid = useMutation({
    mutationFn: (id) => base44.entities.SalaryPayment.update(id, { status: "paid", paid_date: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-salaries'] }),
  });

  const monthSalaries = salaries.filter(s => s.month === selectedMonth);
  const totalPaid = monthSalaries.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.total || 0), 0);
  const totalPending = monthSalaries.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.total || 0), 0);

  const formFields = [
    { key: "employee_id", label: "עובד", type: "select", options: employees.map(e => ({ value: e.id, label: e.full_name })) },
    { key: "month", label: "חודש (YYYY-MM)", placeholder: "2025-01" },
    { key: "base_salary", label: "שכר בסיס (₪)", type: "number" },
    { key: "commission", label: "עמלה (₪)", type: "number" },
    { key: "bonuses", label: "בונוסים (₪)", type: "number" },
    { key: "deductions", label: "ניכויים (₪)", type: "number" },
    { key: "hours_worked", label: "שעות עבודה", type: "number" },
    { key: "notes", label: "הערות", type: "textarea" },
  ];

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">שכר ותגמולים</h1>
        <div className="flex items-center gap-3">
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="bg-[#142e38] border border-[rgba(45,212,168,0.1)] text-white rounded-lg px-3 py-2 text-sm" />
          <Button onClick={() => setShowForm(true)} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-2" /> הוסף שכר
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "שולם", value: `₪${totalPaid.toLocaleString()}`, color: "text-[#2dd4a8]" },
          { label: "ממתין לאישור", value: `₪${totalPending.toLocaleString()}`, color: "text-yellow-400" },
          { label: "סה״כ עובדים", value: monthSalaries.length, color: "text-white" },
        ].map(card => (
          <div key={card.label} className="gesi-card p-4">
            <p className="text-xs text-gray-400 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-[#142e38] animate-pulse" />)}</div>
      ) : monthSalaries.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>אין רשומות שכר לחודש זה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {monthSalaries.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="gesi-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#2dd4a8]/10 flex items-center justify-center text-[#2dd4a8] font-bold">
                  {s.employee_name?.[0] || '?'}
                </div>
                <div>
                  <p className="font-semibold text-white">{s.employee_name || 'לא ידוע'}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span>בסיס: ₪{(s.base_salary || 0).toLocaleString()}</span>
                    {s.commission > 0 && <span>עמלה: ₪{s.commission.toLocaleString()}</span>}
                    {s.bonuses > 0 && <span>בונוס: ₪{s.bonuses.toLocaleString()}</span>}
                    {s.hours_worked && <span>{s.hours_worked} שעות</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-[#2dd4a8]">₪{(s.total || 0).toLocaleString()}</p>
                  <p className={`text-xs ${s.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {s.status === 'paid' ? `שולם ${s.paid_date || ''}` : 'ממתין לאישור'}
                  </p>
                </div>
                {s.status !== 'paid' && (
                  <Button size="sm" onClick={() => markPaid.mutate(s.id)}
                    className="bg-[#2dd4a8]/10 hover:bg-[#2dd4a8]/20 text-[#2dd4a8] border border-[#2dd4a8]/30">
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <FormModal open={showForm} onClose={setShowForm} title="הוסף תשלום שכר" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}