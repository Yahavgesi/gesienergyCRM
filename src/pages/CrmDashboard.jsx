import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "../components/crm/KpiCard";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Target, Kanban, Users, Zap, DollarSign, ClipboardList, TrendingUp, Clock, CheckCircle2, UserCheck, Truck, Warehouse, Receipt, AlertTriangle, ArrowUpRight, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const STAGE_COLORS = {
  new_lead: "#94a3b8", contacted: "#60a5fa", qualified: "#a78bfa",
  proposal: "#fbbf24", negotiation: "#fb923c", signed: "#2dd4a8",
  deposit_paid: "#34d399", handover_ops: "#22d3ee",
};
const STAGE_LABELS = {
  new_lead: "ליד חדש", contacted: "יצרנו קשר", qualified: "מוסמך",
  proposal: "הצעת מחיר", negotiation: "משא ומתן", signed: "חתום",
  deposit_paid: "מקדמה שולמה", handover_ops: "מועבר לתפעול",
};

export default function CrmDashboard() {
  const [selectedStage, setSelectedStage] = useState(null);

  const { data: leads = [], isLoading: l1 } = useQuery({ queryKey: ['crm-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 100) });
  const { data: deals = [], isLoading: l2 } = useQuery({ queryKey: ['crm-deals'], queryFn: () => base44.entities.Deal.list('-created_date', 100) });
  const { data: projects = [], isLoading: l3 } = useQuery({ queryKey: ['crm-projects'], queryFn: () => base44.entities.Project.list('-created_date', 50) });
  const { data: payments = [], isLoading: l4 } = useQuery({ queryKey: ['crm-payments'], queryFn: () => base44.entities.Payment.filter({ status: 'completed' }, '-created_date', 100) });
  const { data: tasks = [] } = useQuery({ queryKey: ['crm-tasks'], queryFn: () => base44.entities.Task.filter({ status: 'todo' }, '-created_date', 20) });
  const { data: employees = [] } = useQuery({ queryKey: ['crm-employees'], queryFn: () => base44.entities.Employee.filter({ status: 'active' }) });
  const { data: inventory = [] } = useQuery({ queryKey: ['crm-inventory'], queryFn: () => base44.entities.Inventory.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['dash-expenses'], queryFn: () => base44.entities.Expense.list('-date', 100) });

  const isLoading = l1 || l2 || l3 || l4;

  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalKwp = deals.reduce((s, d) => s + (d.kwp || 0), 0);
  const avgDealValue = deals.length > 0 ? deals.reduce((s, d) => s + (d.revenue || 0), 0) / deals.length : 0;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const conversionRate = leads.length > 0 ? ((deals.filter(d => ['signed','deposit_paid','handover_ops'].includes(d.stage)).length / leads.length) * 100).toFixed(1) : 0;
  const lowStockItems = inventory.filter(i => (i.quantity || 0) <= (i.min_quantity || 0));
  const pendingTasks = tasks.filter(t => t.status === 'todo').length;
  const thisMonthExpenses = expenses.filter(e => e.date?.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, e) => s + (e.amount || 0), 0);

  // Pipeline distribution
  const stageDistribution = Object.entries(
    deals.reduce((acc, d) => { acc[d.stage] = (acc[d.stage] || 0) + 1; return acc; }, {})
  ).map(([stageKey, value]) => ({
    stageKey, name: STAGE_LABELS[stageKey] || stageKey, value,
    fill: STAGE_COLORS[stageKey] || "#64748b",
    percentage: ((value / deals.length) * 100).toFixed(0)
  }));

  // Monthly activity (last 6 months)
  const monthlyLeads = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const key = d.toISOString().slice(0, 7);
    return {
      month: key.slice(5),
      leads: leads.filter(l => l.created_date?.startsWith(key)).length,
      revenue: payments.filter(p => p.created_date?.startsWith(key)).reduce((s, p) => s + (p.amount || 0), 0) / 1000,
    };
  });

  const tooltipStyle = { background: '#0f2229', border: '1px solid rgba(45,212,168,0.2)', borderRadius: 10, color: '#fff', fontSize: 11 };

  if (isLoading) return (
    <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
      {[1,2,3,4,5,6,7,8].map(i => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">דשבורד</h1>
          <p className="text-sm text-gray-400 mt-0.5">{new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        {lowStockItems.length > 0 && (
          <Link to={createPageUrl("CrmInventory")} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors">
            <AlertTriangle className="w-4 h-4" />
            {lowStockItems.length} פריטים במלאי נמוך
          </Link>
        )}
      </div>

      {/* KPI Row 1 - Sales */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">מכירות ופיפליין</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard title="לידים" value={leads.length} icon={Target} delay={0} />
          <KpiCard title="עסקאות פעילות" value={deals.length} icon={Kanban} delay={0.05} />
          <KpiCard title="שיעור המרה" value={`${conversionRate}%`} icon={TrendingUp} delay={0.1} />
          <KpiCard title="ממוצע עסקה" value={`₪${Math.round(avgDealValue).toLocaleString()}`} icon={DollarSign} delay={0.15} />
        </div>
      </div>

      {/* KPI Row 2 - Projects & Finance */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">פרויקטים וכספים</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard title="פרויקטים פעילים" value={activeProjects} icon={ClipboardList} delay={0.2} />
          <KpiCard title="הושלמו" value={completedProjects} icon={CheckCircle2} delay={0.25} />
          <KpiCard title="הכנסות" value={`₪${totalRevenue.toLocaleString()}`} icon={DollarSign} delay={0.3} />
          <KpiCard title="סה״כ kWp" value={totalKwp.toFixed(1)} icon={Zap} delay={0.35} />
        </div>
      </div>

      {/* KPI Row 3 - Operations */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">תפעול</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard title="עובדים פעילים" value={employees.length} icon={UserCheck} delay={0.4} />
          <KpiCard title="משימות פתוחות" value={pendingTasks} icon={Clock} delay={0.45} />
          <KpiCard title="הוצאות החודש" value={`₪${thisMonthExpenses.toLocaleString()}`} icon={Receipt} delay={0.5} />
          <KpiCard title="פריטי מלאי" value={inventory.length} icon={Warehouse} delay={0.55} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="gesi-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">מגמת לידים והכנסות (6 חודשים)</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyLeads}>
                <defs>
                  <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4a8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2dd4a8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="leads" stroke="#2dd4a8" fill="url(#leadsGrad)" strokeWidth={2} name="לידים" />
                <Area type="monotone" dataKey="revenue" stroke="#60a5fa" fill="url(#revGrad)" strokeWidth={2} name="הכנסות (אלפי ₪)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pipeline Pie */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="gesi-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">פילוח פיפליין</h3>
          {stageDistribution.length > 0 ? (
            <>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stageDistribution} dataKey="value" cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" paddingAngle={2}>
                      {stageDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} עסקאות`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {stageDistribution.slice(0, 4).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: entry.fill }} />
                      <span className="text-gray-400 truncate max-w-[100px]">{entry.name}</span>
                    </div>
                    <span className="text-white font-semibold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-gray-500 text-center py-8">אין עסקאות</p>}
        </motion.div>
      </div>

      {/* Bottom Row - Recent + Tasks + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Leads */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="gesi-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">לידים אחרונים</h3>
            <Link to={createPageUrl("CrmLeads")} className="text-xs text-[#2dd4a8] hover:underline flex items-center gap-1">
              הכל <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {leads.slice(0, 5).map(lead => (
              <Link key={lead.id} to={createPageUrl(`LeadCard?id=${lead.id}`)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#142e38]/70 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#2dd4a8]/10 flex items-center justify-center text-[10px] font-bold text-[#2dd4a8]">
                  {lead.full_name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{lead.full_name}</p>
                  <p className="text-[10px] text-gray-500">{lead.source || '—'} • {lead.city || '—'}</p>
                </div>
              </Link>
            ))}
            {leads.length === 0 && <p className="text-sm text-gray-500 text-center py-6">אין לידים</p>}
          </div>
        </motion.div>

        {/* Open Tasks */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="gesi-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">משימות פתוחות</h3>
            <Link to={createPageUrl("CrmTasks")} className="text-xs text-[#2dd4a8] hover:underline flex items-center gap-1">
              הכל <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-xl">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-400' : task.priority === 'high' ? 'bg-orange-400' : 'bg-gray-500'}`} />
                <p className="text-sm text-white truncate flex-1">{task.title}</p>
                {task.due_date && <span className="text-[10px] text-gray-500">{new Date(task.due_date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })}</span>}
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-gray-500 text-center py-6">אין משימות פתוחות</p>}
          </div>
        </motion.div>

        {/* Active Projects */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="gesi-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">פרויקטים פעילים</h3>
            <Link to={createPageUrl("CrmProjects")} className="text-xs text-[#2dd4a8] hover:underline flex items-center gap-1">
              הכל <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {projects.filter(p => p.status === 'active').slice(0, 5).map(p => (
              <Link key={p.id} to={createPageUrl(`ProjectCard?id=${p.id}`)}
                className="block p-2 rounded-xl hover:bg-[#142e38]/70 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-white truncate flex-1">{p.title}</p>
                  <span className="text-[10px] text-[#2dd4a8] font-medium ml-2">{p.kwp} kWp</span>
                </div>
                <div className="h-1.5 bg-[#142e38] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#2dd4a8] to-[#1fa882] rounded-full"
                    style={{ width: `${Math.min(100, ((p.current_step_index || 0) / 9) * 100)}%` }} />
                </div>
              </Link>
            ))}
            {activeProjects === 0 && <p className="text-sm text-gray-500 text-center py-6">אין פרויקטים פעילים</p>}
          </div>
        </motion.div>
      </div>

      {/* Quick Navigation */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">ניווט מהיר</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { label: "לידים", page: "CrmLeads", icon: Target },
            { label: "אנשי קשר", page: "CrmContacts", icon: Users },
            { label: "פרויקטים", page: "CrmProjects", icon: ClipboardList },
            { label: "מסמכים", page: "CrmDocuments", icon: DollarSign },
            { label: "עובדים", page: "CrmEmployees", icon: UserCheck },
            { label: "ספקים", page: "CrmSuppliers", icon: Truck },
            { label: "מחסן", page: "CrmInventory", icon: Warehouse },
            { label: "הוצאות", page: "CrmExpenses", icon: Receipt },
          ].map(item => (
            <Link key={item.page} to={createPageUrl(item.page)}
              className="gesi-card p-3 flex flex-col items-center gap-2 hover:border-[#2dd4a8]/30 hover:bg-[#142e38]/30 transition-all text-center">
              <item.icon className="w-5 h-5 text-[#2dd4a8]" />
              <span className="text-xs text-gray-300">{item.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}