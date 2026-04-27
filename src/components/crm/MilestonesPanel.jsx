import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, DollarSign, CheckCircle2, Clock, Trash2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const MILESTONE_TYPES = [
  { value: 'deposit', label: 'מקדמה', pct: 10, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { value: 'equipment_delivery', label: 'אספקת ציוד', pct: 30, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { value: 'system_completion', label: 'סיום התקנה', pct: 50, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { value: 'grid_connection', label: 'חיבור לרשת', pct: 10, color: 'text-[#2dd4a8]', bg: 'bg-[#2dd4a8]/10' },
];

export default function MilestonesPanel({ project }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'deposit', amount: '', description: '' });
  const queryClient = useQueryClient();

  const { data: payments = [] } = useQuery({
    queryKey: ['milestone-payments', project.id],
    queryFn: () => base44.entities.Payment.filter({ project_id: project.id }),
    enabled: !!project.id,
  });

  const createMilestone = useMutation({
    mutationFn: async (data) => {
      const payment = await base44.entities.Payment.create({
        project_id: project.id,
        customer_email: project.customer_email,
        customer_id: project.customer_id,
        amount: parseFloat(data.amount),
        type: 'milestone',
        milestone_type: data.type,
        description: data.description || MILESTONE_TYPES.find(m => m.value === data.type)?.label,
        status: 'pending',
        currency: 'ILS',
      });
      await base44.entities.ActivityLog.create({
        entity_type: 'project', entity_id: project.id,
        action_type: 'payment_requested',
        description: `אבן דרך נוצרה: ${MILESTONE_TYPES.find(m => m.value === data.type)?.label} - ₪${data.amount}`,
      });
      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setOpen(false);
      setForm({ type: 'deposit', amount: '', description: '' });
      toast.success('אבן דרך נוצרה בהצלחה');
    },
  });

  const markPaid = useMutation({
    mutationFn: ({ id }) => base44.entities.Payment.update(id, { status: 'completed', paid_date: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] });
      toast.success('תשלום סומן כשולם');
    },
  });

  const deleteMilestone = useMutation({
    mutationFn: (id) => base44.entities.Payment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] }),
  });

  const totalProject = project.total_price || 0;
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
  const collectionRate = totalProject > 0 ? ((totalPaid / totalProject) * 100).toFixed(0) : 0;

  const handleAutoGenerate = async () => {
    if (!totalProject) { toast.error('הגדר מחיר כולל לפרויקט תחילה'); return; }
    const toCreate = MILESTONE_TYPES.map(m => ({
      project_id: project.id,
      customer_email: project.customer_email,
      customer_id: project.customer_id,
      amount: Math.round(totalProject * m.pct / 100),
      type: 'milestone',
      milestone_type: m.value,
      description: m.label,
      status: 'pending',
      currency: 'ILS',
    }));
    for (const p of toCreate) await base44.entities.Payment.create(p);
    queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] });
    toast.success('אבני דרך נוצרו אוטומטית לפי 10/30/50/10%');
  };

  return (
    <div className="p-4 lg:p-6 space-y-5" dir="rtl">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'שווי פרויקט', val: `₪${totalProject.toLocaleString()}`, color: 'text-white' },
          { label: 'שולם', val: `₪${totalPaid.toLocaleString()}`, color: 'text-[#2dd4a8]' },
          { label: 'ממתין לגבייה', val: `₪${totalPending.toLocaleString()}`, color: 'text-amber-400' },
          { label: 'אחוז גבייה', val: `${collectionRate}%`, color: collectionRate >= 80 ? 'text-[#2dd4a8]' : 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="gesi-card p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {totalProject > 0 && (
        <div className="gesi-card p-4">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>התקדמות גבייה</span>
            <span className="text-[#2dd4a8] font-bold">{collectionRate}%</span>
          </div>
          <div className="h-3 bg-[#142e38] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#2dd4a8] to-[#1fa882] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, collectionRate)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>₪{totalPaid.toLocaleString()} שולם</span>
            <span>₪{(totalProject - totalPaid).toLocaleString()} נותר</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpen(true)} size="sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-1" /> אבן דרך חדשה
        </Button>
        {payments.length === 0 && totalProject > 0 && (
          <Button onClick={handleAutoGenerate} variant="outline" size="sm" className="border-[#2dd4a8]/30 text-[#2dd4a8] hover:bg-[#2dd4a8]/10">
            ✨ יצור אוטומטי (10/30/50/10%)
          </Button>
        )}
      </div>

      {/* Milestones List */}
      <div className="space-y-3">
        {payments.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">אין אבני דרך להצגה</p>
            <p className="text-xs mt-1">צור אבני דרך ידנית או בלחיצה על "יצור אוטומטי"</p>
          </div>
        )}
        {payments.map(p => {
          const meta = MILESTONE_TYPES.find(m => m.value === p.milestone_type);
          const pct = totalProject > 0 ? ((p.amount / totalProject) * 100).toFixed(0) : '—';
          return (
            <div key={p.id} className={`gesi-card p-4 border ${p.status === 'completed' ? 'border-[#2dd4a8]/20' : p.status === 'failed' ? 'border-red-500/20' : 'border-[rgba(45,212,168,0.08)]'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta?.bg || 'bg-gray-500/10'}`}>
                  {p.status === 'completed'
                    ? <CheckCircle2 className="w-5 h-5 text-[#2dd4a8]" />
                    : <Clock className={`w-5 h-5 ${meta?.color || 'text-gray-400'}`} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{p.description || meta?.label || 'תשלום'}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${meta?.bg || 'bg-gray-500/10'} ${meta?.color || 'text-gray-400'}`}>
                      {meta?.label || p.milestone_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="font-bold text-white">₪{(p.amount || 0).toLocaleString()}</span>
                    {totalProject > 0 && <span>({pct}% מהפרויקט)</span>}
                    {p.paid_date && <span>שולם: {new Date(p.paid_date).toLocaleDateString('he-IL')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    p.status === 'completed' ? 'bg-[#2dd4a8]/10 text-[#2dd4a8]' :
                    p.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {p.status === 'completed' ? 'שולם' : p.status === 'failed' ? 'נכשל' : 'ממתין'}
                  </span>
                  {p.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => markPaid.mutate({ id: p.id })}
                      className="border-[#2dd4a8]/30 text-[#2dd4a8] hover:bg-[#2dd4a8]/10 h-7 text-xs px-2">
                      סמן שולם
                    </Button>
                  )}
                  <button onClick={() => deleteMilestone.mutate(p.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-generation info */}
      {totalProject === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>הגדר מחיר כולל לפרויקט כדי להפעיל יצירה אוטומטית לפי אחוזים</span>
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>אבן דרך חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-gray-400">סוג</Label>
              <select value={form.type} onChange={e => {
                const mt = MILESTONE_TYPES.find(m => m.value === e.target.value);
                setForm(f => ({ ...f, type: e.target.value, amount: totalProject ? Math.round(totalProject * (mt?.pct || 0) / 100).toString() : f.amount }));
              }} className="w-full mt-1 bg-[#142e38] border border-[rgba(45,212,168,0.1)] rounded-lg px-3 py-2 text-sm text-white">
                {MILESTONE_TYPES.map(m => <option key={m.value} value={m.value}>{m.label} ({m.pct}%)</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">סכום (₪)</Label>
              <Input value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} type="number"
                placeholder={totalProject ? `${Math.round(totalProject * (MILESTONE_TYPES.find(m=>m.value===form.type)?.pct||0)/100)}` : '0'}
                className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white" />
              {totalProject > 0 && form.amount && (
                <p className="text-[10px] text-gray-500 mt-1">{((parseFloat(form.amount)/totalProject)*100).toFixed(1)}% מהפרויקט</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-gray-400">תיאור (אופציונלי)</Label>
              <Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                placeholder="תיאור נוסף..." className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => createMilestone.mutate(form)} disabled={!form.amount || createMilestone.isPending}
              className="flex-1" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
              {createMilestone.isPending ? 'יוצר...' : 'צור אבן דרך'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-gray-600 text-gray-300">ביטול</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}