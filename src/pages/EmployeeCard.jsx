import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Edit, Phone, Mail, Calendar, DollarSign } from "lucide-react";
import FormModal from "../components/crm/FormModal";
import { toast } from "sonner";

const roleLabels = { sales: "מכירות", technician: "טכנאי", admin: "מנהל", manager: "מנהל בכיר", office: "משרד" };
const statusLabels = { active: "פעיל", inactive: "לא פעיל", on_leave: "בחופשה" };

export default function EmployeeCard() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => base44.entities.Employee.get(id),
    enabled: !!id,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', id],
    queryFn: () => base44.entities.Attendance.filter({ employee_id: id }, '-date', 30),
    enabled: !!id,
  });

  const { data: salaries = [] } = useQuery({
    queryKey: ['salaries', id],
    queryFn: () => base44.entities.SalaryPayment.filter({ employee_id: id }, '-month', 12),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['employee', id]); setEditOpen(false); toast.success("עובד עודכן"); },
  });

  if (isLoading || !employee) return (
    <div className="p-8"><div className="animate-pulse h-64 bg-[#142e38] rounded-2xl" /></div>
  );

  const totalHoursThisMonth = attendance
    .filter(a => a.date?.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, a) => s + (a.total_hours || 0), 0);

  const editFields = [
    { key: "full_name", label: "שם מלא" },
    { key: "phone", label: "טלפון" },
    { key: "email", label: "אימייל", type: "email" },
    { key: "role", label: "תפקיד", type: "select", options: Object.entries(roleLabels).map(([v,l]) => ({ value: v, label: l })) },
    { key: "salary", label: "שכר (₪)", type: "number" },
    { key: "commission_rate", label: "עמלה %", type: "number" },
    { key: "status", label: "סטטוס", type: "select", options: [
      { value: "active", label: "פעיל" }, { value: "inactive", label: "לא פעיל" }, { value: "on_leave", label: "בחופשה" }
    ]},
    { key: "notes", label: "הערות", type: "textarea" },
  ];

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f2229] to-[#142e38] border-b border-[rgba(45,212,168,0.1)] p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-400 mb-4"><ArrowRight className="w-4 h-4 ml-2" />חזור</Button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2dd4a8] to-[#1fa882] flex items-center justify-center text-white text-2xl font-bold">
              {employee.full_name?.[0] || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{employee.full_name}</h1>
              <p className="text-[#2dd4a8]">{roleLabels[employee.role] || employee.role}</p>
              <p className="text-xs text-gray-400 mt-1">{statusLabels[employee.status]}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => { setEditData(employee); setEditOpen(true); }} className="border-gray-600">
            <Edit className="w-4 h-4 ml-2" />ערוך
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "שעות החודש", value: totalHoursThisMonth.toFixed(1), icon: Calendar },
            { label: "שכר בסיס", value: `₪${(employee.salary || 0).toLocaleString()}`, icon: DollarSign },
            { label: "עמלה", value: `${employee.commission_rate || 0}%`, icon: DollarSign },
            { label: "ימי נוכחות", value: attendance.filter(a => a.date?.startsWith(new Date().toISOString().slice(0, 7))).length, icon: Calendar },
          ].map(card => (
            <div key={card.label} className="bg-[#142e38]/50 rounded-xl p-4 border border-[rgba(45,212,168,0.08)]">
              <p className="text-xs text-gray-400">{card.label}</p>
              <p className="text-xl font-bold text-white mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <div className="border-b border-[rgba(45,212,168,0.1)] bg-[#0d1f26]">
          <TabsList className="bg-transparent px-6 py-0 h-auto">
            {[["details", "פרטים"], ["attendance", "נוכחות"], ["salary", "שכר"]].map(([val, label]) => (
              <TabsTrigger key={val} value={val} className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">{label}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="details" className="p-6">
          <div className="gesi-card p-6 space-y-3 max-w-lg">
            {[
              ["שם מלא", employee.full_name],
              ["אימייל", employee.email],
              ["טלפון", employee.phone],
              ["ת.ז.", employee.id_number],
              ["מחלקה", employee.department],
              ["תאריך התחלה", employee.start_date ? new Date(employee.start_date).toLocaleDateString('he-IL') : '—'],
              ["כתובת", employee.address],
              ["הערות", employee.notes],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-[rgba(45,212,168,0.05)] last:border-0">
                <span className="text-sm text-gray-400">{label}</span>
                <span className="text-sm text-white">{value || '—'}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="p-6">
          <div className="space-y-2">
            {attendance.length === 0 ? <p className="text-gray-500 text-center py-12">אין רשומות נוכחות</p> : attendance.map(a => (
              <div key={a.id} className="gesi-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{a.date}</p>
                  <p className="text-xs text-gray-400">{a.check_in || '—'} — {a.check_out || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#2dd4a8]">{a.total_hours || 0} שעות</p>
                  <p className="text-xs text-gray-500">{a.type === 'work' ? 'עבודה' : a.type === 'sick' ? 'מחלה' : a.type === 'vacation' ? 'חופשה' : a.type}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="salary" className="p-6">
          <div className="space-y-2">
            {salaries.length === 0 ? <p className="text-gray-500 text-center py-12">אין רשומות שכר</p> : salaries.map(s => (
              <div key={s.id} className="gesi-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{s.month}</p>
                  <p className="text-xs text-gray-400">שעות: {s.hours_worked || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#2dd4a8]">₪{(s.total || 0).toLocaleString()}</p>
                  <p className={`text-xs ${s.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>{s.status === 'paid' ? 'שולם' : 'ממתין'}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <FormModal open={editOpen} onClose={setEditOpen} title="ערוך עובד" fields={editFields}
        data={editData} setData={setEditData} onSubmit={() => updateMutation.mutate(editData)} submitting={updateMutation.isPending} />
    </div>
  );
}