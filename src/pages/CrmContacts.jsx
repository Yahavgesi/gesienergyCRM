import React, { useState, useEffect } from "react";
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
import { Plus, Search, Filter, RotateCcw, Users, Star, UserX, Settings2 } from "lucide-react";
import { createPageUrl } from "../utils";

const statusLabels = { active: "פעיל", inactive: "לא פעיל", vip: "VIP" };
const statusMap = { active: "completed", inactive: "blocked", vip: "in_progress" };
const SOURCE_LABELS = {
  website: "אתר", referral: "הפניה", facebook: "פייסבוק", google: "גוגל",
  phone: "טלפון", walk_in: "פנה ישירות", whatsapp: "וואטסאפ", tiktok: "טיקטוק",
  instagram: "אינסטגרם", yad2: "יד2", portal: "פורטל", other: "אחר"
};
const PROP_LABELS = { residential: "פרטי", commercial: "מסחרי", industrial: "תעשייתי", agricultural: "חקלאי", parking: "חניון" };

const ALL_COLUMNS = [
  { key: "full_name", label: "שם מלא" },
  { key: "phone", label: "טלפון" },
  { key: "phone2", label: "טלפון 2" },
  { key: "email", label: "אימייל" },
  { key: "id_number", label: "ת.ז." },
  { key: "city", label: "עיר" },
  { key: "address", label: "כתובת" },
  { key: "company_name", label: "חברה" },
  { key: "property_type", label: "סוג נכס", type: "select", options: Object.entries(PROP_LABELS).map(([v,l]) => ({ value: v, label: l })) },
  { key: "roof_size_sqm", label: 'גג (מ"ר)', type: "number" },
  { key: "estimated_kwp", label: "kWp משוער", type: "number" },
  { key: "monthly_electricity_bill", label: "חשבון חשמל (₪)", type: "number" },
  { key: "source", label: "מקור", type: "select", options: Object.entries(SOURCE_LABELS).map(([v,l]) => ({ value: v, label: l })) },
  { key: "assigned_agent", label: "סוכן" },
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }, { value: "vip", label: "VIP" }
  ]},
  { key: "created_date", label: "תאריך" },
];

const DEFAULT_VISIBLE = ["full_name", "phone", "email", "city", "property_type", "source", "assigned_agent", "status", "created_date"];

const formFields = [
  { key: "full_name", label: "שם מלא", placeholder: "שם מלא" },
  { key: "first_name", label: "שם פרטי", placeholder: "שם פרטי" },
  { key: "last_name", label: "שם משפחה", placeholder: "שם משפחה" },
  { key: "phone", label: "טלפון נייד", placeholder: "050-0000000" },
  { key: "phone2", label: "טלפון נוסף", placeholder: "050-0000000" },
  { key: "email", label: "אימייל", type: "email", placeholder: "email@example.com" },
  { key: "id_number", label: "ת.ז.", placeholder: "תעודת זהות" },
  { key: "company_name", label: "שם חברה", placeholder: "שם חברה (אם רלוונטי)" },
  { key: "address", label: "כתובת", placeholder: "כתובת" },
  { key: "city", label: "עיר", placeholder: "עיר" },
  { key: "region", label: "אזור", placeholder: "צפון / מרכז / דרום..." },
  { key: "zip_code", label: "מיקוד", placeholder: "מיקוד" },
  { key: "property_type", label: "סוג נכס", type: "select", options: Object.entries(PROP_LABELS).map(([v,l]) => ({ value: v, label: l })) },
  { key: "roof_type", label: "סוג גג", type: "select", options: [
    { value: "flat", label: "שטוח" }, { value: "sloped", label: "משופע" },
    { value: "tile", label: "רעפים" }, { value: "metal", label: "מתכת" }, { value: "other", label: "אחר" }
  ]},
  { key: "roof_size_sqm", label: 'שטח גג (מ"ר)', type: "number", placeholder: "0" },
  { key: "monthly_electricity_bill", label: "חשבון חשמל חודשי (₪)", type: "number", placeholder: "0" },
  { key: "electricity_provider", label: "ספק חשמל", placeholder: "חברת חשמל / ספק" },
  { key: "source", label: "מקור", type: "select", options: Object.entries(SOURCE_LABELS).map(([v,l]) => ({ value: v, label: l })) },
  { key: "assigned_agent", label: "סוכן מכירות", placeholder: "שם הסוכן" },
  { key: "language", label: "שפה", type: "select", options: [
    { value: "he", label: "עברית" }, { value: "en", label: "English" }, { value: "ar", label: "عربي" }, { value: "ru", label: "Русский" }
  ]},
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }, { value: "vip", label: "VIP" }
  ]},
  { key: "bank_name", label: "שם בנק", placeholder: "שם הבנק" },
  { key: "bank_branch", label: "סניף", placeholder: "מספר סניף" },
  { key: "bank_account", label: "מספר חשבון", placeholder: "מספר חשבון בנק" },
  { key: "notes", label: "הערות", type: "textarea", placeholder: "הערות פנימיות" },
];

