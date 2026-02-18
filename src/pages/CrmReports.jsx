import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "../components/crm/KpiCard";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Target, Zap, Clock, TrendingUp, BarChart3, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
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

  const isLoading = l1 || l2 || l3;

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
        <KpiCard title="פרויקטים פעילים" value={activeProjects} icon={Clock} delay={0.1} />
        <KpiCard title="סה״כ לידים" value={leads.length} icon={Target} delay={0.15} />
      </div>

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
    </div>
  );
}