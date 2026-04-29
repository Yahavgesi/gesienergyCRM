import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays, parseISO, startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { TrendingUp, Target, Users, Zap, Trophy, Star, Award, DollarSign, ArrowUp, ArrowDown } from "lucide-react";

const STAGE_LABELS = {
  new_lead: "ליד חדש", initial_contact: "יצירת קשר", site_survey: "סיור",
  quote_sent: "הצעה", negotiation: "משא ומתן", closing: "סגירה", won: "נסגר", lost: "אבוד",
};
const STAGE_COLORS = { new_lead:"#94a3b8", initial_contact:"#60a5fa", site_survey:"#a78bfa", quote_sent:"#fbbf24", negotiation:"#fb923c", closing:"#22c55e", won:"#0ea5a0", lost:"#ef4444" };

const PERIOD_OPTIONS = [
  { value: "month", label: "החודש" },
  { value: "last3", label: "3 חודשים" },
  { value: "year", label: "השנה" },
  { value: "all", label: "הכל" },
];

function getPeriodRange(period) {
  const now = new Date();
  if (period === "month") return { from: startOfMonth(now), to: endOfMonth(now) };
  if (period === "last3") return { from: subMonths(startOfMonth(now), 2), to: endOfMonth(now) };
  if (period === "year") return { from: startOfYear(now), to: endOfMonth(now) };
  return { from: new Date(2000, 0, 1), to: new Date(2099, 0, 1) };
}

function isInPeriod(dateStr, period) {
  if (!dateStr) return period === 'all';
  const d = new Date(dateStr);
  const { from, to } = getPeriodRange(period);
  return d >= from && d <= to;
}

