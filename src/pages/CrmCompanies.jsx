import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FormModal from "../components/crm/FormModal";
import StatusBadge from "../components/shared/StatusBadge";
import SkeletonCard from "../components/shared/SkeletonCard";
import RowActions from "../components/crm/RowActions";
import QuickEditRow from "../components/crm/QuickEditRow";
import SideDrawer from "../components/crm/SideDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, RotateCcw, Building2, UserX, Users, Settings2 } from "lucide-react";
import { createPageUrl } from "../utils";

const statusLabels = { active: "פעיל", inactive: "לא פעיל" };
const statusMap = { active: "completed", inactive: "blocked" };

const ALL_COLUMNS = [
  { key: "name", label: "שם חברה" },
  { key: "business_number", label: "ח.פ." },
  { key: "phone", label: "טלפון" },
  { key: "email", label: "אימייל" },
  { key: "city", label: "עיר" },
  { key: "address", label: "כתובת" },
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }
  ]},
  { key: "assigned_agent", label: "סוכן" },
  { key: "created_date", label: "תאריך" },
];

const DEFAULT_VISIBLE = ["name", "business_number", "phone", "email", "city", "status", "assigned_agent"];

const formFields = [
  { key: "name", label: "שם חברה", placeholder: "שם החברה" },
  { key: "business_number", label: "ח.פ.", placeholder: "מספר ח.פ." },
  { key: "phone", label: "טלפון", placeholder: "050-0000000" },
  { key: "email", label: "אימייל", type: "email", placeholder: "email@example.com" },
  { key: "address", label: "כתובת", placeholder: "כתובת" },
  { key: "city", label: "עיר", placeholder: "עיר" },
  { key: "assigned_agent", label: "סוכן", placeholder: "שם הסוכן" },
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }
  ]},
];

const drawerSections = [
  { title: "פרטי חברה", fields: [
    { key: "name", label: "שם חברה" },
    { key: "business_number", label: "ח.פ." },
    { key: "phone", label: "טלפון" },
    { key: "email", label: "אימייל" },
  ]},
  { title: "מיקום ופרטים", fields: [
    { key: "address", label: "כתובת" },
    { key: "city", label: "עיר" },
    { key: "assigned_agent", label: "סוכן" },
    { key: "status", label: "סטטוס", type: "select", options: [
      { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }
    ]},
    { label: "תאריך הצטרפות", readOnly: true, render: r => r.created_date ? new Date(r.created_date).toLocaleDateString('he-IL') : '—' },
  ]},
];

function renderCompanyCell(col, company) {
  switch (col.key) {
    case "status": return <StatusBadge status={statusMap[company.status]} label={statusLabels[company.status]} />;
    case "created_date": return <span className="text-slate-400 text-xs">{company.created_date ? new Date(company.created_date).toLocaleDateString('he-IL') : "—"}</span>;
    default: return <span className="text-slate-700 text-sm">{company[col.key] || "—"}</span>;
  }
}

