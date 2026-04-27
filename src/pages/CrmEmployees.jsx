import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Phone, Mail, Star } from "lucide-react";
import FormModal from "../components/crm/FormModal";
import { motion } from "framer-motion";
import { createPageUrl } from "../utils";

const roleLabels = { sales: "מכירות", technician: "טכנאי", admin: "מנהל", manager: "מנהל בכיר", office: "משרד" };
const roleColors = { sales: "text-blue-400 bg-blue-400/10", technician: "text-orange-400 bg-orange-400/10", admin: "text-purple-400 bg-purple-400/10", manager: "text-[#2dd4a8] bg-[#2dd4a8]/10", office: "text-gray-400 bg-gray-400/10" };
const statusColors = { active: "text-[#2dd4a8]", inactive: "text-red-400", on_leave: "text-yellow-400" };
const statusLabels = { active: "פעיל", inactive: "לא פעיל", on_leave: "בחופשה" };

const formFields = [
  { key: "full_name", label: "שם מלא", placeholder: "שם העובד" },
  { key: "email", label: "אימייל", type: "email", placeholder: "email@company.com" },
  { key: "phone", label: "טלפון", placeholder: "050-0000000" },
  { key: "id_number", label: "תעודת זהות", placeholder: "000000000" },
  { key: "role", label: "תפקיד", type: "select", options: Object.entries(roleLabels).map(([v, l]) => ({ value: v, label: l })) },
  { key: "department", label: "מחלקה", placeholder: "מחלקה" },
  { key: "start_date", label: "תאריך התחלה", type: "date" },
  { key: "salary", label: "שכר בסיס (₪)", type: "number", placeholder: "0" },
  { key: "salary_type", label: "סוג שכר", type: "select", options: [
    { value: "monthly", label: "חודשי" }, { value: "hourly", label: "שעתי" }, { value: "commission", label: "עמלה" }
  ]},
  { key: "commission_rate", label: "אחוז עמלה", type: "number", placeholder: "0" },
  { key: "status", label: "סטטוס", type: "select", options: [
    { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }, { value: "on_leave", label: "בחופשה" }
  ]},
  { key: "address", label: "כתובת", placeholder: "כתובת מגורים" },
  { key: "notes", label: "הערות", type: "textarea" },
];

export default function CrmEmployees() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ status: "active", salary_type: "monthly" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['crm-employees'],
    queryFn: () => base44.entities.Employee.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-employees'] }); setShowForm(false); setFormData({ status: "active", salary_type: "monthly" }); },
  });

  const filtered = employees.filter(e =>
    (roleFilter === "all" || e.role === roleFilter) &&
    (!search || e.full_name?.includes(search) || e.email?.includes(search) || e.phone?.includes(search))
  );

  const activeCount = employees.filter(e => e.status === "active").length;
  const totalSalary = employees.filter(e => e.status === "active").reduce((s, e) => s + (e.salary || 0), 0);

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">עובדים</h1>
          <p className="text-sm text-gray-400 mt-1">{activeCount} עובדים פעילים • שכר חודשי: ₪{totalSalary.toLocaleString()}</p>
        </div>
        <Button onClick={() => { setFormData({ status: "active", salary_type: "monthly" }); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-2" /> עובד חדש
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש..." className="pr-9 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 w-56" />
        </div>
        <div className="flex gap-2">
          {[["all", "הכל"], ...Object.entries(roleLabels)].map(([val, label]) => (
            <button key={val} onClick={() => setRoleFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${roleFilter === val ? 'bg-[#2dd4a8] text-white' : 'bg-[#142e38] text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 rounded-2xl bg-[#142e38] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>אין עובדים</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp, i) => (
            <motion.div key={emp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => navigate(createPageUrl(`EmployeeCard?id=${emp.id}`))}
              className="gesi-card p-5 cursor-pointer hover:border-[#2dd4a8]/30 hover:bg-[#142e38]/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2dd4a8] to-[#1fa882] flex items-center justify-center text-white font-bold text-lg">
                    {emp.full_name?.[0] || "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{emp.full_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[emp.role] || 'text-gray-400 bg-gray-400/10'}`}>
                      {roleLabels[emp.role] || emp.role || '—'}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-medium ${statusColors[emp.status]}`}>● {statusLabels[emp.status]}</span>
              </div>
              <div className="space-y-1.5">
                {emp.phone && <div className="flex items-center gap-2 text-sm text-gray-400"><Phone className="w-3.5 h-3.5" />{emp.phone}</div>}
                {emp.email && <div className="flex items-center gap-2 text-sm text-gray-400 truncate"><Mail className="w-3.5 h-3.5 flex-shrink-0" />{emp.email}</div>}
              </div>
              {emp.salary && (
                <div className="mt-3 pt-3 border-t border-[rgba(45,212,168,0.08)] flex justify-between text-xs">
                  <span className="text-gray-500">שכר בסיס</span>
                  <span className="text-[#2dd4a8] font-semibold">₪{emp.salary.toLocaleString()}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <FormModal open={showForm} onClose={setShowForm} title="עובד חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}