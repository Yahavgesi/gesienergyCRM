import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  TrendingUp, TrendingDown, Target, Users, DollarSign, Zap,
  AlertTriangle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight,
  BarChart3, Calendar, Download, Filter, ChevronDown, Medal,
  Flame, Activity, RefreshCcw, Phone, XCircle
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#2dd4a8", "#60a5fa", "#a78bfa", "#fbbf24", "#fb923c", "#f472b6", "#34d399", "#22d3ee"];

const STAGE_LABELS = {
  new_lead: "ליד חדש", initial_contact: "יצירת קשר", site_survey: "סיור באתר",
  quote_sent: "הצעת מחיר", negotiation: "משא ומתן", closing: "סגירה",
  won: "נסגר", lost: "אבוד",
};

const SOURCE_LABELS = {
  website: "אתר", referral: "הפניה", facebook: "פייסבוק", google: "גוגל",
  phone: "טלפון", whatsapp: "WhatsApp", tiktok: "TikTok", instagram: "אינסטגרם",
  yad2: "יד2", portal: "פורטל", other: "אחר",
};

const tooltipStyle = {
  background: '#0f2229', border: '1px solid rgba(45,212,168,0.2)',
  borderRadius: 10, color: '#fff', fontSize: 11
};

function KpiCard({ title, value, sub, trend, icon: Icon, color = "#2dd4a8", delay = 0 }) {
  const isPositive = trend > 0;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f2229 0%, #142e38 100%)', border: '1px solid rgba(45,212,168,0.1)' }}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
        style={{ background: color, transform: 'translate(35%, -35%)' }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${isPositive ? 'text-[#2dd4a8] bg-[#2dd4a8]/10' : 'text-red-400 bg-red-400/10'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{title}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-1">{sub}</p>}
    </motion.div>
  );
}

function SectionHeader({ icon: Icon, title, sub, color = "#2dd4a8" }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

function Card({ children, className = "", delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: 'linear-gradient(135deg, #0f2229 0%, #142e38 100%)', border: '1px solid rgba(45,212,168,0.1)' }}>
      {children}
    </motion.div>
  );
}

