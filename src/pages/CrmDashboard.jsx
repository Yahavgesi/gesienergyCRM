import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "../components/crm/KpiCard";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Target, Kanban, Users, Zap, DollarSign, ClipboardList } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const STAGE_COLORS = {
  new_lead: "#64748b",
  contacted: "#60a5fa",
  qualified: "#a78bfa",
  proposal: "#fbbf24",
  negotiation: "#f97316",
  signed: "#2dd4a8",
  deposit_paid: "#10b981",
  handover_ops: "#06b6d4",
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

  // Pipeline distribution for pie chart
  const stageDistribution = Object.entries(
    deals.reduce((acc, d) => { acc[d.stage] = (acc[d.stage] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value, fill: STAGE_COLORS[name] || "#64748b" }));

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="לידים" value={leads.length} icon={Target} delay={0} />
        <KpiCard title="עסקאות פעילות" value={deals.length} icon={Kanban} delay={0.05} />
        <KpiCard title="סה״כ kWp" value={totalKwp.toFixed(1)} icon={Zap} delay={0.1} />
        <KpiCard title="הכנסות" value={`₪${totalRevenue.toLocaleString()}`} icon={DollarSign} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="gesi-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">פילוח עסקאות לפי שלב</h3>
          {stageDistribution.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stageDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {stageDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#142e38', border: '1px solid rgba(45,212,168,0.2)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">אין עסקאות עדיין</p>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="gesi-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">פעילות אחרונה</h3>
          <div className="space-y-3">
            {leads.slice(0, 5).map((lead, i) => (
              <div key={lead.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#142e38]/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#2dd4a8]/10 flex items-center justify-center text-[10px] font-bold text-[#2dd4a8]">
                  {lead.full_name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{lead.full_name}</p>
                  <p className="text-[10px] text-gray-500">{lead.source || 'לא ידוע'} • {lead.city || '—'}</p>
                </div>
                <span className="text-[10px] text-gray-600">{new Date(lead.created_date).toLocaleDateString('he-IL')}</span>
              </div>
            ))}
            {leads.length === 0 && <p className="text-sm text-gray-500 text-center py-8">אין לידים עדיין</p>}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "ליד חדש", page: "CrmLeads", icon: Target },
          { label: "עסקה חדשה", page: "CrmDeals", icon: Kanban },
          { label: "פרויקטים", page: "CrmProjects", icon: ClipboardList },
          { label: "לקוחות", page: "CrmCustomers", icon: Users },
        ].map(item => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className="gesi-card p-4 flex items-center gap-3 hover:border-[#2dd4a8]/20 transition-all"
          >
            <item.icon className="w-5 h-5 text-[#2dd4a8]" />
            <span className="text-sm text-gray-300">{item.label}</span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}