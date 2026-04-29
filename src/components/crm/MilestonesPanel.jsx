import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign, CheckCircle2, Clock, Trash2, AlertTriangle,
  Settings, MessageSquare, TrendingUp, ChevronDown, ChevronUp, Edit2, Check, X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const MILESTONE_DEFS = [
  { key: 'deposit',    label: 'מקדמה',                          color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20' },
  { key: 'equipment',  label: 'פריקת ציוד ותחילת עבודה',        color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  { key: 'completion', label: 'מוכנות מתקן וסיום העבודות',      color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20' },
  { key: 'grid',       label: 'חיבור לרשת',                     color: 'text-[#2dd4a8]',  bg: 'bg-[#2dd4a8]/10',  border: 'border-[#2dd4a8]/20' },
];

function calcMilestones(project) {
  const total = project.total_price || 0;
  const deposit = project.milestone_deposit ?? 5000;
  const pctEquipment = project.milestone_pct_equipment ?? 70;
  const pctCompletion = project.milestone_pct_completion ?? 25;
  const pctGrid = project.milestone_pct_grid ?? 5;
  const remaining = Math.max(0, total - deposit);
  return [
    { key: 'deposit',    amount: deposit,                                    fixed: true },
    { key: 'equipment',  amount: Math.round(remaining * pctEquipment / 100) },
    { key: 'completion', amount: Math.round(remaining * pctCompletion / 100) },
    { key: 'grid',       amount: Math.round(remaining * pctGrid / 100) },
  ];
}

export default function MilestonesPanel({ project }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedNote, setExpandedNote] = useState(null);
  const [noteText, setNoteText] = useState({});
  const [editingNote, setEditingNote] = useState(null);
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
  const collectionRate = totalProject > 0 ? Math.min(100, (totalPaid / totalProject) * 100) : 0;
  const pctSum = settings.milestone_pct_equipment + settings.milestone_pct_completion + settings.milestone_pct_grid;

  const markPaid = useMutation({
    mutationFn: ({ id }) => base44.entities.Payment.update(id, { status: 'completed', paid_date: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] }); toast.success('סומן כשולם ✓'); },
  });

  const markPending = useMutation({
    mutationFn: ({ id }) => base44.entities.Payment.update(id, { status: 'pending', paid_date: null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] }),
  });

  const updateNote = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.Payment.update(id, { description: notes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] }); setEditingNote(null); toast.success('הערה נשמרה'); },
  });

  const deletePayment = useMutation({
    mutationFn: (id) => base44.entities.Payment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] }),
  });

  const saveSettings = useMutation({
    mutationFn: (data) => base44.entities.Project.update(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      setSettingsOpen(false);
      toast.success('חלוקת הכנסות עודכנה');
    },
  });

  const handleAutoGenerate = async () => {
    if (!totalProject) { toast.error('הגדר מחיר כולל לפרויקט תחילה'); return; }
    for (const m of milestones) {
      if (m.amount > 0) {
        const def = MILESTONE_DEFS.find(d => d.key === m.key);
        await base44.entities.Payment.create({
          project_id: project.id,
          customer_email: project.customer_email,
          customer_id: project.customer_id,
          amount: m.amount,
          type: 'milestone',
          milestone_type: m.key,
          description: def?.label || m.key,
          status: 'pending',
          currency: 'ILS',
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['milestone-payments', project.id] });
    toast.success('אבני דרך נוצרו אוטומטית ✨');
  };

  // Group payments by milestone_type
  const paymentsByType = MILESTONE_DEFS.reduce((acc, def) => {
    acc[def.key] = payments.filter(p => p.milestone_type === def.key);
    return acc;
  }, {});
  const ungrouped = payments.filter(p => !MILESTONE_DEFS.find(d => d.key === p.milestone_type));

  return (
    <div className="p-4 lg:p-6 space-y-5" dir="rtl">

      {/* Header KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'שווי פרויקט', val: `₪${totalProject.toLocaleString()}`, color: 'text-white', icon: TrendingUp, iconColor: 'text-gray-400' },
          { label: 'שולם', val: `₪${totalPaid.toLocaleString()}`, color: 'text-[#2dd4a8]', icon: CheckCircle2, iconColor: 'text-[#2dd4a8]' },
          { label: 'ממתין לגבייה', val: `₪${totalPending.toLocaleString()}`, color: 'text-amber-400', icon: Clock, iconColor: 'text-amber-400' },
          { label: 'אחוז גבייה', val: `${collectionRate.toFixed(0)}%`, color: collectionRate >= 80 ? 'text-[#2dd4a8]' : 'text-amber-400', icon: DollarSign, iconColor: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.08)] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0a1a1f]/60 flex items-center justify-center flex-shrink-0">
              <s.icon className={`w-4 h-4 ${s.iconColor}`} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 mb-0.5">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Collection Progress */}
      {totalProject > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.08)] p-4">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>התקדמות גבייה</span>
            <span className="text-[#2dd4a8] font-bold">{collectionRate.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-[#0a1a1f] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#2dd4a8] to-[#1fa882] rounded-full transition-all duration-700"
              style={{ width: `${collectionRate}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1.5">
            <span>₪{totalPaid.toLocaleString()} שולם</span>
            <span>₪{(totalProject - totalPaid).toLocaleString()} נותר</span>
          </div>
        </div>
      )}

      {/* No price warning */}
      {totalProject === 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">מחיר הפרויקט לא הוגדר</p>
            <p className="text-xs mt-0.5 text-amber-400/70">הגדר גודל מערכת ומחיר ל-kWp בפרטי הפרויקט כדי לחשב הכנסות אוטומטית</p>
          </div>
        </div>
      )}

      {/* Planned milestones (when no payments yet) */}
      {payments.length === 0 && totalProject > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.08)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">חלוקת הכנסות מתוכננת</h3>
              <p className="text-xs text-gray-500 mt-0.5">לפי הגדרות הפרויקט</p>
            </div>
            <button onClick={() => setSettingsOpen(true)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#2dd4a8] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#2dd4a8]/10">
              <Settings className="w-3.5 h-3.5" /> ערוך חלוקה
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {milestones.map(m => {
              const def = MILESTONE_DEFS.find(d => d.key === m.key);
              return (
                <div key={m.key} className={`rounded-xl p-3 ${def?.bg} border ${def?.border}`}>
                  <p className={`text-xs font-medium ${def?.color} mb-1.5`}>{def?.label}</p>
                  <p className="text-xl font-bold text-white">₪{m.amount.toLocaleString()}</p>
                  {!m.fixed && totalProject > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1">{((m.amount / totalProject) * 100).toFixed(0)}% מהפרויקט</p>
                  )}
                  {m.fixed && <p className="text-[10px] text-gray-500 mt-1">סכום קבוע</p>}
                </div>
              );
            })}
          </div>
          <Button onClick={handleAutoGenerate} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }} className="w-full text-white">
            ✨ צור אבני דרך אוטומטית
          </Button>
        </div>
      )}

      {/* Existing payments grouped by milestone */}
      {payments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">מעקב תשלומים</h3>
            <button onClick={() => setSettingsOpen(true)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#2dd4a8] transition-colors">
              <Settings className="w-3.5 h-3.5" /> ערוך חלוקה
            </button>
          </div>

          {MILESTONE_DEFS.map(def => {
            const typePayments = paymentsByType[def.key] || [];
            const typePlanned = milestones.find(m => m.key === def.key)?.amount || 0;
            const typePaid = typePayments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);

            return (
              <div key={def.key} className={`rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border ${def.border} overflow-hidden`}>
                {/* Milestone Header */}
                <div className={`px-5 py-3.5 flex items-center justify-between ${def.bg}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${def.bg} border ${def.border} flex items-center justify-center`}>
                      {typePaid > 0 && typePaid >= typePlanned
                        ? <CheckCircle2 className={`w-4 h-4 ${def.color}`} />
                        : <Clock className={`w-4 h-4 ${def.color}`} />
                      }
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${def.color}`}>{def.label}</p>
                      {typePlanned > 0 && <p className="text-[10px] text-gray-500">מתוכנן: ₪{typePlanned.toLocaleString()}</p>}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`text-base font-bold ${def.color}`}>₪{typePaid.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">שולם</p>
                  </div>
                </div>

                {/* Payment rows */}
                {typePayments.length > 0 && (
                  <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                    {typePayments.map(p => (
                      <div key={p.id} className="px-5 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">₪{(p.amount || 0).toLocaleString()}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                p.status === 'completed' ? 'bg-[#2dd4a8]/15 text-[#2dd4a8]' : 'bg-amber-500/15 text-amber-400'
                              }`}>
                                {p.status === 'completed' ? `שולם ${p.paid_date ? '· ' + new Date(p.paid_date).toLocaleDateString('he-IL') : ''}` : 'ממתין'}
                              </span>
                            </div>

                            {/* Note display / edit */}
                            {editingNote === p.id ? (
                              <div className="mt-2 space-y-1.5">
                                <Textarea
                                  value={noteText[p.id] ?? (p.description || '')}
                                  onChange={e => setNoteText(n => ({...n, [p.id]: e.target.value}))}
                                  placeholder="הוסף הערה..."
                                  className="bg-[#0a1a1f] border-[rgba(45,212,168,0.2)] text-white text-xs min-h-[60px]"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => updateNote.mutate({ id: p.id, notes: noteText[p.id] ?? p.description })}
                                    className="h-6 text-[10px] px-2 bg-[#2dd4a8] hover:bg-[#1fa882] text-white">
                                    <Check className="w-3 h-3 ml-1" /> שמור
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingNote(null)} className="h-6 text-[10px] px-2 text-gray-400">
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-1 mt-1">
                                {p.description && p.description !== def.label ? (
                                  <p className="text-xs text-gray-400 flex-1">{p.description}</p>
                                ) : (
                                  <p className="text-xs text-gray-600 italic flex-1">אין הערה</p>
                                )}
                                <button onClick={() => { setEditingNote(p.id); setNoteText(n => ({...n, [p.id]: p.description || ''})); }}
                                  className="text-gray-600 hover:text-[#2dd4a8] transition-colors flex-shrink-0">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                            {p.status === 'pending' ? (
                              <Button size="sm" onClick={() => markPaid.mutate({ id: p.id })}
                                className="h-7 text-xs px-2.5 bg-[#2dd4a8] hover:bg-[#1fa882] text-white">
                                <CheckCircle2 className="w-3.5 h-3.5 ml-1" /> שולם
                              </Button>
                            ) : (
                              <button onClick={() => markPending.mutate({ id: p.id })}
                                className="text-xs text-gray-600 hover:text-amber-400 transition-colors px-1.5 py-1 rounded">
                                בטל
                              </button>
                            )}
                            <button onClick={() => deletePayment.mutate(p.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {typePayments.length === 0 && (
                  <div className="px-5 py-3 text-xs text-gray-600 italic">לא נוצר תשלום עבור שלב זה</div>
                )}
              </div>
            );
          })}

          {/* Ungrouped */}
          {ungrouped.length > 0 && (
            <div className="rounded-2xl bg-[#0f2229] border border-[rgba(255,255,255,0.06)] p-4 space-y-2">
              <p className="text-xs text-gray-500 font-medium">תשלומים נוספים</p>
              {ungrouped.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-white">₪{(p.amount || 0).toLocaleString()}</span>
                    {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-[#2dd4a8]/15 text-[#2dd4a8]' : 'bg-amber-500/15 text-amber-400'}`}>
                      {p.status === 'completed' ? 'שולם' : 'ממתין'}
                    </span>
                    <button onClick={() => deletePayment.mutate(p.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              <Label className="text-xs text-gray-400">פריקת ציוד ותחילת עבודה (% מהיתרה לאחר מקדמה)</Label>
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
                <span>סכום האחוזים הוא {pctSum}% — צריך להיות 100%</span>
              </div>
            )}
            {/* Live preview */}
            {totalProject > 0 && (
              <div className="rounded-xl bg-[#142e38]/60 p-3 space-y-2 text-xs">
                <p className="text-gray-400 font-medium">תצוגה מקדימה לפרויקט ₪{totalProject.toLocaleString()}:</p>
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
              className="flex-1 text-white" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
              {saveSettings.isPending ? 'שומר...' : 'שמור'}
            </Button>
            <Button variant="outline" onClick={() => setSettingsOpen(false)} className="border-gray-600 text-gray-300">ביטול</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}