const drawerSections = [
  { title: "פרטי קשר", fields: [
    { key: "full_name", label: "שם מלא" },
    { key: "phone", label: "טלפון נייד" },
    { key: "phone2", label: "טלפון נוסף" },
    { key: "email", label: "אימייל" },
    { key: "id_number", label: "ת.ז." },
    { key: "company_name", label: "חברה" },
  ]},
  { title: "נכס וסולאר", fields: [
    { key: "property_type", label: "סוג נכס", type: "select", options: Object.entries(PROP_LABELS).map(([v,l]) => ({ value: v, label: l })) },
    { key: "roof_type", label: "סוג גג", type: "select", options: [
      { value: "flat", label: "שטוח" }, { value: "sloped", label: "משופע" },
      { value: "tile", label: "רעפים" }, { value: "metal", label: "מתכת" }, { value: "other", label: "אחר" }
    ]},
    { key: "roof_size_sqm", label: 'שטח גג (מ"ר)', type: "number" },
    { key: "monthly_electricity_bill", label: "חשבון חשמל (₪)", type: "number" },
    { key: "electricity_provider", label: "ספק חשמל" },
  ]},
  { title: "מיקום ומשויכים", fields: [
    { key: "address", label: "כתובת" },
    { key: "city", label: "עיר" },
    { key: "region", label: "אזור" },
    { key: "source", label: "מקור", type: "select", options: Object.entries(SOURCE_LABELS).map(([v,l]) => ({ value: v, label: l })) },
    { key: "assigned_agent", label: "סוכן" },
    { key: "status", label: "סטטוס", type: "select", options: [
      { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }, { value: "vip", label: "VIP" }
    ]},
    { key: "language", label: "שפה", type: "select", options: [
      { value: "he", label: "עברית" }, { value: "en", label: "English" }, { value: "ar", label: "عربي" }, { value: "ru", label: "Русский" }
    ]},
    { label: "תאריך הצטרפות", readOnly: true, render: r => r.created_date ? new Date(r.created_date).toLocaleDateString('he-IL') : '—' },
  ]},
  { title: "בנק", fields: [
    { key: "bank_name", label: "שם בנק" },
    { key: "bank_branch", label: "סניף" },
    { key: "bank_account", label: "מספר חשבון" },
  ]},
  { title: "הערות", fields: [
    { key: "notes", label: "הערות", type: "textarea" },
  ]},
];

