import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "../components/crm/KpiCard";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Target, Kanban, Users, Zap, DollarSign, ClipboardList, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const STAGE_COLORS = {
  new_lead: "#94a3b8",
  contacted: "#60a5fa",
  qualified: "#a78bfa",
  proposal: "#fbbf24",
  negotiation: "#fb923c",
  signed: "#2dd4a8",
  deposit_paid: "#34d399",
  handover_ops: "#22d3ee",
};

const STAGE_LABELS = {
  new_lead: "ליד חדש",
  contacted: "יצרנו קשר",
  qualified: "מוסמך",
  proposal: "הצעת מחיר",
  negotiation: "משא ומתן",
  signed: "חתום",
  deposit_paid: "מקדמה שולמה",
  handover_ops: "מועבר לתפעול",
};

export default function CrmDashboard() {
  const { data: leads, isLoading: l1 } = useQuery({
    queryKey: ['crm-leads'], queryFn: () => base44.entities.Lead.list('-created_date', 100), initialData: []
  });
  const { data: deals, isLoading: l2 } = useQuery({
    queryKey: ['crm-deals'], queryFn: () => base44.entities.Deal.list('-created_date', 100), initialData: []
  });
  const { data: projects, isLoading: l3 } = useQuery({
    queryKey: ['crm-projects'], queryFn: () => base44.entities.Project.list('-created_date', 50), initialData: []
  });
  const { data: payments, isLoading: l4 } = useQuery({
    queryKey: ['crm-payments'], queryFn: () => base44.entities.Payment.filter({ status: 'completed' }, '-created_date', 100), initialData: []
  });

  const isLoading = l1 || l2 || l3 || l4;

  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalKwp = deals.reduce((s, d) => s + (d.kwp || 0), 0);
  const avgDealValue = deals.length > 0 ? (deals.reduce((s, d) => s + (d.revenue || 0), 0) / deals.length) : 0;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const conversionRate = leads.length > 0 ? ((deals.length / leads.length) * 100).toFixed(1) : 0;

  // Pipeline distribution for pie chart
  const stageDistribution = Object.entries(
    deals.reduce((acc, d) => { acc[d.stage] = (acc[d.stage] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ 
    name: STAGE_LABELS[name] || name, 
    value, 
    fill: STAGE_COLORS[name] || "#64748b",
    percentage: ((value / deals.length) * 100).toFixed(0)
  }));

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-white">דשבורד</h1>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard title="לידים" value={leads.length} icon={Target} delay={0} />
        <KpiCard title="עסקאות" value={deals.length} icon={Kanban} delay={0.05} />
        <KpiCard title="פרויקטים פעילים" value={activeProjects} icon={ClipboardList} delay={0.1} />
        <KpiCard title="שיעור המרה" value={`${conversionRate}%`} icon={TrendingUp} delay={0.15} />
        <KpiCard title="סה״כ kWp" value={totalKwp.toFixed(1)} icon={Zap} delay={0.2} />
        <KpiCard title="הכנסות" value={`₪${totalRevenue.toLocaleString()}`} icon={DollarSign} delay={0.25} />
        <KpiCard title="ממוצע עסקה" value={`₪${avgDealValue.toLocaleString('he-IL', {maximumFractionDigits: 0})}`} icon={DollarSign} delay={0.3} />
        <KpiCard title="הושלמו" value={completedProjects} icon={CheckCircle2} delay={0.35} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="gesi-card p-4 lg:p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">פילוח עסקאות לפי שלב</h3>
          {stageDistribution.length > 0 ? (
            <div className="space-y-3">
              <div className="h-48 lg:h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={stageDistribution} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="55%" 
                      outerRadius="85%" 
                      paddingAngle={2}
                      label={({ percentage }) => `${percentage}%`}
                      labelLine={false}
                    >
                      {stageDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="rgba(10,26,31,0.8)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(15,34,41,0.95)', 
                        border: '1px solid rgba(45,212,168,0.2)', 
                        borderRadius: 10, 
                        color: '#fff', 
                        fontSize: 11,
                        padding: '8px 12px'
                      }} 
                      formatter={(value) => [`${value} עסקאות`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {stageDistribution.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: entry.fill }} />
                    <span className="text-gray-400 truncate">{entry.name}</span>
                    <span className="text-white font-semibold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">אין עסקאות עדיין</p>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="gesi-card p-4 lg:p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">לידים אחרונים</h3>
          <div className="space-y-2">
            {leads.slice(0, 5).map((lead, i) => (
              <Link 
                key={lead.id} 
                to={createPageUrl(`LeadCard/${lead.id}`)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#142e38]/70 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#2dd4a8]/10 flex items-center justify-center text-[10px] font-bold text-[#2dd4a8]">
                  {lead.full_name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{lead.full_name}</p>
                  <p className="text-[10px] text-gray-500">{lead.source || 'לא ידוע'} • {lead.city || '—'}</p>
                </div>
                <span className="text-[10px] text-gray-600 hidden sm:block">{new Date(lead.created_date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })}</span>
              </Link>
            ))}
            {leads.length === 0 && <p className="text-sm text-gray-500 text-center py-8">אין לידים עדיין</p>}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "לידים", page: "CrmLeads", icon: Target },
          { label: "אנשי קשר", page: "CrmContacts", icon: Users },
          { label: "פרויקטים", page: "CrmProjects", icon: ClipboardList },
          { label: "מסמכים", page: "CrmDocuments", icon: DollarSign },
        ].map(item => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className="gesi-card p-3 lg:p-4 flex items-center gap-3 hover:border-[#2dd4a8]/30 hover:bg-[#142e38]/30 transition-all"
          >
            <item.icon className="w-5 h-5 text-[#2dd4a8]" />
            <span className="text-sm text-gray-300">{item.label}</span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}