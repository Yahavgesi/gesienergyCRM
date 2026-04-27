import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Receipt, Briefcase, CreditCard, Plus, Filter, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import KpiCard from "../components/crm/KpiCard";
import SkeletonCard from "../components/shared/SkeletonCard";
import FormModal from "../components/crm/FormModal";

const TABS = [
  { id: 'overview', label: 'סקירה' },
  { id: 'income', label: 'הכנסות' },
  { id: 'expenses', label: 'הוצאות' },
  { id: 'payroll', label: 'שכר' },
  { id: 'cashflow', label: 'תזרים' },
];

export default function CrmFinancials() {
  const [tab, setTab] = useState('overview');
  const [expenseModal, setExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState({ currency: 'ILS', is_paid: false });
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading: l1 } = useQuery({ queryKey: ['fin-payments'], queryFn: () => base44.entities.Payment.list('-created_date', 500) });
  const { data: expenses = [], isLoading: l2 } = useQuery({ queryKey: ['fin-expenses'], queryFn: () => base44.entities.Expense.list('-date', 500) });
  const { data: salaries = [], isLoading: l3 } = useQuery({ queryKey: ['fin-salaries'], queryFn: () => base44.entities.SalaryPayment.list('-month', 200) });

  const createExpenseMutation = useMutation({
    mutationFn: (d) => base44.entities.Expense.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fin-expenses'] }); setExpenseModal(false); setExpenseData({ currency: 'ILS', is_paid: false }); }
  });

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalSalaries = salaries.filter(s => s.status === 'paid').reduce((s, p) => s + (p.total || 0), 0);
  const profit = totalRevenue - totalExpenses - totalSalaries;
  const pendingPayments = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);

  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const key = d.toISOString().slice(0, 7);
    return {
      month: key.slice(5),
      הכנסות: payments.filter(p => p.status === 'completed' && p.created_date?.startsWith(key)).reduce((s, p) => s + (p.amount || 0), 0),
      הוצאות: expenses.filter(e => e.date?.startsWith(key)).reduce((s, e) => s + (e.amount || 0), 0),
      שכר: salaries.filter(s => s.month === key && s.status === 'paid').reduce((s, p) => s + (p.total || 0), 0),
    };
  });

  const catBreakdown = expenses.reduce((acc, e) => {
    const c = e.category || 'other';
    acc[c] = (acc[c] || 0) + (e.amount || 0);
    return acc;
  }, {});
  const catData = Object.entries(catBreakdown).map(([k, v]) => ({ name: k, amount: v })).sort((a,b) => b.amount - a.amount);

  const tooltipStyle = { background: '#0f2229', border: '1px solid rgba(45,212,168,0.2)', borderRadius: 10, color: '#fff', fontSize: 11 };

  if (l1 || l2 || l3) return <div className="p-6 space-y-4" dir="rtl">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="p-4 lg:p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">פיננסי</h1>
          <p className="text-sm text-gray-400">ניהול כספים, הכנסות, הוצאות ושכר</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-[#142e38]" size="sm">
            <Download className="w-4 h-4 ml-1" /> ייצוא
          </Button>
          <Button onClick={() => setExpenseModal(true)} size="sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-1" /> הוצאה חדשה
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard title="סה״כ הכנסות" value={`₪${totalRevenue.toLocaleString()}`} icon={TrendingUp} />
        <KpiCard title="סה״כ הוצאות" value={`₪${totalExpenses.toLocaleString()}`} icon={TrendingDown} delay={0.05} />
        <KpiCard title="סה״כ שכר" value={`₪${totalSalaries.toLocaleString()}`} icon={Briefcase} delay={0.1} />
        <KpiCard title="רווח נקי" value={`₪${profit.toLocaleString()}`} icon={DollarSign} delay={0.15} />
        <KpiCard title="ממתין לגבייה" value={`₪${pendingPayments.toLocaleString()}`} icon={CreditCard} delay={0.2} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[rgba(45,212,168,0.1)]">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? 'text-[#2dd4a8] border-b-2 border-[#2dd4a8]' : 'text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="gesi-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">הכנסות מול הוצאות - 6 חודשים</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => `₪${v.toLocaleString()}`} />
                  <Bar dataKey="הכנסות" fill="#2dd4a8" radius={[4,4,0,0]} />
                  <Bar dataKey="הוצאות" fill="#f87171" radius={[4,4,0,0]} />
                  <Bar dataKey="שכר" fill="#a78bfa" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="gesi-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">פירוט הוצאות לפי קטגוריה</h3>
              <div className="space-y-3">
                {catData.slice(0, 6).map(c => {
                  const pct = totalExpenses > 0 ? (c.amount / totalExpenses * 100).toFixed(0) : 0;
                  return (
                    <div key={c.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{c.name}</span>
                        <span className="text-white font-medium">₪{c.amount.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-[#142e38] rounded-full overflow-hidden">
                        <div className="h-full bg-[#2dd4a8] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="gesi-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">סיכום כספי</h3>
              <div className="space-y-3">
                {[
                  { label: 'סה״כ הכנסות', val: totalRevenue, color: 'text-[#2dd4a8]' },
                  { label: 'הוצאות תפעוליות', val: totalExpenses, color: 'text-red-400' },
                  { label: 'הוצאות שכר', val: totalSalaries, color: 'text-purple-400' },
                  { label: 'רווח נקי', val: profit, color: profit >= 0 ? 'text-[#2dd4a8]' : 'text-red-400' },
                  { label: 'שיעור רווח', val: totalRevenue > 0 ? `${((profit/totalRevenue)*100).toFixed(1)}%` : '—', color: 'text-blue-400', isStr: true },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-[rgba(45,212,168,0.05)] last:border-0">
                    <span className="text-sm text-gray-400">{row.label}</span>
                    <span className={`text-sm font-bold ${row.color}`}>
                      {row.isStr ? row.val : `₪${(row.val || 0).toLocaleString()}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'income' && (
        <div className="space-y-4">
          <div className="gesi-card overflow-hidden">
            <div className="p-4 border-b border-[rgba(45,212,168,0.1)]">
              <h3 className="text-sm font-semibold text-gray-300">כל ההכנסות ({payments.length})</h3>
            </div>
            <div className="divide-y divide-[rgba(45,212,168,0.05)]">
              {payments.slice(0, 30).map(p => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-[#142e38]/30 transition-colors">
                  <div>
                    <p className="text-sm text-white">{p.description || p.type || 'תשלום'}</p>
                    <p className="text-xs text-gray-500">{p.method || '—'} • {p.created_date ? new Date(p.created_date).toLocaleDateString('he-IL') : '—'}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#2dd4a8]">₪{(p.amount || 0).toLocaleString()}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-green-500/10 text-green-400' : p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                      {p.status === 'completed' ? 'שולם' : p.status === 'pending' ? 'ממתין' : p.status}
                    </span>
                  </div>
                </div>
              ))}
              {payments.length === 0 && <p className="text-center text-gray-500 py-8 text-sm">אין הכנסות</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="gesi-card overflow-hidden">
            <div className="p-4 border-b border-[rgba(45,212,168,0.1)] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">כל ההוצאות ({expenses.length})</h3>
              <Button onClick={() => setExpenseModal(true)} size="sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
                <Plus className="w-4 h-4 ml-1" /> הוסף
              </Button>
            </div>
            <div className="divide-y divide-[rgba(45,212,168,0.05)]">
              {expenses.slice(0, 30).map(e => (
                <div key={e.id} className="px-4 py-3 flex items-center justify-between hover:bg-[#142e38]/30 transition-colors">
                  <div>
                    <p className="text-sm text-white">{e.title}</p>
                    <p className="text-xs text-gray-500">{e.category || '—'} • {e.date || '—'}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-red-400">₪{(e.amount || 0).toLocaleString()}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${e.is_paid ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {e.is_paid ? 'שולם' : 'ממתין'}
                    </span>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && <p className="text-center text-gray-500 py-8 text-sm">אין הוצאות</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="space-y-4">
          <div className="gesi-card overflow-hidden">
            <div className="p-4 border-b border-[rgba(45,212,168,0.1)]">
              <h3 className="text-sm font-semibold text-gray-300">תשלומי שכר ({salaries.length})</h3>
            </div>
            <div className="divide-y divide-[rgba(45,212,168,0.05)]">
              {salaries.slice(0, 30).map(s => (
                <div key={s.id} className="px-4 py-3 flex items-center justify-between hover:bg-[#142e38]/30 transition-colors">
                  <div>
                    <p className="text-sm text-white">{s.employee_name}</p>
                    <p className="text-xs text-gray-500">חודש {s.month}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-purple-400">₪{(s.total || 0).toLocaleString()}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {s.status === 'paid' ? 'שולם' : 'ממתין'}
                    </span>
                  </div>
                </div>
              ))}
              {salaries.length === 0 && <p className="text-center text-gray-500 py-8 text-sm">אין רשומות שכר</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'cashflow' && (
        <div className="gesi-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">תזרים מזומנים - 6 חודשים</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly.map(m => ({ ...m, תזרים: m['הכנסות'] - m['הוצאות'] - m['שכר'] }))}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4a8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2dd4a8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => `₪${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="תזרים" stroke="#2dd4a8" fill="url(#cashGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <FormModal open={expenseModal} onClose={setExpenseModal} title="הוצאה חדשה"
        fields={[
          { key: 'title', label: 'כותרת', placeholder: 'שם הוצאה' },
          { key: 'category', label: 'קטגוריה', type: 'select', options: [
            { value: 'salary', label: 'שכר' }, { value: 'supplier', label: 'ספק' },
            { value: 'equipment', label: 'ציוד' }, { value: 'fuel', label: 'דלק' },
            { value: 'office', label: 'משרד' }, { value: 'marketing', label: 'שיווק' },
            { value: 'permits', label: 'היתרים' }, { value: 'other', label: 'אחר' },
          ]},
          { key: 'amount', label: 'סכום', type: 'number', placeholder: '0' },
          { key: 'date', label: 'תאריך', type: 'date' },
          { key: 'invoice_number', label: 'מספר חשבונית', placeholder: '12345' },
          { key: 'notes', label: 'הערות', type: 'textarea' },
        ]}
        data={expenseData} setData={setExpenseData}
        onSubmit={() => createExpenseMutation.mutate(expenseData)}
        submitting={createExpenseMutation.isPending}
      />
    </div>
  );
}