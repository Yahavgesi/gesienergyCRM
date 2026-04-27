import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Zap, DollarSign, ClipboardList, Target, UserCheck, Package, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import KpiCard from "../components/crm/KpiCard";
import SkeletonCard from "../components/shared/SkeletonCard";

const REPORT_TABS = [
  { id: 'overview', label: 'סקירה כללית', icon: BarChart3 },
  { id: 'sales', label: 'דוח מכירות', icon: TrendingUp },
  { id: 'projects', label: 'דוח פרויקטים', icon: ClipboardList },
  { id: 'financial', label: 'דוח פיננסי', icon: DollarSign },
  { id: 'leads', label: 'דוח לידים', icon: Target },
  { id: 'employees', label: 'דוח עובדים', icon: UserCheck },
  { id: 'inventory', label: 'דוח מלאי', icon: Package },
];

const COLORS = ['#2dd4a8','#60a5fa','#a78bfa','#fbbf24','#f87171','#34d399','#22d3ee'];
const tooltipStyle = { background: '#0f2229', border: '1px solid rgba(45,212,168,0.2)', borderRadius: 10, color: '#fff', fontSize: 11 };

export default function CrmReportsHub() {
  const [tab, setTab] = useState('overview');

  const { data: deals = [], isLoading: l1 } = useQuery({ queryKey: ['rh-deals'], queryFn: () => base44.entities.Deal.list('-created_date', 500) });
  const { data: leads = [], isLoading: l2 } = useQuery({ queryKey: ['rh-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 500) });
  const { data: projects = [], isLoading: l3 } = useQuery({ queryKey: ['rh-projects'], queryFn: () => base44.entities.Project.list('-created_date', 200) });
  const { data: payments = [], isLoading: l4 } = useQuery({ queryKey: ['rh-payments'], queryFn: () => base44.entities.Payment.list('-created_date', 500) });
  const { data: expenses = [], isLoading: l5 } = useQuery({ queryKey: ['rh-expenses'], queryFn: () => base44.entities.Expense.list('-date', 500) });
  const { data: employees = [] } = useQuery({ queryKey: ['rh-employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: inventory = [] } = useQuery({ queryKey: ['rh-inventory'], queryFn: () => base44.entities.Inventory.list() });
  const { data: salaries = [] } = useQuery({ queryKey: ['rh-salaries'], queryFn: () => base44.entities.SalaryPayment.list('-month', 200) });

  const isLoading = l1 || l2 || l3 || l4 || l5;

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalSalaries = salaries.filter(s => s.status === 'paid').reduce((s, p) => s + (p.total || 0), 0);
  const profit = totalRevenue - totalExpenses - totalSalaries;
  const totalKwp = projects.reduce((s, p) => s + (p.kwp || 0), 0);
  const conversionRate = leads.length > 0 ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : 0;

  const monthly6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5-i));
    const key = d.toISOString().slice(0,7);
    return {
      month: key.slice(5),
      הכנסות: payments.filter(p => p.status==='completed' && p.created_date?.startsWith(key)).reduce((s,p) => s+(p.amount||0),0),
      הוצאות: expenses.filter(e => e.date?.startsWith(key)).reduce((s,e) => s+(e.amount||0),0),
      לידים: leads.filter(l => l.created_date?.startsWith(key)).length,
      עסקאות: deals.filter(d => d.created_date?.startsWith(key)).length,
    };
  });

  const stageData = ['new_lead','contacted','qualified','proposal','negotiation','signed','deposit_paid','handover_ops'].map(s => ({
    name: { new_lead:'חדש', contacted:'קשר', qualified:'מתאים', proposal:'הצעה', negotiation:'מו"מ', signed:'נחתם', deposit_paid:'מקדמה', handover_ops:'מסירה' }[s],
    count: deals.filter(d => d.stage === s).length,
  }));

  const sourceData = ['website','referral','facebook','google','phone','walk_in','other'].map(s => ({
    name: { website:'אתר', referral:'המלצה', facebook:'פייסבוק', google:'גוגל', phone:'טלפון', walk_in:'הגיע', other:'אחר' }[s],
    count: leads.filter(l => l.source === s).length,
  })).filter(s => s.count > 0);

  const agentData = Object.values(deals.reduce((acc, d) => {
    const a = d.assigned_agent || 'לא משויך';
    if (!acc[a]) acc[a] = { agent: a.split('@')[0], deals: 0, kwp: 0 };
    acc[a].deals++; acc[a].kwp += d.kwp || 0;
    return acc;
  }, {})).sort((a,b) => b.kwp - a.kwp).slice(0, 6);

  const projectTypeData = ['residential','commercial','tender'].map(t => ({
    name: { residential:'פרטי', commercial:'מסחרי', tender:'מכרז' }[t],
    count: projects.filter(p => p.type === t).length,
    kwp: projects.filter(p => p.type === t).reduce((s, p) => s + (p.kwp || 0), 0).toFixed(0),
  }));

  const roleData = Object.values(employees.reduce((acc, e) => {
    const r = e.role || 'other';
    if (!acc[r]) acc[r] = { name: r, count: 0 };
    acc[r].count++;
    return acc;
  }, {}));

  const lowStock = inventory.filter(i => (i.quantity || 0) <= (i.min_quantity || 0));
  const inventoryCatData = Object.values(inventory.reduce((acc, i) => {
    const c = i.category || 'other';
    if (!acc[c]) acc[c] = { name: c, count: 0, value: 0 };
    acc[c].count++; acc[c].value += (i.quantity || 0) * (i.cost_price || 0);
    return acc;
  }, {}));

  if (isLoading) return <div className="p-6 space-y-4" dir="rtl">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="p-4 lg:p-6 space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">דוחות ואנליטיקס</h1>
        <p className="text-sm text-gray-400">נתונים עדכניים על כל תחומי הפעילות</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-[rgba(45,212,168,0.1)]">
        {REPORT_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'text-[#2dd4a8] border-b-2 border-[#2dd4a8]' : 'text-gray-400 hover:text-white'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard title="הכנסות" value={`₪${totalRevenue.toLocaleString()}`} icon={DollarSign} />
            <KpiCard title="רווח נקי" value={`₪${profit.toLocaleString()}`} icon={TrendingUp} delay={0.05} />
            <KpiCard title="שיעור המרה" value={`${conversionRate}%`} icon={Target} delay={0.1} />
            <KpiCard title="סה״כ kWp" value={totalKwp.toFixed(1)} icon={Zap} delay={0.15} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="gesi-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">הכנסות מול הוצאות (6 חודשים)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly6}>
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => `₪${v.toLocaleString()}`} />
                    <Bar dataKey="הכנסות" fill="#2dd4a8" radius={[4,4,0,0]} />
                    <Bar dataKey="הוצאות" fill="#f87171" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="gesi-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">לידים ועסקאות (6 חודשים)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly6}>
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="לידים" stroke="#2dd4a8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="עסקאות" stroke="#60a5fa" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Report */}
      {tab === 'sales' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard title="סה״כ עסקאות" value={deals.length} icon={BarChart3} />
            <KpiCard title="kWp נמכר" value={deals.reduce((s,d) => s+(d.kwp||0),0).toFixed(0)} icon={Zap} delay={0.05} />
            <KpiCard title="הכנסה צפויה" value={`₪${deals.reduce((s,d) => s+(d.revenue||0),0).toLocaleString()}`} icon={DollarSign} delay={0.1} />
            <KpiCard title="ממוצע עסקה" value={`₪${deals.length ? Math.round(deals.reduce((s,d) => s+(d.revenue||0),0)/deals.length).toLocaleString() : 0}`} icon={TrendingUp} delay={0.15} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="gesi-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">עסקאות לפי שלב</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#2dd4a8" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="gesi-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">kWp לפי סוכן</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentData} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis dataKey="agent" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="kwp" fill="#60a5fa" radius={[0,6,6,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Report */}
      {tab === 'projects' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard title="סה״כ פרויקטים" value={projects.length} icon={ClipboardList} />
            <KpiCard title="פעילים" value={projects.filter(p=>p.status==='active').length} icon={ClipboardList} delay={0.05} />
            <KpiCard title="הושלמו" value={projects.filter(p=>p.status==='completed').length} icon={ClipboardList} delay={0.1} />
            <KpiCard title="סה״כ kWp" value={totalKwp.toFixed(0)} icon={Zap} delay={0.15} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {projectTypeData.map(t => (
              <div key={t.name} className="gesi-card p-5 text-center">
                <p className="text-3xl font-bold text-[#2dd4a8] mb-1">{t.count}</p>
                <p className="text-sm text-white mb-1">{t.name}</p>
                <p className="text-xs text-gray-400">{t.kwp} kWp</p>
              </div>
            ))}
          </div>
          <div className="gesi-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">פרויקטים אחרונים</h3>
            <div className="divide-y divide-[rgba(45,212,168,0.05)]">
              {projects.slice(0,10).map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.customer_name} • {p.address || '—'}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#2dd4a8]">{p.kwp} kWp</span>
                    <span className={`px-2 py-0.5 rounded-full ${p.status==='completed' ? 'bg-[#2dd4a8]/10 text-[#2dd4a8]' : p.status==='active' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {p.status==='active' ? 'פעיל' : p.status==='completed' ? 'הושלם' : p.status==='on_hold' ? 'מושהה' : 'בוטל'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Financial Report */}
      {tab === 'financial' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard title="הכנסות" value={`₪${totalRevenue.toLocaleString()}`} icon={DollarSign} />
            <KpiCard title="הוצאות" value={`₪${totalExpenses.toLocaleString()}`} icon={DollarSign} delay={0.05} />
            <KpiCard title="שכר" value={`₪${totalSalaries.toLocaleString()}`} icon={DollarSign} delay={0.1} />
            <KpiCard title="רווח נקי" value={`₪${profit.toLocaleString()}`} icon={TrendingUp} delay={0.15} />
          </div>
          <div className="gesi-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">תזרים חודשי</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly6}>
                  <defs>
                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2dd4a8" stopOpacity={0.3} /><stop offset="95%" stopColor="#2dd4a8" stopOpacity={0} /></linearGradient>
                    <linearGradient id="expGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.3} /><stop offset="95%" stopColor="#f87171" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => `₪${v.toLocaleString()}`} />
                  <Area type="monotone" dataKey="הכנסות" stroke="#2dd4a8" fill="url(#revGrad2)" strokeWidth={2} />
                  <Area type="monotone" dataKey="הוצאות" stroke="#f87171" fill="url(#expGrad2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Leads Report */}
      {tab === 'leads' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard title="סה״כ לידים" value={leads.length} icon={Target} />
            <KpiCard title="הומרו" value={leads.filter(l=>l.status==='converted').length} icon={TrendingUp} delay={0.05} />
            <KpiCard title="שיעור המרה" value={`${conversionRate}%`} icon={TrendingUp} delay={0.1} />
            <KpiCard title="לא מוסמכים" value={leads.filter(l=>l.status==='unqualified').length} icon={Target} delay={0.15} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="gesi-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">לידים לפי מקור</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                      {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="gesi-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">לידים לפי שלב</h3>
              <div className="space-y-2">
                {['new_lead','initial_contact','site_survey','quote_sent','negotiation','closing','won','lost'].map(s => {
                  const cnt = leads.filter(l => l.sales_stage === s).length;
                  const pct = leads.length ? (cnt/leads.length*100).toFixed(0) : 0;
                  const labels = { new_lead:'ליד חדש', initial_contact:'יצירת קשר', site_survey:'סיור', quote_sent:'הצעת מחיר', negotiation:'מו"מ', closing:'סגירה', won:'נסגר', lost:'אבוד' };
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-24 flex-shrink-0">{labels[s]}</span>
                      <div className="flex-1 h-2 bg-[#142e38] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s==='won'?'bg-[#2dd4a8]':s==='lost'?'bg-red-400':'bg-blue-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-white w-8 text-left">{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employees Report */}
      {tab === 'employees' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard title="סה״כ עובדים" value={employees.length} icon={UserCheck} />
            <KpiCard title="פעילים" value={employees.filter(e=>e.status==='active').length} icon={UserCheck} delay={0.05} />
            <KpiCard title="בחופשה" value={employees.filter(e=>e.status==='on_leave').length} icon={UserCheck} delay={0.1} />
            <KpiCard title="שכר חודשי" value={`₪${employees.reduce((s,e)=>(e.salary_type==='monthly'?s+(e.salary||0):s),0).toLocaleString()}`} icon={DollarSign} delay={0.15} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="gesi-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">עובדים לפי תפקיד</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name, value}) => `${name} (${value})`}>
                      {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="gesi-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">פרטי עובדים</h3>
              <div className="divide-y divide-[rgba(45,212,168,0.05)]">
                {employees.map(e => (
                  <div key={e.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#2dd4a8]/20 flex items-center justify-center text-xs font-bold text-[#2dd4a8]">{e.full_name?.[0]}</div>
                      <div>
                        <p className="text-xs font-medium text-white">{e.full_name}</p>
                        <p className="text-[10px] text-gray-500">{e.role} • {e.department}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#2dd4a8]">₪{(e.salary||0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Report */}
      {tab === 'inventory' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard title="פריטים במלאי" value={inventory.length} icon={Package} />
            <KpiCard title="מלאי נמוך" value={lowStock.length} icon={Package} delay={0.05} />
            <KpiCard title="שווי מלאי" value={`₪${inventory.reduce((s,i) => s+(i.quantity||0)*(i.cost_price||0),0).toLocaleString()}`} icon={DollarSign} delay={0.1} />
            <KpiCard title="קטגוריות" value={inventoryCatData.length} icon={Package} delay={0.15} />
          </div>
          {lowStock.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <h3 className="text-sm font-semibold text-red-400 mb-3">⚠️ פריטים במלאי נמוך</h3>
              <div className="space-y-2">
                {lowStock.map(i => (
                  <div key={i.id} className="flex items-center justify-between text-xs">
                    <span className="text-white">{i.name}</span>
                    <span className="text-red-400">{i.quantity} / {i.min_quantity} {i.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="gesi-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">מלאי לפי קטגוריה</h3>
            <div className="space-y-3">
              {inventoryCatData.map(c => {
                const totalVal = inventory.reduce((s,i) => s+(i.quantity||0)*(i.cost_price||0),0);
                const pct = totalVal > 0 ? (c.value/totalVal*100).toFixed(0) : 0;
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{c.name} ({c.count} פריטים)</span>
                      <span className="text-white">₪{c.value.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-[#142e38] rounded-full overflow-hidden">
                      <div className="h-full bg-[#2dd4a8]/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}