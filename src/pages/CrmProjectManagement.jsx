import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, Kanban, List, Calendar, BarChart3, Plus, Filter, Search, ArrowUpRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import KpiCard from "../components/crm/KpiCard";
import SkeletonCard from "../components/shared/SkeletonCard";
import StatusBadge from "../components/shared/StatusBadge";

const VIEWS = [
  { id: 'kanban', label: 'קנבן', icon: Kanban },
  { id: 'list', label: 'רשימה', icon: List },
  { id: 'timeline', label: 'ציר זמן', icon: Calendar },
  { id: 'stats', label: 'סטטיסטיקות', icon: BarChart3 },
];

const STATUS_COLS = [
  { id: 'active', label: 'פעיל', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { id: 'on_hold', label: 'מושהה', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { id: 'completed', label: 'הושלם', color: 'text-[#2dd4a8]', bg: 'bg-[#2dd4a8]/10', border: 'border-[#2dd4a8]/20' },
  { id: 'cancelled', label: 'בוטל', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
];

export default function CrmProjectManagement() {
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['pm-projects'], queryFn: () => base44.entities.Project.list('-created_date', 200)
  });
  const { data: steps = [] } = useQuery({
    queryKey: ['pm-steps'], queryFn: () => base44.entities.ProjectStep.list('step_index', 1000)
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['pm-tasks'], queryFn: () => base44.entities.Task.list('-created_date', 200)
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Project.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pm-projects'] }),
  });

  const filtered = projects.filter(p =>
    (!search || p.title?.includes(search) || p.customer_name?.includes(search)) &&
    (statusFilter === 'all' || p.status === statusFilter)
  );

  const totalKwp = projects.reduce((s, p) => s + (p.kwp || 0), 0);
  const activeCount = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const onHoldCount = projects.filter(p => p.status === 'on_hold').length;

  const getStepCount = (projectId) => steps.filter(s => s.project_id === projectId);
  const getProgress = (projectId) => {
    const psteps = getStepCount(projectId);
    if (!psteps.length) return 0;
    return Math.round((psteps.filter(s => s.status === 'completed').length / psteps.length) * 100);
  };

  if (isLoading) return <div className="p-6 space-y-4" dir="rtl">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="p-4 lg:p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ניהול פרויקטים</h1>
          <p className="text-sm text-gray-400">{projects.length} פרויקטים • {totalKwp.toFixed(1)} kWp סה״כ</p>
        </div>
        <Link to={createPageUrl('CrmProjects')}>
          <Button size="sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-1" /> פרויקט חדש
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="פרויקטים פעילים" value={activeCount} icon={ClipboardList} />
        <KpiCard title="הושלמו" value={completedCount} icon={CheckCircle2} delay={0.05} />
        <KpiCard title="מושהים" value={onHoldCount} icon={Clock} delay={0.1} />
        <KpiCard title="סה״כ kWp" value={`${totalKwp.toFixed(0)}`} icon={Zap} delay={0.15} />
      </div>

      {/* Filters & Views */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש פרויקט..." className="bg-[#0f2229] border-[rgba(45,212,168,0.1)] text-white pr-8 h-9" />
        </div>
        <div className="flex gap-1">
          {[{ v: 'all', l: 'הכל' }, ...STATUS_COLS.map(s => ({ v: s.id, l: s.label }))].map(opt => (
            <button key={opt.v} onClick={() => setStatusFilter(opt.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === opt.v ? 'bg-[#2dd4a8]/10 text-[#2dd4a8] border border-[#2dd4a8]/20' : 'bg-[#142e38]/50 text-gray-400 hover:text-white'}`}>
              {opt.l}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`p-1.5 rounded-lg transition-colors ${view === v.id ? 'bg-[#2dd4a8]/10 text-[#2dd4a8]' : 'text-gray-500 hover:bg-[#142e38] hover:text-white'}`}>
              <v.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
          {STATUS_COLS.map(col => {
            const colProjects = filtered.filter(p => p.status === col.id);
            return (
              <div key={col.id} className={`rounded-2xl border ${col.border} ${col.bg} p-3`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                  <span className="text-xs text-gray-500 bg-[#0a1a1f]/50 px-2 py-0.5 rounded-full">{colProjects.length}</span>
                </div>
                <div className="space-y-2">
                  {colProjects.map(p => (
                    <Link key={p.id} to={createPageUrl(`ProjectCard?id=${p.id}`)}>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-[#0f2229] border border-[rgba(45,212,168,0.08)] rounded-xl p-3 hover:border-[#2dd4a8]/20 transition-all cursor-pointer">
                        <p className="text-sm font-medium text-white mb-1">{p.title}</p>
                        <p className="text-[10px] text-gray-400 mb-2">{p.customer_name} • {p.kwp || 0} kWp</p>
                        <div className="h-1 bg-[#142e38] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#2dd4a8] to-[#1fa882]" style={{ width: `${getProgress(p.id)}%` }} />
                        </div>
                        <p className="text-[9px] text-gray-500 mt-1">{getProgress(p.id)}% הושלם</p>
                      </motion.div>
                    </Link>
                  ))}
                  {colProjects.length === 0 && <p className="text-[11px] text-gray-600 text-center py-4">אין פרויקטים</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="gesi-card overflow-hidden">
          <div className="divide-y divide-[rgba(45,212,168,0.05)]">
            {filtered.map(p => (
              <Link key={p.id} to={createPageUrl(`ProjectCard?id=${p.id}`)}
                className="flex items-center gap-4 px-4 py-3 hover:bg-[#142e38]/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#2dd4a8]/10 flex items-center justify-center font-bold text-[#2dd4a8] text-sm flex-shrink-0">
                  {p.title?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.customer_name} • {p.address || '—'}</p>
                </div>
                <div className="hidden lg:flex items-center gap-4 text-xs text-gray-400">
                  <span>{p.kwp || 0} kWp</span>
                  <div className="w-24">
                    <div className="h-1.5 bg-[#142e38] rounded-full overflow-hidden">
                      <div className="h-full bg-[#2dd4a8] rounded-full" style={{ width: `${getProgress(p.id)}%` }} />
                    </div>
                  </div>
                  <span>{getProgress(p.id)}%</span>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
            {filtered.length === 0 && <p className="text-center text-gray-500 py-8 text-sm">לא נמצאו פרויקטים</p>}
          </div>
        </div>
      )}

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="space-y-3">
          {filtered.filter(p => p.start_date).sort((a,b) => new Date(a.start_date) - new Date(b.start_date)).map(p => {
            const start = new Date(p.start_date);
            const end = p.estimated_completion ? new Date(p.estimated_completion) : new Date(start.getTime() + 90*24*60*60*1000);
            const now = new Date();
            const total = end - start;
            const elapsed = Math.min(now - start, total);
            const progress = total > 0 ? Math.max(0, Math.min(100, (elapsed/total)*100)).toFixed(0) : 0;
            return (
              <Link key={p.id} to={createPageUrl(`ProjectCard?id=${p.id}`)} className="block gesi-card p-4 hover:border-[#2dd4a8]/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{p.title}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <span className="text-xs text-gray-400">{p.kwp} kWp</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span>{start.toLocaleDateString('he-IL')}</span>
                  <span>→</span>
                  <span>{end.toLocaleDateString('he-IL')}</span>
                </div>
                <div className="relative h-2 bg-[#142e38] rounded-full overflow-hidden">
                  <div className="absolute h-full bg-gradient-to-r from-[#2dd4a8] to-[#1fa882] rounded-full transition-all" style={{ width: `${progress}%` }} />
                  <div className="absolute h-full w-0.5 bg-white/30" style={{ left: `${progress}%` }} />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{progress}% לפי זמן</p>
              </Link>
            );
          })}
          {filtered.filter(p => p.start_date).length === 0 && <p className="text-center text-gray-500 py-8 text-sm">אין פרויקטים עם תאריכי התחלה</p>}
        </div>
      )}

      {/* Stats View */}
      {view === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="gesi-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">פרויקטים לפי סטטוס</h3>
            <div className="space-y-3">
              {STATUS_COLS.map(col => {
                const count = projects.filter(p => p.status === col.id).length;
                const pct = projects.length ? (count/projects.length*100).toFixed(0) : 0;
                return (
                  <div key={col.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={col.color}>{col.label}</span>
                      <span className="text-gray-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-[#142e38] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${col.bg.replace('/10','/50')}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="gesi-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">פרויקטים לפי סוג</h3>
            <div className="space-y-3">
              {['residential', 'commercial', 'tender'].map(type => {
                const count = projects.filter(p => p.type === type).length;
                const labels = { residential: 'פרטי', commercial: 'מסחרי', tender: 'מכרז' };
                const pct = projects.length ? (count/projects.length*100).toFixed(0) : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{labels[type]}</span>
                      <span className="text-white">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-[#142e38] rounded-full overflow-hidden">
                      <div className="h-full bg-[#2dd4a8]/50 rounded-full" style={{ width: `${pct}%` }} />
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