export default function CrmAgentPerformance() {
  const [period, setPeriod] = useState("month");

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['all-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });

  const { data: projects = [], isLoading: projLoading } = useQuery({
    queryKey: ['all-projects-perf'],
    queryFn: () => base44.entities.Project.list('-created_date', 500),
  });

  const { data: payments = [], isLoading: payLoading } = useQuery({
    queryKey: ['all-payments-perf'],
    queryFn: () => base44.entities.Payment.list('-created_date', 500),
  });

  const isLoading = leadsLoading || projLoading || payLoading;

  // Compute per-agent stats
  const agentMap = {};

  leads.forEach(lead => {
    const agent = lead.assigned_agent || "לא שויך";
    if (!agentMap[agent]) agentMap[agent] = { name: agent, leads: 0, won: 0, lost: 0, kwp: 0, negotiation: 0, conversionRate: 0, stageBreakdown: {}, avgDealSize: 0, revenue: 0 };
    agentMap[agent].leads++;
    if (lead.sales_stage === 'won') agentMap[agent].won++;
    if (lead.sales_stage === 'lost') agentMap[agent].lost++;
    if (lead.sales_stage === 'negotiation') agentMap[agent].negotiation++;
    if (lead.estimated_kwp) agentMap[agent].kwp += lead.estimated_kwp;
    if (lead.sales_stage) {
      agentMap[agent].stageBreakdown[lead.sales_stage] = (agentMap[agent].stageBreakdown[lead.sales_stage] || 0) + 1;
    }
  });

  // Add project revenue per agent
  projects.forEach(proj => {
    const agent = proj.assigned_agent;
    if (agent && agentMap[agent] && proj.total_price) {
      agentMap[agent].revenue += proj.total_price;
    }
  });

  const agents = Object.values(agentMap)
    .filter(a => a.name !== "לא שויך")
    .map(a => ({
      ...a,
      conversionRate: a.leads > 0 ? Math.round((a.won / a.leads) * 100) : 0,
      avgDealSize: a.won > 0 ? Math.round(a.revenue / a.won) : 0,
    }))
    .sort((a, b) => b.won - a.won);

  const totalWon = agents.reduce((s, a) => s + a.won, 0);
  const totalLeads = agents.reduce((s, a) => s + a.leads, 0);
  const totalRevenue = agents.reduce((s, a) => s + a.revenue, 0);
  const totalKwp = agents.reduce((s, a) => s + a.kwp, 0);

  const barData = agents.map(a => ({
    name: a.name.split(' ')[0], // first name only
    לידים: a.leads,
    נסגרו: a.won,
    kvp: a.kwp,
  }));

  const pipelineData = Object.entries(
    leads.reduce((acc, l) => {
      if (!acc[l.sales_stage]) acc[l.sales_stage] = 0;
      acc[l.sales_stage]++;
      return acc;
    }, {})
  ).map(([stage, count]) => ({
    name: STAGE_LABELS[stage] || stage,
    value: count,
    color: STAGE_COLORS[stage] || "#94a3b8",
  })).sort((a, b) => b.value - a.value);

  if (isLoading) return <div className="p-8 text-center text-slate-400">טוען נתונים...</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ביצועי סוכנים</h1>
          <p className="text-slate-500 text-sm mt-0.5">ניתוח ביצועים ומעקב מכירות מפורט</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {PERIOD_OPTIONS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Users />} label="סה״כ לידים" value={totalLeads} sub={`${agents.length} סוכנים`} color="#0ea5a0" />
        <KpiCard icon={<Trophy />} label="עסקאות שנסגרו" value={totalWon} sub={`${totalLeads > 0 ? Math.round(totalWon/totalLeads*100) : 0}% המרה`} color="#22c55e" />
        <KpiCard icon={<DollarSign />} label="הכנסות כוללות" value={`₪${(totalRevenue/1000).toFixed(0)}K`} sub="מפרויקטים" color="#f59e0b" />
        <KpiCard icon={<Zap />} label="סה״כ kWp" value={totalKwp.toFixed(1)} sub="בצנרת" color="#8b5cf6" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">לידים וסגירות לפי סוכן</h2>
          {barData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">אין נתונים</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="לידים" fill="#bae6fd" radius={[4,4,0,0]} />
                <Bar dataKey="נסגרו" fill="#0ea5a0" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pipeline pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">פיזור הצנרת לפי שלב</h2>
          {pipelineData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">אין נתונים</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pipelineData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {pipelineData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Agent leaderboard */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">טבלת ביצועים — סוכנים</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                {["דירוג", "סוכן", "לידים", "נסגרו", "אבודים", "המרה %", "kWp בצנרת", "הכנסה", "ממוצע עסקה"].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-slate-400 text-sm">אין נתוני סוכנים</td></tr>
              )}
              {agents.map((agent, idx) => (
                <tr key={agent.name} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <RankBadge rank={idx + 1} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{agent.name}</td>
                  <td className="px-4 py-3 text-slate-600">{agent.leads}</td>
                  <td className="px-4 py-3"><span className="text-[#0ea5a0] font-bold">{agent.won}</span></td>
                  <td className="px-4 py-3"><span className="text-red-500">{agent.lost}</span></td>
                  <td className="px-4 py-3">
                    <ConversionBar rate={agent.conversionRate} />
                  </td>
                  <td className="px-4 py-3 text-amber-600 font-medium">{agent.kwp.toFixed(1)}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {agent.revenue > 0 ? `₪${(agent.revenue/1000).toFixed(0)}K` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {agent.avgDealSize > 0 ? `₪${agent.avgDealSize.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage breakdown per agent */}
      {agents.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">פיזור שלבים לפי סוכן</h2>
          <div className="space-y-3">
            {agents.map(agent => (
              <AgentStageLine key={agent.name} agent={agent} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <div style={{ color }} className="w-5 h-5">{icon}</div>
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-sm text-slate-400 font-medium">#{rank}</span>;
}

function ConversionBar({ rate }) {
  const color = rate >= 50 ? '#0ea5a0' : rate >= 25 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(rate, 100)}%`, background: color }} />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{rate}%</span>
    </div>
  );
}

function AgentStageLine({ agent }) {
  const stages = Object.entries(agent.stageBreakdown).sort((a, b) => b[1] - a[1]);
  const total = stages.reduce((s, [, v]) => s + v, 0);
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs font-medium text-slate-700 truncate">{agent.name.split(' ')[0]}</div>
      <div className="flex-1 flex h-5 rounded-full overflow-hidden gap-px">
        {stages.map(([stage, count]) => (
          <div key={stage} className="h-full transition-all"
            style={{ width: `${(count/total)*100}%`, background: STAGE_COLORS[stage] || '#94a3b8' }}
            title={`${STAGE_LABELS[stage]}: ${count}`} />
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {stages.slice(0,3).map(([stage, count]) => (
          <span key={stage} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${STAGE_COLORS[stage]}20`, color: STAGE_COLORS[stage] }}>
            {STAGE_LABELS[stage]}: {count}
          </span>
        ))}
      </div>
    </div>
  );
}