export default function CrmPerformanceAnalytics() {
  const [period, setPeriod] = useState("3m"); // 1m, 3m, 6m, 12m, all

  const { data: leads = [], isLoading: l1 } = useQuery({ queryKey: ['leads-analytics'], queryFn: () => base44.entities.Lead.list('-created_date', 500) });
  const { data: projects = [], isLoading: l2 } = useQuery({ queryKey: ['projects-analytics'], queryFn: () => base44.entities.Project.list('-created_date', 200) });
  const { data: payments = [], isLoading: l3 } = useQuery({ queryKey: ['payments-analytics'], queryFn: () => base44.entities.Payment.list('-created_date', 500) });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses-analytics'], queryFn: () => base44.entities.Expense.list('-date', 500) });

  const isLoading = l1 || l2 || l3;

  // Period filter
  const periodDays = { "1m": 30, "3m": 90, "6m": 180, "12m": 365, "all": 99999 };
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (periodDays[period] || 90));
    return d.toISOString().slice(0, 10);
  }, [period]);

  const filteredLeads = useMemo(() => leads.filter(l => !l.created_date || l.created_date.slice(0, 10) >= cutoff), [leads, cutoff]);
  const filteredProjects = useMemo(() => projects.filter(p => !p.created_date || p.created_date.slice(0, 10) >= cutoff), [projects, cutoff]);
  const filteredPayments = useMemo(() => payments.filter(p => p.status === 'completed' && (!p.created_date || p.created_date.slice(0, 10) >= cutoff)), [payments, cutoff]);
  const filteredExpenses = useMemo(() => expenses.filter(e => !e.date || e.date >= cutoff), [expenses, cutoff]);

  // --- Computed Metrics ---
  const totalRevenue = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpensesAmt = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const grossProfit = totalRevenue - totalExpensesAmt;
  const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;
  const totalKwp = filteredProjects.reduce((s, p) => s + (p.kwp || 0), 0);
  const wonLeads = filteredLeads.filter(l => l.sales_stage === 'won' || l.status === 'converted').length;
  const lostLeads = filteredLeads.filter(l => l.sales_stage === 'lost').length;
  const conversionRate = filteredLeads.length > 0 ? ((wonLeads / filteredLeads.length) * 100).toFixed(1) : 0;
  const avgProjectValue = filteredProjects.filter(p => p.total_price > 0).length > 0
    ? filteredProjects.filter(p => p.total_price > 0).reduce((s, p) => s + (p.total_price || 0), 0) / filteredProjects.filter(p => p.total_price > 0).length
    : 0;

  // --- Monthly trend (12 months) ---
  const monthCount = period === "1m" ? 4 : period === "3m" ? 3 : period === "6m" ? 6 : 12;
  const monthlyTrend = useMemo(() => Array.from({ length: monthCount }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (monthCount - 1 - i));
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('he-IL', { month: 'short', year: monthCount > 6 ? '2-digit' : undefined });
    const revenue = payments.filter(p => p.status === 'completed' && p.created_date?.startsWith(key)).reduce((s, p) => s + (p.amount || 0), 0);
    const expAmt = expenses.filter(e => e.date?.startsWith(key)).reduce((s, e) => s + (e.amount || 0), 0);
    return {
      month: label, key,
      הכנסות: Math.round(revenue / 1000),
      הוצאות: Math.round(expAmt / 1000),
      רווח: Math.round((revenue - expAmt) / 1000),
      לידים: leads.filter(l => l.created_date?.startsWith(key)).length,
      פרויקטים: projects.filter(p => p.created_date?.startsWith(key)).length,
    };
  }), [payments, expenses, leads, projects, monthCount]);

  // --- Lead Sources ---
  const sourceDist = useMemo(() => {
    const agg = filteredLeads.reduce((acc, l) => { acc[l.source || 'other'] = (acc[l.source || 'other'] || 0) + 1; return acc; }, {});
    return Object.entries(agg).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({
      name: SOURCE_LABELS[k] || k, value: v, fill: COLORS[i % COLORS.length], key: k,
    }));
  }, [filteredLeads]);

  // --- Lead stages funnel ---
  const stageFunnel = useMemo(() => {
    const order = ['new_lead', 'initial_contact', 'site_survey', 'quote_sent', 'negotiation', 'closing', 'won'];
    return order.map((s, i) => ({
      stage: STAGE_LABELS[s] || s,
      count: filteredLeads.filter(l => l.sales_stage === s).length,
      fill: COLORS[i % COLORS.length],
    })).filter(s => s.count > 0);
  }, [filteredLeads]);

  // --- Agent performance ---
  const agentStats = useMemo(() => {
    const agg = {};
    filteredLeads.forEach(l => {
      const a = l.assigned_agent || 'לא מוקצה';
      if (!agg[a]) agg[a] = { agent: a, leads: 0, won: 0, lost: 0, revenue: 0 };
      agg[a].leads++;
      if (l.sales_stage === 'won' || l.status === 'converted') agg[a].won++;
      if (l.sales_stage === 'lost') agg[a].lost++;
    });
    filteredProjects.forEach(p => {
      const a = p.assigned_agent || 'לא מוקצה';
      if (!agg[a]) agg[a] = { agent: a, leads: 0, won: 0, lost: 0, revenue: 0 };
      agg[a].revenue += (p.total_price || 0);
    });
    return Object.values(agg).sort((a, b) => b.revenue - a.revenue).map((a, i) => ({
      ...a,
      rank: i + 1,
      convRate: a.leads > 0 ? ((a.won / a.leads) * 100).toFixed(0) : 0,
    }));
  }, [filteredLeads, filteredProjects]);

  // --- Overdue follow-ups ---
  const today = new Date().toISOString().slice(0, 10);
  const overdueLeads = leads.filter(l =>
    l.next_follow_up && l.next_follow_up < today &&
    !['won', 'lost', 'converted'].includes(l.sales_stage) &&
    !['converted', 'unqualified'].includes(l.status)
  ).slice(0, 10);

  // --- Stale leads (no update > 14 days) ---
  const staleDate = new Date(); staleDate.setDate(staleDate.getDate() - 14);
  const staleLeads = leads.filter(l =>
    !['won', 'lost', 'converted'].includes(l.sales_stage) &&
    l.updated_date && new Date(l.updated_date) < staleDate
  ).slice(0, 10);

  // --- Projects at risk (no update > 7 days in active status) ---
  const riskDate = new Date(); riskDate.setDate(riskDate.getDate() - 7);
  const atRiskProjects = projects.filter(p =>
    p.status === 'active' && p.updated_date && new Date(p.updated_date) < riskDate
  ).slice(0, 8);

  // --- Project type distribution ---
  const projectTypes = useMemo(() => {
    const TYPE_LABELS = {
      residential: "ביתי", commercial: "מסחרי",
      commercial_storage: "מסחרי+אגירה", residential_storage: "ביתי+אגירה", storage_only: "אגירה"
    };
    const agg = filteredProjects.reduce((acc, p) => { acc[p.type || 'other'] = (acc[p.type || 'other'] || 0) + 1; return acc; }, {});
    return Object.entries(agg).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({
      name: TYPE_LABELS[k] || k, value: v, fill: COLORS[i % COLORS.length]
    }));
  }, [filteredProjects]);

  // --- Excel export ---
  const exportCSV = () => {
    const rows = [
      ['חודש', 'הכנסות (₪)', 'הוצאות (₪)', 'רווח (₪)', 'לידים', 'פרויקטים'],
      ...monthlyTrend.map(m => [m.month, m.הכנסות * 1000, m.הוצאות * 1000, m.רווח * 1000, m.לידים, m.פרויקטים])
    ];
    const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ביצועים_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" dir="rtl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-[#142e38] animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6" dir="rtl">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#2dd4a8]" /> ניתוח ביצועים
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">תמונת מצב מלאה של העסק</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 bg-[#142e38] border-[rgba(45,212,168,0.15)] text-white text-sm">
              <Calendar className="w-3.5 h-3.5 ml-2 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#142e38] border-[rgba(45,212,168,0.15)]">
              <SelectItem value="1m" className="text-gray-300 text-xs">חודש אחרון</SelectItem>
              <SelectItem value="3m" className="text-gray-300 text-xs">3 חודשים</SelectItem>
              <SelectItem value="6m" className="text-gray-300 text-xs">6 חודשים</SelectItem>
              <SelectItem value="12m" className="text-gray-300 text-xs">12 חודשים</SelectItem>
              <SelectItem value="all" className="text-gray-300 text-xs">הכל</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportCSV} variant="outline" className="border-[rgba(45,212,168,0.2)] text-[#2dd4a8] hover:bg-[#2dd4a8]/10 text-xs gap-2">
            <Download className="w-3.5 h-3.5" /> ייצוא CSV
          </Button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="הכנסות בתקופה" value={`₪${(totalRevenue/1000).toFixed(0)}K`} icon={DollarSign} color="#2dd4a8" delay={0} />
        <KpiCard title="רווח גולמי" value={`₪${(grossProfit/1000).toFixed(0)}K`}
          sub={`מרווח ${profitMargin}%`} icon={TrendingUp} color={grossProfit >= 0 ? "#34d399" : "#ef4444"} delay={0.05} />
        <KpiCard title="לידים בתקופה" value={filteredLeads.length}
          sub={`${wonLeads} נסגרו • ${lostLeads} אבדו`} icon={Target} color="#60a5fa" delay={0.1} />
        <KpiCard title="המרה" value={`${conversionRate}%`}
          sub={`${filteredProjects.length} פרויקטים`} icon={Activity} color="#a78bfa" delay={0.15} />
        <KpiCard title="סה״כ kWp" value={totalKwp.toFixed(1)}
          sub={`${filteredProjects.filter(p=>p.status==='active').length} פרויקטים פעילים`} icon={Zap} color="#fbbf24" delay={0.2} />
        <KpiCard title="ממוצע שווי פרויקט" value={avgProjectValue > 0 ? `₪${Math.round(avgProjectValue/1000)}K` : '—'}
          icon={BarChart3} color="#fb923c" delay={0.25} />
        <KpiCard title="הוצאות" value={`₪${(totalExpensesAmt/1000).toFixed(0)}K`}
          icon={ArrowDownRight} color="#f472b6" delay={0.3} />
        <KpiCard title="לידים מתעכבים" value={overdueLeads.length + staleLeads.length}
          sub="דורשים טיפול" icon={AlertTriangle} color={overdueLeads.length + staleLeads.length > 0 ? "#ef4444" : "#2dd4a8"} delay={0.35} />
      </div>

      {/* Trend Chart */}
      <Card delay={0.4}>
        <SectionHeader icon={TrendingUp} title="מגמת הכנסות, הוצאות ורווח" sub="נתונים ב-₪ אלפים" />
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                {[["g1","#2dd4a8"],["g2","#ef4444"],["g3","#60a5fa"]].map(([id, c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₪${(v*1000).toLocaleString()}`, '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="הכנסות" stroke="#2dd4a8" fill="url(#g1)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="הוצאות" stroke="#ef4444" fill="url(#g2)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="רווח" stroke="#60a5fa" fill="url(#g3)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Lead Activity & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={0.45}>
          <SectionHeader icon={Target} title="לידים לפי חודש" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="לידים" fill="#2dd4a8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="פרויקטים" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card delay={0.5}>
          <SectionHeader icon={Activity} title="פאנל מכירה" sub="לידים לפי שלב" />
          {stageFunnel.length > 0 ? (
            <div className="space-y-2.5">
              {stageFunnel.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-28 flex-shrink-0 text-right">{s.stage}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden bg-[#0a1a1f]">
                    <div className="h-full rounded-full flex items-center justify-end px-2 text-[10px] text-white font-bold"
                      style={{
                        width: `${Math.max(8, (s.count / (stageFunnel[0]?.count || 1)) * 100)}%`,
                        background: s.fill
                      }}>
                      {s.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-600 text-sm text-center py-8">אין נתונים</p>}
        </Card>
      </div>

      {/* Sources & Project Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={0.55}>
          <SectionHeader icon={Target} title="מקורות לידים" color="#60a5fa" />
          <div className="flex items-start gap-4">
            <div className="h-44 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceDist} dataKey="value" cx="50%" cy="50%" innerRadius="45%" outerRadius="75%" paddingAngle={3}>
                    {sourceDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} לידים`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 flex-1 pt-2">
              {sourceDist.slice(0, 7).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.fill }} />
                    <span className="text-gray-400 truncate max-w-[80px]">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-semibold">{s.value}</span>
                    <span className="text-gray-600">({filteredLeads.length > 0 ? ((s.value/filteredLeads.length)*100).toFixed(0) : 0}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card delay={0.6}>
          <SectionHeader icon={Zap} title="סוגי פרויקטים" color="#fbbf24" />
          <div className="flex items-start gap-4">
            <div className="h-44 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={projectTypes} dataKey="value" cx="50%" cy="50%" innerRadius="45%" outerRadius="75%" paddingAngle={3}>
                    {projectTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} פרויקטים`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 flex-1 pt-2">
              {projectTypes.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: t.fill }} />
                    <span className="text-gray-400 truncate max-w-[90px]">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-semibold">{t.value}</span>
                    <span className="text-gray-600">({filteredProjects.length > 0 ? ((t.value/filteredProjects.length)*100).toFixed(0) : 0}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Agent Leaderboard */}
      {agentStats.length > 0 && (
        <Card delay={0.65}>
          <SectionHeader icon={Medal} title="ביצועי סוכנים" sub="מדורגים לפי הכנסות" color="#fbbf24" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(45,212,168,0.08)]">
                  {['#', 'סוכן', 'לידים', 'נסגרו', 'אבדו', 'המרה %', 'הכנסות'].map(h => (
                    <th key={h} className="text-right text-xs font-semibold text-gray-500 py-2 px-3 first:pl-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agentStats.map(a => (
                  <tr key={a.agent} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 text-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto
                        ${a.rank === 1 ? 'bg-yellow-400/20 text-yellow-400' : a.rank === 2 ? 'bg-gray-400/20 text-gray-400' : a.rank === 3 ? 'bg-orange-400/20 text-orange-400' : 'bg-[#142e38] text-gray-500'}`}>
                        {a.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-white max-w-[140px] truncate">{a.agent}</td>
                    <td className="py-3 px-3 text-gray-400">{a.leads}</td>
                    <td className="py-3 px-3 text-[#2dd4a8] font-semibold">{a.won}</td>
                    <td className="py-3 px-3 text-red-400">{a.lost}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#0a1a1f] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#2dd4a8]" style={{ width: `${Math.min(100, a.convRate)}%` }} />
                        </div>
                        <span className="text-white text-xs font-semibold w-8 flex-shrink-0">{a.convRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-bold">₪{(a.revenue/1000).toFixed(0)}K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Overdue Follow-ups */}
        <Card delay={0.7}>
          <SectionHeader icon={Clock} title="מעקב שעבר מועד" sub={`${overdueLeads.length} לידים`} color="#ef4444" />
          {overdueLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-600">
              <CheckCircle2 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">הכל מעודכן ✓</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueLeads.map(l => (
                <Link key={l.id} to={createPageUrl(`LeadCard?id=${l.id}`)}
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                  <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-bold text-red-400 flex-shrink-0">
                    {l.full_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate group-hover:text-[#2dd4a8]">{l.full_name}</p>
                    <p className="text-[10px] text-red-400">{l.next_follow_up ? new Date(l.next_follow_up).toLocaleDateString('he-IL') : ''}</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#2dd4a8] flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Stale Leads */}
        <Card delay={0.75}>
          <SectionHeader icon={RefreshCcw} title="לידים ללא עדכון +14 יום" sub={`${staleLeads.length} לידים`} color="#f472b6" />
          {staleLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-600">
              <CheckCircle2 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">כל הלידים מעודכנים ✓</p>
            </div>
          ) : (
            <div className="space-y-2">
              {staleLeads.map(l => {
                const daysSince = Math.floor((new Date() - new Date(l.updated_date)) / 86400000);
                return (
                  <Link key={l.id} to={createPageUrl(`LeadCard?id=${l.id}`)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="w-7 h-7 rounded-full bg-pink-500/10 flex items-center justify-center text-xs font-bold text-pink-400 flex-shrink-0">
                      {l.full_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate group-hover:text-[#2dd4a8]">{l.full_name}</p>
                      <p className="text-[10px] text-gray-500">{l.city || '—'} • {STAGE_LABELS[l.sales_stage] || l.sales_stage}</p>
                    </div>
                    <span className="text-[10px] text-pink-400 flex-shrink-0">{daysSince}d</span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Projects at risk */}
        <Card delay={0.8}>
          <SectionHeader icon={AlertTriangle} title="פרויקטים ללא עדכון +7 ימים" sub={`${atRiskProjects.length} פרויקטים`} color="#fb923c" />
          {atRiskProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-600">
              <CheckCircle2 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">כל הפרויקטים פעילים ✓</p>
            </div>
          ) : (
            <div className="space-y-2">
              {atRiskProjects.map(p => {
                const daysSince = Math.floor((new Date() - new Date(p.updated_date)) / 86400000);
                return (
                  <Link key={p.id} to={createPageUrl(`ProjectCard?id=${p.id}`)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">
                      {p.title?.[0] || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate group-hover:text-[#2dd4a8]">{p.title}</p>
                      <p className="text-[10px] text-gray-500">{p.current_step || '—'}</p>
                    </div>
                    <span className="text-[10px] text-orange-400 flex-shrink-0">{daysSince}d</span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}