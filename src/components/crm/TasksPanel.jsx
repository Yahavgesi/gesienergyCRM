import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";
import moment from "moment";

export default function TasksPanel({ entityType, entityId }) {
  const [showForm, setShowForm] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', due_date: '', priority: 'medium' });
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', entityType, entityId],
    queryFn: async () => {
      // Filter tasks by metadata matching entity
      const allTasks = await base44.entities.Task.list('-created_date');
      return allTasks.filter(t => 
        t.project_id === entityId || 
        (t.description && t.description.includes(entityId))
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.Task.create({
        ...data,
        assigned_to: user.email,
        project_id: entityType === 'project' ? entityId : undefined,
        description: `${data.description}\n[${entityType}:${entityId}]`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', entityType, entityId]);
      setShowForm(false);
      setTaskData({ title: '', description: '', due_date: '', priority: 'medium' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Task.update(id, { status: status === 'done' ? 'todo' : 'done' }),
    onSuccess: () => queryClient.invalidateQueries(['tasks', entityType, entityId]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['tasks', entityType, entityId]),
  });

  return (
    <div className="gesi-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">משימות</h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-[#2dd4a8] hover:bg-[#1fa882]">
          <Plus className="w-4 h-4 ml-1" />
          משימה חדשה
        </Button>
      </div>

      {showForm && (
        <div className="bg-[#142e38] rounded-lg p-4 mb-4 space-y-3">
          <Input
            placeholder="כותרת משימה"
            value={taskData.title}
            onChange={(e) => setTaskData({...taskData, title: e.target.value})}
            className="bg-[#0a1a1f] border-[rgba(45,212,168,0.1)] text-white"
          />
          <Textarea
            placeholder="תיאור (אופציונלי)"
            value={taskData.description}
            onChange={(e) => setTaskData({...taskData, description: e.target.value})}
            className="bg-[#0a1a1f] border-[rgba(45,212,168,0.1)] text-white"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={taskData.due_date}
              onChange={(e) => setTaskData({...taskData, due_date: e.target.value})}
              className="bg-[#0a1a1f] border-[rgba(45,212,168,0.1)] text-white"
            />
            <Select value={taskData.priority} onValueChange={(v) => setTaskData({...taskData, priority: v})}>
              <SelectTrigger className="bg-[#0a1a1f] border-[rgba(45,212,168,0.1)] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#142e38]">
                <SelectItem value="low">נמוכה</SelectItem>
                <SelectItem value="medium">בינונית</SelectItem>
                <SelectItem value="high">גבוהה</SelectItem>
                <SelectItem value="urgent">דחופה</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => createMutation.mutate(taskData)} disabled={!taskData.title} className="bg-[#2dd4a8] hover:bg-[#1fa882]">
              צור משימה
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-gray-600">ביטול</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 bg-[#142e38] rounded-lg p-3">
            <button onClick={() => toggleMutation.mutate({ id: task.id, status: task.status })}>
              {task.status === 'done' ? 
                <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                <Circle className="w-5 h-5 text-gray-500" />
              }
            </button>
            <div className="flex-1">
              <p className={`text-sm text-white ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
              {task.due_date && (
                <p className="text-xs text-gray-500 mt-1">{moment(task.due_date).format('DD/MM/YY')}</p>
              )}
            </div>
            <button onClick={() => deleteMutation.mutate(task.id)} className="text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-center text-gray-500 py-8">אין משימות</p>}
      </div>
    </div>
  );
}