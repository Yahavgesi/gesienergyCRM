import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, DollarSign, CheckCircle2, Clock, Trash2, AlertTriangle, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

// Default milestone structure
const DEFAULT_MILESTONES = [
  { key: 'deposit',     label: 'מקדמה',                          color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  { key: 'equipment',   label: 'פריקת ציוד ותחילת עבודה',        color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { key: 'completion',  label: 'מוכנות מתקן וסיום העבודות',      color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  { key: 'grid',        label: 'חיבור לרשת',                     color: 'text-[#2dd4a8]',  bg: 'bg-[#2dd4a8]/10' },
];

function calcMilestones(project) {
  const total = project.total_price || 0;
  const deposit = project.milestone_deposit ?? 5000;
  const pctEquipment = project.milestone_pct_equipment ?? 70;
  const pctCompletion = project.milestone_pct_completion ?? 25;
  const pctGrid = project.milestone_pct_grid ?? 5;
  const remaining = Math.max(0, total - deposit);
  return [
    { key: 'deposit',    label: 'מקדמה',                     amount: deposit,                                   fixed: true },
    { key: 'equipment',  label: 'פריקת ציוד ותחילת עבודה',   amount: Math.round(remaining * pctEquipment / 100) },
    { key: 'completion', label: 'מוכנות מתקן וסיום העבודות', amount: Math.round(remaining * pctCompletion / 100) },
    { key: 'grid',       label: 'חיבור לרשת',                amount: Math.round(remaining * pctGrid / 100) },
  ];
}

export default function MilestonesPanel({ project }) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form, setForm] = useState({ key: 'deposit', amount: '', description: '' });
  const [settings, setSettings] = useState({
    milestone_deposit: project.milestone_deposit ?? 5000,
    milestone_pct_equipment: project.milestone_pct_equipment ?? 70,
    milestone_pct_completion: project.milestone_pct_completion ?? 25,
    milestone_pct_grid: project.milestone_pct_grid ?? 5,
  });
  const queryClient = useQueryClient();

  const { data: payments = [] } = useQuery({
    queryKey: ['milestone-payments', project.id],
    queryFn: () => base44.entities.Payment.filter({ project_id: project.id }),
    enabled: !!project.id,
  });

  const milestones = calcMilestones(project);
  const totalProject = project.total_price || 0;
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
  const collectionRate = totalProject > 0 ? ((totalPaid / totalProject) * 100).toFixed(0) : 0;
  const pctSum = settings.milestone_pct_equipment + settings.milestone_pct_completion + settings.milestone_pct_grid;

  const createMilestone = useMutation({
    mutationFn: async (data) => {
      const meta = DEFAULT_MILESTONES.find(m => m.key === data.key);
      return base44.entities.Payment.create({
        project_id: project.id,
        customer_email: project.customer_email,
        customer_id: project.customer_id,
        amount: parseFloat(data.amount),
        type: 'milestone',
        milestone_type: data.key,
        description: data.description || meta?.label || data.key,
        status: 'pending',
        currency: 'ILS',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] });
      setOpen(false);
      setForm({ key: 'deposit', amount: '', description: '' });
      toast.success('תשלום נוצר בהצלחה');
    },
  });

  const markPaid = useMutation({
    mutationFn: ({ id }) => base44.entities.Payment.update(id, { status: 'completed', paid_date: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] }); toast.success('סומן כשולם'); },
  });

  const deleteMilestone = useMutation({
    mutationFn: (id) => base44.entities.Payment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] }),
  });

  const saveSettings = useMutation({
    mutationFn: (data) => base44.entities.Project.update(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['crm-projects'] });
      setSettingsOpen(false);
      toast.success('חלוקת אבני הדרך עודכנה');
    },
  });

  const handleAutoGenerate = async () => {
    if (!totalProject) { toast.error('הגדר מחיר כולל לפרויקט תחילה'); return; }
    for (const m of milestones) {
      if (m.amount > 0) {
        await base44.entities.Payment.create({
          project_id: project.id,
          customer_email: project.customer_email,
          customer_id: project.customer_id,
          amount: m.amount,
          type: 'milestone',
          milestone_type: m.key,
          description: m.label,
          status: 'pending',
          currency: 'ILS',
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] });
    toast.success('אבני דרך נוצרו אוטומטית');
  };

  const selectedMeta = DEFAULT_MILESTONES.find(m => m.key === form.key);
  const suggestedAmount = milestones.find(m => m.key === form.key)?.amount || 0;

  return (
    <div className="p-4 lg:p-6 space-y-5" dir="rtl">

      {/* Milestone breakdown preview */}
      {totalProject > 0 && (
        <div className="gesi-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">חלוקת הכנסות מתוכננת</h3>
            <button onClick={() => setSettingsOpen(true)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#2dd4a8] transition-colors">
              <Settings className="w-3.5 h-3.5" /> ערוך חלוקה
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {milestones.map(m => {
              const meta = DEFAULT_MILESTONES.find(d => d.key === m.key);
              return (
                <div key={m.key} className={`rounded-xl p-3 ${meta?.bg}`}>
                  <p className={`text-xs font-medium ${meta?.color} mb-1`}>{m.label}</p>
                  <p className="text-base font-bold text-white">₪{m.amount.toLocaleString()}</p>
                  {!m.fixed && totalProject > 0 && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {((m.amount / totalProject) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'שווי פרויקט', val: `₪${totalProject.toLocaleString()}`, color: 'text-white' },
          { label: 'שולם', val: `₪${totalPaid.toLocaleString()}`, color: 'text-[#2dd4a8]' },
          { label: 'ממתין לגבייה', val: `₪${totalPending.toLocaleString()}`, color: 'text-amber-400' },
          { label: 'אחוז גבייה', val: `${collectionRate}%`, color: Number(collectionRate) >= 80 ? 'text-[#2dd4a8]' : 'text-amber-400' },
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
              style={{ width: `${Math.min(100, Number(collectionRate))}%` }} />
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
          <Plus className="w-4 h-4 ml-1" /> הוסף תשלום
        </Button>
        {payments.length === 0 && totalProject > 0 && (
          <Button onClick={handleAutoGenerate} variant="outline" size="sm" className="border-[#2dd4a8]/30 text-[#2dd4a8] hover:bg-[#2dd4a8]/10">
            ✨ יצור אוטומטי לפי חלוקה
          </Button>
        )}
      </div>

      {/* Payments List */}
      <div className="space-y-3">
        {payments.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">אין תשלומים להצגה</p>
            <p className="text-xs mt-1">צור תשלומים ידנית או בלחיצה על "יצור אוטומטי"</p>
          </div>
        )}
        {payments.map(p => {
          const meta = DEFAULT_MILESTONES.find(m => m.key === p.milestone_type) || DEFAULT_MILESTONES[0];
          const pct = totalProject > 0 ? ((p.amount / totalProject) * 100).toFixed(0) : '—';
          return (
            <div key={p.id} className={`gesi-card p-4 border ${p.status === 'completed' ? 'border-[#2dd4a8]/20' : 'border-[rgba(45,212,168,0.08)]'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                  {p.status === 'completed'
                    ? <CheckCircle2 className="w-5 h-5 text-[#2dd4a8]" />
                    : <Clock className={`w-5 h-5 ${meta.color}`} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{p.description || meta.label}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="font-bold text-white">₪{(p.amount || 0).toLocaleString()}</span>
                    {totalProject > 0 && <span>({pct}%)</span>}
                    {p.paid_date && <span>שולם: {new Date(p.paid_date).toLocaleDateString('he-IL')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    p.status === 'completed' ? 'bg-[#2dd4a8]/10 text-[#2dd4a8]' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {p.status === 'completed' ? 'שולם' : 'ממתין'}
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

      {totalProject === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>הגדר מחיר ל-kWp וגודל מערכת כדי לחשב הכנסות אוטומטית</span>
        </div>
      )}

      {/* Add Payment Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף תשלום</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-gray-400">סוג תשלום</Label>
              <select value={form.key} onChange={e => {
                const suggested = milestones.find(m => m.key === e.target.value)?.amount || 0;
                setForm(f => ({ ...f, key: e.target.value, amount: suggested ? suggested.toString() : f.amount }));
              }} className="w-full mt-1 bg-[#142e38] border border-[rgba(45,212,168,0.1)] rounded-lg px-3 py-2 text-sm text-white">
                {DEFAULT_MILESTONES.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">סכום (₪)</Label>
              <Input value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} type="number"
                placeholder={suggestedAmount ? `מוצע: ₪${suggestedAmount.toLocaleString()}` : '0'}
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
              {createMilestone.isPending ? 'יוצר...' : 'צור תשלום'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-gray-600 text-gray-300">ביטול</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת חלוקת הכנסות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-gray-400">מקדמה קבועה (₪)</Label>
              <Input type="number" value={settings.milestone_deposit}
                onChange={e => setSettings(s => ({...s, milestone_deposit: parseFloat(e.target.value) || 0}))}
                className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">פריקת ציוד ותחילת עבודה (%)</Label>
              <Input type="number" value={settings.milestone_pct_equipment}
                onChange={e => setSettings(s => ({...s, milestone_pct_equipment: parseFloat(e.target.value) || 0}))}
                className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">מוכנות מתקן וסיום עבודות (%)</Label>
              <Input type="number" value={settings.milestone_pct_completion}
                onChange={e => setSettings(s => ({...s, milestone_pct_completion: parseFloat(e.target.value) || 0}))}
                className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">חיבור לרשת (%)</Label>
              <Input type="number" value={settings.milestone_pct_grid}
                onChange={e => setSettings(s => ({...s, milestone_pct_grid: parseFloat(e.target.value) || 0}))}
                className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white" />
            </div>
            {pctSum !== 100 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>סכום האחוזים הוא {pctSum}% (צריך להיות 100%)</span>
              </div>
            )}
            {totalProject > 0 && (
              <div className="rounded-xl bg-[#142e38]/60 p-3 space-y-2 text-xs">
                <p className="text-gray-400 font-medium">תצוגה מקדימה (מחיר פרויקט: ₪{totalProject.toLocaleString()}):</p>
                {(() => {
                  const rem = Math.max(0, totalProject - settings.milestone_deposit);
                  return [
                    { label: 'מקדמה', amount: settings.milestone_deposit },
                    { label: 'פריקת ציוד', amount: Math.round(rem * settings.milestone_pct_equipment / 100) },
                    { label: 'סיום עבודות', amount: Math.round(rem * settings.milestone_pct_completion / 100) },
                    { label: 'חיבור לרשת', amount: Math.round(rem * settings.milestone_pct_grid / 100) },
                  ].map(m => (
                    <div key={m.label} className="flex justify-between">
                      <span className="text-gray-400">{m.label}</span>
                      <span className="text-white font-semibold">₪{m.amount.toLocaleString()}</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => saveSettings.mutate(settings)} disabled={saveSettings.isPending}
              className="flex-1" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
              {saveSettings.isPending ? 'שומר...' : 'שמור'}
            </Button>
            <Button variant="outline" onClick={() => setSettingsOpen(false)} className="border-gray-600 text-gray-300">ביטול</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}