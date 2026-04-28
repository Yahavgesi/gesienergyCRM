import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function LeadReminderModal({ open, onClose, lead }) {
  const [data, setData] = useState({
    type: "general",
    title: "",
    note: "",
    reminder_date: "",
    reminder_time: "09:00",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!data.title || !data.reminder_date) {
      toast.error("נא למלא כותרת ותאריך");
      return;
    }
    setSaving(true);
    const user = await base44.auth.me();
    const reminderAt = `${data.reminder_date}T${data.reminder_time}:00`;
    await base44.entities.Task.create({
      title: data.title,
      description: data.note,
      type: data.type,
      due_date: data.reminder_date,
      due_time: data.reminder_time,
      reminder_at: reminderAt,
      status: "todo",
      priority: "medium",
      entity_type: "lead",
      entity_id: lead.id,
      assigned_to: lead.assigned_agent || user.email,
      whatsapp_notify: true,
      notify_phone: lead.phone,
    });
    await base44.entities.ActivityLog.create({
      entity_type: "lead",
      entity_id: lead.id,
      action_type: "note_added",
      description: `תזכורת נוצרה: "${data.title}" ל-${data.reminder_date} ${data.reminder_time}`,
      actor_email: user.email,
      actor_name: user.full_name || user.email,
    });
    setSaving(false);
    toast.success("תזכורת נשמרה");
    onClose();
    setData({ type: "general", title: "", note: "", reminder_date: "", reminder_time: "09:00" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Bell className="w-4 h-4 text-[#2dd4a8]" /> הוסף תזכורת — {lead?.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">סוג תזכורת</Label>
            <Select value={data.type} onValueChange={v => setData(p => ({ ...p, type: v }))}>
              <SelectTrigger className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#142e38] border-[rgba(45,212,168,0.15)]">
                <SelectItem value="general" className="text-gray-300">תזכורת כללית</SelectItem>
                <SelectItem value="task" className="text-gray-300">תזכורת משימה</SelectItem>
                <SelectItem value="followup" className="text-gray-300">מעקב</SelectItem>
                <SelectItem value="call" className="text-gray-300">שיחת טלפון</SelectItem>
                <SelectItem value="meeting" className="text-gray-300">פגישה</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">כותרת התזכורת *</Label>
            <Input
              value={data.title}
              onChange={e => setData(p => ({ ...p, title: e.target.value }))}
              placeholder="לדוגמה: להתקשר להציע מחיר..."
              className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400 mb-1.5 block">תאריך *</Label>
              <Input
                type="date"
                value={data.reminder_date}
                onChange={e => setData(p => ({ ...p, reminder_date: e.target.value }))}
                className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1.5 block">שעה</Label>
              <Input
                type="time"
                value={data.reminder_time}
                onChange={e => setData(p => ({ ...p, reminder_time: e.target.value }))}
                className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-400 mb-1.5 block">הערה (אופציונלי)</Label>
            <Textarea
              value={data.note}
              onChange={e => setData(p => ({ ...p, note: e.target.value }))}
              placeholder="פרטים נוספים..."
              className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 min-h-[70px]"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#142e38]/60 border border-[rgba(45,212,168,0.08)]">
            <Clock className="w-4 h-4 text-[#2dd4a8] flex-shrink-0" />
            <p className="text-xs text-gray-400">
              התזכורת תישלח בוואטסאפ לסוכן <span className="text-white font-medium">{lead?.assigned_agent || "לא משויך"}</span> בתאריך ושעה שנבחרו
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button onClick={handleSave} disabled={saving}
            className="flex-1 text-white" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            {saving ? "שומר..." : "שמור תזכורת"}
          </Button>
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-[#142e38]">
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}