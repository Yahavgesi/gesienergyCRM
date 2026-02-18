import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FormModal from "../components/crm/FormModal";
import StatusBadge from "../components/shared/StatusBadge";
import SkeletonCard from "../components/shared/SkeletonCard";
import EmptyState from "../components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

const statusLabels = { todo: "לביצוע", in_progress: "בביצוע", done: "הושלם", cancelled: "בוטל" };
const statusMap = { todo: "pending", in_progress: "in_progress", done: "completed", cancelled: "blocked" };
const priorityLabels = { low: "נמוך", medium: "בינוני", high: "גבוה", urgent: "דחוף" };
const priorityColors = { low: "text-gray-400", medium: "text-blue-400", high: "text-amber-400", urgent: "text-red-400" };

const formFields = [
  { key: "title", label: "כותרת", placeholder: "שם המשימה" },
  { key: "description", label: "תיאור", type: "textarea", placeholder: "תיאור המשימה" },
  { key: "assigned_to", label: "שיוך ל", type: "email", placeholder: "email@example.com" },
  { key: "due_date", label: "תאריך יעד", type: "date" },
  { key: "priority", label: "עדיפות", type: "select", options: Object.entries(priorityLabels).map(([v, l]) => ({ value: v, label: l })) },
  { key: "status", label: "סטטוס", type: "select", options: Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l })) },
];

export default function CrmTasks() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ status: "todo", priority: "medium" });
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['crm-tasks'], queryFn: () => base44.entities.Task.list('-created_date', 200), initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-tasks'] }); setShowForm(false); setFormData({ status: "todo", priority: "medium" }); },
  });

  const toggleDone = useMutation({
    mutationFn: (task) => base44.entities.Task.update(task.id, { status: task.status === 'done' ? 'todo' : 'done' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-tasks'] }),
  });

  if (isLoading) return <div className="p-6" dir="rtl"><SkeletonCard lines={5} /></div>;

  const grouped = { todo: [], in_progress: [], done: [], cancelled: [] };
  tasks.forEach(t => (grouped[t.status] || grouped.todo).push(t));

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">משימות</h1>
        <Button onClick={() => { setFormData({ status: "todo", priority: "medium" }); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-2" /> משימה חדשה
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={ClipboardList} title="אין משימות" description="צור משימה חדשה להתחיל" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {['todo', 'in_progress', 'done'].map(status => (
            <div key={status}>
              <h3 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2">
                {statusLabels[status]}
                <span className="text-[10px] bg-[#142e38] px-2 py-0.5 rounded-full">{grouped[status].length}</span>
              </h3>
              <div className="space-y-2">
                {grouped[status].map((task, i) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="gesi-card p-3"
                  >
                    <div className="flex items-start gap-2">
                      <button onClick={() => toggleDone.mutate(task)} className="mt-0.5 flex-shrink-0">
                        <CheckCircle2 className={`w-4 h-4 ${task.status === 'done' ? 'text-[#2dd4a8]' : 'text-gray-600 hover:text-gray-400'} transition-colors`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] ${priorityColors[task.priority]}`}>{priorityLabels[task.priority]}</span>
                          {task.due_date && <span className="text-[10px] text-gray-600">{new Date(task.due_date).toLocaleDateString('he-IL')}</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal open={showForm} onClose={setShowForm} title="משימה חדשה" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}