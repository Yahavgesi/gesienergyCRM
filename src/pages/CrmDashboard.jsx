import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  Target, Users, Zap, DollarSign, ClipboardList,
  TrendingUp, CheckCircle2, AlertTriangle, ArrowUpRight,
  Clock, Warehouse, Receipt, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

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

const tooltipStyle = {
  background: '#0f2229', border: '1px solid rgba(45,212,168,0.2)',
  borderRadius: 10, color: '#fff', fontSize: 11
};

function StatCard({ title, value, sub, icon: Icon, color = "#2dd4a8", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f2229 0%, #142e38 100%)', border: '1px solid rgba(45,212,168,0.1)' }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5"
        style={{ background: color, transform: 'translate(30%, -30%)' }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-white leading-none">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

export default function CrmDashboard() {
  const { data: leads = [], isLoading: l1 } = useQuery({ queryKey: ['crm-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 200) });
  const { data: deals = [], isLoading: l2 } = useQuery({ queryKey: ['crm-deals'], queryFn: () => base44.entities.Deal.list('-created_date', 200) });
  const { data: projects = [], isLoading: l3 } = useQuery({ queryKey: ['crm-projects'], queryFn: () => base44.entities.Project.list('-created_date', 100) });
  const { data: payments = [] } = useQuery({ queryKey: ['crm-payments'], queryFn: () => base44.entities.Payment.filter({ status: 'completed' }, '-created_date', 200) });
  const { data: tasks = [] } = useQuery({ queryKey: ['crm-tasks-open'], queryFn: () => base44.entities.Task.filter({ status: 'todo' }, '-created_date', 20) });
  const { data: inventory = [] } = useQuery({ queryKey: ['crm-inventory'], queryFn: () => base44.entities.Inventory.list() });
  const { data: expenses = [] } = useQuery({ queryKey: ['dash-expenses'], queryFn: () => base44.entities.Expense.list('-date', 200) });

  const isLoading = l1 || l2 || l3;

  // Computed metrics
  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalKwp = projects.reduce((s, p) => s + (p.kwp || 0), 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const conversionRate = leads.length > 0
    ? ((deals.filter(d => ['signed', 'deposit_paid', 'handover_ops'].includes(d.stage)).length / leads.length) * 100).toFixed(1)
    : 0;
  const lowStockItems = inventory.filter(i => (i.quantity || 0) <= (i.min_quantity || 0));
  const thisMonthExpenses = expenses
    .filter(e => e.date?.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, e) => s + (e.amount || 0), 0);
  const avgProjectValue = projects.filter(p => p.total_price > 0).length > 0
    ? projects.filter(p => p.total_price > 0).reduce((s, p) => s + (p.total_price || 0), 0) / projects.filter(p => p.total_price > 0).length
    : 0;

  // Pipeline breakdown
  const stageDistribution = Object.entries(
    deals.reduce((acc, d) => { acc[d.stage] = (acc[d.stage] || 0) + 1; return acc; }, {})
  ).map(([stageKey, value]) => ({
    stageKey, name: STAGE_LABELS[stageKey] || stageKey,
    value, fill: STAGE_COLORS[stageKey] || "#64748b",
  })).sort((a, b) => b.value - a.value);

  // Monthly chart (6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('he-IL', { month: 'short' });
    return {
      month: label,
      לידים: leads.filter(l => l.created_date?.startsWith(key)).length,
      הכנסות: Math.round(payments.filter(p => p.created_date?.startsWith(key)).reduce((s, p) => s + (p.amount || 0), 0) / 1000),
    };
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" dir="rtl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-[#142e38] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">דשבורד</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {lowStockItems.length > 0 && (
          <Link to={createPageUrl("CrmInventory")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors">
            <AlertTriangle className="w-4 h-4" />
            {lowStockItems.length} פריטים במלאי נמוך
          </Link>
        )}
      </div>

      {/* Primary KPIs - 4 col */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="לידים פתוחים" value={leads.filter(l => !['converted','lost'].includes(l.status)).length}
          sub={`${leads.length} סה״כ`} icon={Target} color="#2dd4a8" delay={0} />
        <StatCard title="עסקאות בפיפליין" value={deals.length}
          sub={`המרה ${conversionRate}%`} icon={Activity} color="#60a5fa" delay={0.05} />
        <StatCard title="הכנסות" value={`₪${(totalRevenue / 1000).toFixed(0)}K`}
          sub={`₪${thisMonthExpenses.toLocaleString()} הוצאות החודש`} icon={DollarSign} color="#34d399" delay={0.1} />
        <StatCard title="סה״כ kWp" value={totalKwp.toFixed(1)}
          sub={`${completedProjects} פרויקטים הושלמו`} icon={Zap} color="#fbbf24" delay={0.15} />
      </div>

      {/* Secondary KPIs - 4 col */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="פרויקטים פעילים" value={activeProjects}
          sub={`${projects.length} סה״כ`} icon={ClipboardList} color="#a78bfa" delay={0.2} />
        <StatCard title="ממוצע שווי פרויקט" value={avgProjectValue > 0 ? `₪${Math.round(avgProjectValue / 1000)}K` : '—'}
          icon={TrendingUp} color="#fb923c" delay={0.25} />
        <StatCard title="משימות פתוחות" value={tasks.length}
          icon={Clock} color="#f472b6" delay={0.3} />
        <StatCard title="מלאי נמוך" value={lowStockItems.length}
          sub={`${inventory.length} פריטים סה״כ`} icon={Warehouse} color={lowStockItems.length > 0 ? "#ef4444" : "#2dd4a8"} delay={0.35} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Trend Chart - 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #0f2229 0%, #142e38 100%)', border: '1px solid rgba(45,212,168,0.1)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">לידים והכנסות — 6 חודשים</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2dd4a8] inline-block" />לידים</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />הכנסות (K₪)</span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4a8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2dd4a8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="לידים" stroke="#2dd4a8" fill="url(#g1)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="הכנסות" stroke="#60a5fa" fill="url(#g2)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pipeline Pie - 1 col */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #0f2229 0%, #142e38 100%)', border: '1px solid rgba(45,212,168,0.1)' }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">פיפליין עסקאות</h3>
          {stageDistribution.length > 0 ? (
            <>
              <div className="h-36 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stageDistribution} dataKey="value" cx="50%" cy="50%"
                      innerRadius="52%" outerRadius="80%" paddingAngle={3} startAngle={90} endAngle={-270}>
                      {stageDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} עסקאות`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {stageDistribution.slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.fill }} />
                      <span className="text-gray-400 truncate max-w-[110px]">{entry.name}</span>
                    </div>
                    <span className="text-white font-semibold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-600">
              <Activity className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">אין עסקאות</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Leads */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #0f2229 0%, #142e38 100%)', border: '1px solid rgba(45,212,168,0.1)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">לידים אחרונים</h3>
            <Link to={createPageUrl("CrmLeads")} className="text-xs text-[#2dd4a8] hover:underline flex items-center gap-1">
              הכל <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {leads.slice(0, 6).map(lead => (
              <Link key={lead.id} to={createPageUrl(`LeadCard?id=${lead.id}`)}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-[#2dd4a8]/10 flex items-center justify-center text-xs font-bold text-[#2dd4a8] flex-shrink-0">
                  {lead.full_name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate group-hover:text-[#2dd4a8] transition-colors">{lead.full_name}</p>
                  <p className="text-[10px] text-gray-500">{lead.city || '—'} • {lead.source || '—'}</p>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: STAGE_COLORS[lead.sales_stage] || '#64748b' }} />
              </Link>
            ))}
            {leads.length === 0 && <p className="text-sm text-gray-600 text-center py-6">אין לידים</p>}
          </div>
        </motion.div>

        {/* Active Projects */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #0f2229 0%, #142e38 100%)', border: '1px solid rgba(45,212,168,0.1)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">פרויקטים פעילים</h3>
            <Link to={createPageUrl("CrmProjects")} className="text-xs text-[#2dd4a8] hover:underline flex items-center gap-1">
              הכל <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {projects.filter(p => p.status === 'active').slice(0, 5).map(p => (
              <Link key={p.id} to={createPageUrl(`ProjectCard?id=${p.id}`)}
                className="block px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm text-white truncate flex-1 group-hover:text-[#2dd4a8] transition-colors">{p.title}</p>
                  <span className="text-xs text-[#2dd4a8] font-semibold ml-2 flex-shrink-0">{p.kwp} kWp</span>
                </div>
                <div className="relative h-1.5 bg-[#0a1a1f] rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 right-0 rounded-full"
                    style={{
                      background: 'linear-gradient(to left, #2dd4a8, #1fa882)',
                      width: `${Math.min(100, ((p.current_step_index || 0) / 9) * 100)}%`
                    }} />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{p.current_step || 'טרם החל'}</p>
              </Link>
            ))}
            {activeProjects === 0 && <p className="text-sm text-gray-600 text-center py-6">אין פרויקטים פעילים</p>}
          </div>
        </motion.div>

        {/* Tasks & Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #0f2229 0%, #142e38 100%)', border: '1px solid rgba(45,212,168,0.1)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">משימות פתוחות</h3>
            <Link to={createPageUrl("CrmTasks")} className="text-xs text-[#2dd4a8] hover:underline flex items-center gap-1">
              הכל <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {tasks.slice(0, 6).map(task => {
              const priorityColor = task.priority === 'urgent' ? '#ef4444' : task.priority === 'high' ? '#f97316' : '#64748b';
              return (
                <div key={task.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: priorityColor }} />
                  <p className="text-sm text-white truncate flex-1">{task.title}</p>
                  {task.due_date && (
                    <span className="text-[10px] text-gray-500 flex-shrink-0">
                      {new Date(task.due_date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-gray-600">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">אין משימות פתוחות</p>
              </div>
            )}
          </div>

          {/* Alerts */}
          {lowStockItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs font-semibold text-gray-400 mb-2">התראות</p>
              {lowStockItems.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center gap-2 py-1.5 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="text-gray-300 truncate">{item.name}</span>
                  <span className="text-red-400 flex-shrink-0">{item.quantity} יח'</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}