function renderContactCell(col, contact) {
  switch (col.key) {
    case "status": return <StatusBadge status={statusMap[contact.status]} label={statusLabels[contact.status]} />;
    case "source": return <span className="text-slate-500 text-xs">{SOURCE_LABELS[contact.source] || contact.source || "—"}</span>;
    case "property_type": return <span className="text-slate-500 text-xs">{PROP_LABELS[contact.property_type] || contact.property_type || "—"}</span>;
    case "created_date": return <span className="text-slate-400 text-xs">{contact.created_date ? new Date(contact.created_date).toLocaleDateString('he-IL') : "—"}</span>;
    case "monthly_electricity_bill": return contact.monthly_electricity_bill ? <span className="text-slate-600">₪{contact.monthly_electricity_bill.toLocaleString()}</span> : <span className="text-slate-300">—</span>;
    case "roof_size_sqm": return contact.roof_size_sqm ? <span className="text-slate-600">{contact.roof_size_sqm}</span> : <span className="text-slate-300">—</span>;
    default: return <span className="text-slate-700 text-sm">{contact[col.key] || "—"}</span>;
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
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-52" onClick={e => e.stopPropagation()}>
          <p className="text-xs font-semibold text-slate-500 mb-2">הצג עמודות</p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {ALL_COLUMNS.map(col => (
              <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={visibleCols.includes(col.key)}
                  onChange={e => {
                    const next = e.target.checked ? [...visibleCols, col.key] : visibleCols.filter(k => k !== col.key);
                    if (next.length > 0) { onChange(next); localStorage.setItem("contacts_columns", JSON.stringify(next)); }
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

export default function CrmContacts() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState("all"); // all | vip | inactive | no_agent
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  const [visibleCols, setVisibleCols] = useState(() => {
    try { return JSON.parse(localStorage.getItem("contacts_columns") || "null") || DEFAULT_VISIBLE; } catch { return DEFAULT_VISIBLE; }
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-contacts'] }); setShowForm(false); setFormData({}); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-contacts'] }); setEditingId(null); },
  });

  const agents = [...new Set(contacts.map(c => c.assigned_agent).filter(Boolean))];

  // Quick filter counts
  const vipCount = contacts.filter(c => c.status === 'vip').length;
  const inactiveCount = contacts.filter(c => c.status === 'inactive').length;
  const noAgentCount = contacts.filter(c => !c.assigned_agent).length;

  const filtered = contacts
    .filter(c => !search || c.full_name?.includes(search) || c.phone?.includes(search) || c.email?.includes(search) || c.city?.includes(search))
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .filter(c => agentFilter === "all" || c.assigned_agent === agentFilter)
    .filter(c => {
      if (quickFilter === "all") return true;
      if (quickFilter === "vip") return c.status === 'vip';
      if (quickFilter === "inactive") return c.status === 'inactive';
      if (quickFilter === "no_agent") return !c.assigned_agent;
      return true;
    });

  const activeColumns = ALL_COLUMNS.filter(c => visibleCols.includes(c.key));
  const thisMonthNew = contacts.filter(c => c.created_date?.startsWith(new Date().toISOString().slice(0, 7))).length;

  return (
    <div className="p-4 lg:p-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-800">אנשי קשר</h1>
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
            <Plus className="w-4 h-4 ml-1.5" /> איש קשר חדש
          </Button>
        </div>
      </div>

      {/* Quick filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {vipCount > 0 && (
          <button onClick={() => setQuickFilter(quickFilter === 'vip' ? 'all' : 'vip')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${quickFilter === 'vip' ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'}`}>
            <Star className="w-3.5 h-3.5" /> {vipCount} VIP
          </button>
        )}
        {inactiveCount > 0 && (
          <button onClick={() => setQuickFilter(quickFilter === 'inactive' ? 'all' : 'inactive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${quickFilter === 'inactive' ? 'bg-slate-500 text-white border-slate-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            <UserX className="w-3.5 h-3.5" /> {inactiveCount} לא פעילים
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
              <SelectItem value="vip">VIP</SelectItem>
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
          { label: "סה״כ אנשי קשר", value: contacts.length, color: "text-slate-700", icon: <Users className="w-4 h-4" /> },
          { label: "פעילים", value: contacts.filter(c => c.status === 'active').length, color: "text-[#0ea5a0]", icon: <Users className="w-4 h-4" /> },
          { label: "VIP", value: vipCount, color: "text-yellow-600", icon: <Star className="w-4 h-4" /> },
          { label: "חדשים החודש", value: thisMonthNew, color: "text-blue-600", icon: <Users className="w-4 h-4" /> },
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
            <span className="text-xs text-slate-400">{filtered.length} אנשי קשר</span>
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
                  <tr><td colSpan={activeColumns.length + 1} className="text-center py-10 text-slate-400">אין אנשי קשר</td></tr>
                )}
                {filtered.map(contact => (
                  editingId === contact.id ? (
                    <QuickEditRow key={contact.id} record={contact} columns={activeColumns}
                      onSave={data => updateMutation.mutate({ id: contact.id, data })}
                      onCancel={() => setEditingId(null)} />
                  ) : (
                    <tr key={contact.id}
                      onClick={() => navigate(createPageUrl(`ContactCard?id=${contact.id}`))}
                      className="group border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-3 py-3">
                        <RowActions
                          onOpen={e => { e.stopPropagation(); navigate(createPageUrl(`ContactCard?id=${contact.id}`)); }}
                          onEdit={e => { e.stopPropagation(); setEditingId(contact.id); }}
                          onDrawer={e => { e.stopPropagation(); setDrawerRecord(contact); }}
                        />
                      </td>
                      {activeColumns.map(col => (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                          {renderContactCell(col, contact)}
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
          await base44.entities.Contact.update(drawerRecord.id, draft);
          queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
          setDrawerRecord(prev => ({ ...prev, ...draft }));
        }}
        title={r => r.full_name}
        subtitle={drawerRecord ? statusLabels[drawerRecord.status] : ''}
        subtitleColor={drawerRecord?.status === 'vip' ? '#fbbf24' : drawerRecord?.status === 'active' ? '#2dd4a8' : '#94a3b8'}
        avatar={r => r.full_name?.[0] || 'C'}
        sections={drawerSections} cardPage="ContactCard"
      />

      <FormModal open={showForm} onClose={setShowForm} title="איש קשר חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}