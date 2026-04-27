import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, CheckCircle2, XCircle } from "lucide-react";
import FormModal from "../components/crm/FormModal";
import { motion } from "framer-motion";

const typeLabels = { work: "עבודה", sick: "מחלה", vacation: "חופשה", holiday: "חג", absence: "היעדרות" };
const typeColors = { work: "text-[#2dd4a8]", sick: "text-yellow-400", vacation: "text-blue-400", holiday: "text-purple-400", absence: "text-red-400" };

export default function CrmAttendance() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: "work", date: new Date().toISOString().slice(0, 10) });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ['crm-employees'],
    queryFn: () => base44.entities.Employee.list('-created_date', 200),
  });

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['crm-attendance', selectedMonth],
    queryFn: () => base44.entities.Attendance.list('-date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-attendance'] }); setShowForm(false); setFormData({ type: "work", date: new Date().toISOString().slice(0, 10) }); },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }) => base44.entities.Attendance.update(id, { approved }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-attendance'] }),
  });

  const monthAttendance = attendance.filter(a => a.date?.startsWith(selectedMonth));
  const totalHours = monthAttendance.filter(a => a.type === 'work').reduce((s, a) => s + (a.total_hours || 0), 0);
  const sickDays = monthAttendance.filter(a => a.type === 'sick').length;
  const vacationDays = monthAttendance.filter(a => a.type === 'vacation').length;

  // Group by employee
  const byEmployee = monthAttendance.reduce((acc, a) => {
    const emp = employees.find(e => e.id === a.employee_id);
    const name = a.employee_name || emp?.full_name || a.employee_id;
    if (!acc[name]) acc[name] = [];
    acc[name].push(a);
    return acc;
  }, {});

  const formFields = [
    { key: "employee_id", label: "עובד", type: "select", options: employees.map(e => ({ value: e.id, label: e.full_name })) },
    { key: "date", label: "תאריך", type: "date" },
    { key: "type", label: "סוג", type: "select", options: Object.entries(typeLabels).map(([v, l]) => ({ value: v, label: l })) },
    { key: "check_in", label: "שעת כניסה", placeholder: "08:00" },
    { key: "check_out", label: "שעת יציאה", placeholder: "17:00" },
    { key: "total_hours", label: "שעות סה״כ", type: "number", placeholder: "8" },
    { key: "notes", label: "הערות", type: "textarea" },
  ];

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">נוכחות עובדים</h1>
        <div className="flex items-center gap-3">
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="bg-[#142e38] border border-[rgba(45,212,168,0.1)] text-white rounded-lg px-3 py-2 text-sm" />
          <Button onClick={() => setShowForm(true)} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-2" /> רשומה חדשה
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "סה״כ שעות", value: totalHours.toFixed(1), color: "text-[#2dd4a8]" },
          { label: "ימי מחלה", value: sickDays, color: "text-yellow-400" },
          { label: "ימי חופשה", value: vacationDays, color: "text-blue-400" },
          { label: "רשומות", value: monthAttendance.length, color: "text-gray-300" },
        ].map(card => (
          <div key={card.label} className="gesi-card p-4">
            <p className="text-xs text-gray-400 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* By Employee */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-[#142e38] animate-pulse" />)}</div>
      ) : Object.entries(byEmployee).length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>אין רשומות נוכחות לחודש זה</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byEmployee).map(([empName, records]) => {
            const empHours = records.filter(r => r.type === 'work').reduce((s, r) => s + (r.total_hours || 0), 0);
            return (
              <motion.div key={empName} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="gesi-card overflow-hidden">
                <div className="p-4 border-b border-[rgba(45,212,168,0.08)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#2dd4a8]/10 flex items-center justify-center text-[#2dd4a8] font-bold">
                      {empName[0]}
                    </div>
                    <h3 className="font-semibold text-white">{empName}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-[#2dd4a8] font-bold">{empHours.toFixed(1)} שעות</span>
                    <span className="text-gray-400">{records.length} יום</span>
                  </div>
                </div>
                <div className="divide-y divide-[rgba(45,212,168,0.04)]">
                  {records.slice(0, 5).map(r => (
                    <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${typeColors[r.type]}`}>{typeLabels[r.type]}</span>
                        <span className="text-sm text-white">{r.date}</span>
                        {r.check_in && <span className="text-xs text-gray-500">{r.check_in}–{r.check_out || '?'}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#2dd4a8]">{r.total_hours || 0}ש׳</span>
                        <button onClick={() => approveMutation.mutate({ id: r.id, approved: !r.approved })}>
                          {r.approved ? <CheckCircle2 className="w-4 h-4 text-[#2dd4a8]" /> : <XCircle className="w-4 h-4 text-gray-600 hover:text-gray-400" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <FormModal open={showForm} onClose={setShowForm} title="רשומת נוכחות" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}