function ColumnManager({ visibleCols, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen(!open)} className="border-slate-200 text-slate-600 gap-1 text-xs h-9">
        <Settings2 className="w-3.5 h-3.5" /> עמודות
      </Button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-48" onClick={e => e.stopPropagation()}>
          <p className="text-xs font-semibold text-slate-500 mb-2">הצג עמודות</p>
          <div className="space-y-1">
            {ALL_COLUMNS.map(col => (
              <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={visibleCols.includes(col.key)}
                  onChange={e => {
                    const next = e.target.checked ? [...visibleCols, col.key] : visibleCols.filter(k => k !== col.key);
                    if (next.length > 0) { onChange(next); localStorage.setItem("companies_columns", JSON.stringify(next)); }
                  }} className="rounded" />
                <span className="text-xs text-slate-700">{col.label}</span>
              </label>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="mt-2 w-full text-xs text-slate-400">סגור</Button>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function CrmCompanies() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  const [visibleCols, setVisibleCols] = useState(() => {
    try { return JSON.parse(localStorage.getItem("companies_columns") || "null") || DEFAULT_VISIBLE; } catch { return DEFAULT_VISIBLE; }
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['crm-companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-companies'] }); setShowForm(false); setFormData({}); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-companies'] }); setEditingId(null); },
  });

  const agents = [...new Set(companies.map(c => c.assigned_agent).filter(Boolean))];

  const inactiveCount = companies.filter(c => c.status === 'inactive').length;
  const noAgentCount = companies.filter(c => !c.assigned_agent).length;
  const thisMonthNew = companies.filter(c => c.created_date?.startsWith(new Date().toISOString().slice(0, 7))).length;

  const filtered = companies
    .filter(c => !search || c.name?.includes(search) || c.business_number?.includes(search) || c.phone?.includes(search) || c.city?.includes(search))
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .filter(c => agentFilter === "all" || c.assigned_agent === agentFilter)
    .filter(c => {
      if (quickFilter === "all") return true;
      if (quickFilter === "inactive") return c.status === 'inactive';
      if (quickFilter === "no_agent") return !c.assigned_agent;
      return true;
    });

  const activeColumns = ALL_COLUMNS.filter(col => visibleCols.includes(col.key));

  return (
    <div className="p-4 lg:p-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-800">חברות</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש..."
              className="pr-9 bg-white border-slate-200 text-slate-700 placeholder-slate-400 w-52" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="border-slate-200 text-slate-600 gap-1 text-xs h-9">
            <Filter className="w-3.5 h-3.5" /> פילטרים {showFilters ? "▲" : "▼"}
          </Button>
          <ColumnManager visibleCols={visibleCols} onChange={setVisibleCols} />
          <Button onClick={() => { setFormData({}); setShowForm(true); }} className="bg-[#0ea5a0] hover:bg-[#0c8c88] text-white">
            <Plus className="w-4 h-4 ml-1.5" /> חברה חדשה
          </Button>
        </div>
      </div>

      {/* Quick filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {inactiveCount > 0 && (
          <button onClick={() => setQuickFilter(quickFilter === 'inactive' ? 'all' : 'inactive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${quickFilter === 'inactive' ? 'bg-slate-500 text-white border-slate-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <UserX className="w-3.5 h-3.5" /> {inactiveCount} לא פעילות
          </button>
        )}
        {noAgentCount > 0 && (
          <button onClick={() => setQuickFilter(quickFilter === 'no_agent' ? 'all' : 'no_agent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${quickFilter === 'no_agent' ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'}`}>
            <Users className="w-3.5 h-3.5" /> {noAgentCount} ללא סוכן
          </button>
        )}
        {quickFilter !== 'all' && (
          <button onClick={() => setQuickFilter('all')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
            <RotateCcw className="w-3 h-3" /> נקה
          </button>
        )}
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl bg-slate-50 border border-slate-200">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-xs bg-white border-slate-200 text-slate-700"><SelectValue placeholder="סטטוס" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="active">פעיל</SelectItem>
              <SelectItem value="inactive">לא פעיל</SelectItem>
            </SelectContent>
          </Select>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-40 h-8 text-xs bg-white border-slate-200 text-slate-700"><SelectValue placeholder="סוכן" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסוכנים</SelectItem>
              {agents.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          {(statusFilter !== 'all' || agentFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setAgentFilter('all'); }} className="text-xs text-slate-400 h-8">
              <RotateCcw className="w-3 h-3 ml-1" /> נקה
            </Button>
          )}
        </div>
      )}

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "סה״כ חברות", value: companies.length, color: "text-slate-700", icon: <Building2 className="w-4 h-4" /> },
          { label: "פעילות", value: companies.filter(c => c.status === 'active').length, color: "text-[#0ea5a0]", icon: <Building2 className="w-4 h-4" /> },
          { label: "לא פעילות", value: inactiveCount, color: "text-red-500", icon: <UserX className="w-4 h-4" /> },
          { label: "חדשות החודש", value: thisMonthNew, color: "text-blue-600", icon: <Building2 className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <div className={`${s.color} opacity-70`}>{s.icon}</div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? <SkeletonCard lines={5} /> : (
        <div className="rounded-xl overflow-hidden border" style={{ background: '#ffffff', borderColor: '#d1e3ec' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <span className="text-xs text-slate-400">{filtered.length} חברות</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ background: '#f1f7fb', borderColor: '#d1e3ec' }}>
                  <th className="px-4 py-3 w-28" />
                  {activeColumns.map(col => (
                    <th key={col.key} className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={activeColumns.length + 1} className="text-center py-10 text-slate-400">אין חברות</td></tr>
                )}
                {filtered.map(company => (
                  editingId === company.id ? (
                    <QuickEditRow key={company.id} record={company} columns={activeColumns}
                      onSave={data => updateMutation.mutate({ id: company.id, data })}
                      onCancel={() => setEditingId(null)} />
                  ) : (
                    <tr key={company.id}
                      onClick={() => navigate(createPageUrl(`CompanyCard/${company.id}`))}
                      className="group border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-3 py-3">
                        <RowActions
                          onOpen={e => { e.stopPropagation(); navigate(createPageUrl(`CompanyCard/${company.id}`)); }}
                          onEdit={e => { e.stopPropagation(); setEditingId(company.id); }}
                          onDrawer={e => { e.stopPropagation(); setDrawerRecord(company); }}
                        />
                      </td>
                      {activeColumns.map(col => (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                          {renderCompanyCell(col, company)}
                        </td>
                      ))}
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SideDrawer
        record={drawerRecord} onClose={() => setDrawerRecord(null)}
        onSave={async (draft) => {
          await base44.entities.Company.update(drawerRecord.id, draft);
          queryClient.invalidateQueries({ queryKey: ['crm-companies'] });
          setDrawerRecord(prev => ({ ...prev, ...draft }));
        }}
        title={r => r.name}
        subtitle={drawerRecord ? statusLabels[drawerRecord.status] : ''}
        subtitleColor={drawerRecord?.status === 'active' ? '#2dd4a8' : '#94a3b8'}
        avatar={r => r.name?.[0] || 'C'} avatarColor="#60a5fa"
        sections={drawerSections}
        cardPage={drawerRecord ? `CompanyCard/${drawerRecord.id}` : null}
      />

      <FormModal open={showForm} onClose={setShowForm} title="חברה חדשה" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}