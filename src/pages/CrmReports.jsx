import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "../components/crm/KpiCard";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Target, Zap, Clock, TrendingUp, BarChart3, DollarSign, Users, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

export default function CrmReports() {
  const { data: deals, isLoading: l1 } = useQuery({
    queryKey: ['report-deals'], queryFn: () => base44.entities.Deal.list('-created_date', 500), initialData: []
  });
  const { data: leads, isLoading: l2 } = useQuery({
    queryKey: ['report-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 500), initialData: []
  });
  const { data: projects, isLoading: l3 } = useQuery({
    queryKey: ['report-projects'], queryFn: () => base44.entities.Project.list('-created_date', 200), initialData: []
  });
  const { data: payments, isLoading: l4 } = useQuery({
    queryKey: ['report-payments'], queryFn: () => base44.entities.Payment.list('-created_date', 500), initialData: []
  });
  const { data: expenses, isLoading: l5 } = useQuery({
    queryKey: ['report-expenses'], queryFn: () => base44.entities.Expense.list('-date', 500), initialData: []
  });

  const isLoading = l1 || l2 || l3 || l4 || l5;

  // Agent performance
  const agentDeals = deals.reduce((acc, d) => {
    const agent = d.assigned_agent || 'לא משויך';
    if (!acc[agent]) acc[agent] = { agent, deals: 0, kwp: 0, revenue: 0 };
    acc[agent].deals++;
    acc[agent].kwp += d.kwp || 0;
    acc[agent].revenue += d.revenue || 0;
    return acc;
  }, {});
  const agentData = Object.values(agentDeals).sort((a, b) => b.kwp - a.kwp).slice(0, 8);

  // Conversion rate
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;

  // Total kWp
  const totalKwp = deals.reduce((s, d) => s + (d.kwp || 0), 0);

  // Active projects
  const activeProjects = projects.filter(p => p.status === 'active').length;

  // Revenue
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const profit = totalRevenue - totalExpenses;

  // Monthly revenue last 6 months
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const key = d.toISOString().slice(0, 7);
    const rev = payments.filter(p => p.status === 'completed' && p.created_date?.startsWith(key)).reduce((s, p) => s + (p.amount || 0), 0);
    const exp = expenses.filter(e => e.date?.startsWith(key)).reduce((s, e) => s + (e.amount || 0), 0);
    return { month: key.slice(5), revenue: rev, expenses: exp };
  });

  const tooltipStyle = { background: '#142e38', border: '1px solid rgba(45,212,168,0.2)', borderRadius: 12, color: '#fff', fontSize: 12 };

  if (isLoading) {
    return <div className="p-6 space-y-4" dir="rtl">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-white">דוחות</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="שיעור המרה" value={`${conversionRate}%`} icon={TrendingUp} />
        <KpiCard title="סה״כ kWp" value={totalKwp.toFixed(1)} icon={Zap} delay={0.05} />
        <KpiCard title="הכנסות" value={`₪${totalRevenue.toLocaleString()}`} icon={DollarSign} delay={0.1} />
        <KpiCard title="רווח נקי" value={`₪${profit.toLocaleString()}`} icon={TrendingUp} delay={0.15} />
      </div>

      {/* Monthly Revenue vs Expenses */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="gesi-card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">הכנסות מול הוצאות - 6 חודשים אחרונים</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `₪${v.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#2dd4a8" name="הכנסות" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" fill="#f87171" name="הוצאות" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* kWp per agent */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="gesi-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">kWp לפי סוכן</h3>
          {agentData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentData} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis dataKey="agent" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="kwp" fill="#2dd4a8" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">אין נתונים</p>
          )}
        </motion.div>

        {/* Deal stages distribution */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="gesi-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">עסקאות לפי שלב</h3>
          {deals.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { stage: 'ליד חדש', count: deals.filter(d => d.stage === 'new_lead').length },
                  { stage: 'נוצר קשר', count: deals.filter(d => d.stage === 'contacted').length },
                  { stage: 'מתאים', count: deals.filter(d => d.stage === 'qualified').length },
                  { stage: 'הצעה', count: deals.filter(d => d.stage === 'proposal').length },
                  { stage: 'מו"מ', count: deals.filter(d => d.stage === 'negotiation').length },
                  { stage: 'נחתם', count: deals.filter(d => d.stage === 'signed').length },
                  { stage: 'מקדמה', count: deals.filter(d => d.stage === 'deposit_paid').length },
                  { stage: 'מסירה', count: deals.filter(d => d.stage === 'handover_ops').length },
                ]}>
                  <XAxis dataKey="stage" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#2dd4a8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">אין נתונים</p>
          )}
        </motion.div>
      </div>
      {/* Summary table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="gesi-card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">סיכום כספי</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "סה״כ הכנסות", value: `₪${totalRevenue.toLocaleString()}`, color: "text-[#2dd4a8]" },
            { label: "סה״כ הוצאות", value: `₪${totalExpenses.toLocaleString()}`, color: "text-red-400" },
            { label: "רווח גולמי", value: `₪${profit.toLocaleString()}`, color: profit >= 0 ? "text-[#2dd4a8]" : "text-red-400" },
            { label: "שיעור רווח", value: totalRevenue > 0 ? `${((profit / totalRevenue) * 100).toFixed(1)}%` : "—", color: "text-blue-400" },
          ].map(item => (
            <div key={item.label} className="bg-[#142e38]/50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}