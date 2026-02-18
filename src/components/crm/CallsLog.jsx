import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Phone } from "lucide-react";
import moment from "moment";

export default function CallsLog({ entityType, entityId }) {
  const [showForm, setShowForm] = useState(false);
  const [callData, setCallData] = useState({ summary: '', outcome: '', follow_up_date: '' });
  const queryClient = useQueryClient();

  const { data: calls = [] } = useQuery({
    queryKey: ['calls', entityType, entityId],
    queryFn: async () => {
      const activities = await base44.entities.ActivityLog.filter({
        entity_type: entityType,
        entity_id: entityId,
      }, '-created_date');
      return activities.filter(a => a.description?.includes('שיחה') || a.action_type === 'note_added');
    },
  });

  const logCallMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.ActivityLog.create({
        entity_type: entityType,
        entity_id: entityId,
        action_type: 'note_added',
        actor_email: user.email,
        actor_name: user.full_name || user.email,
        description: `📞 שיחה: ${data.summary}${data.outcome ? ` | תוצאה: ${data.outcome}` : ''}${data.follow_up_date ? ` | מעקב: ${moment(data.follow_up_date).format('DD/MM/YY')}` : ''}`,
        metadata: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calls', entityType, entityId]);
      setShowForm(false);
      setCallData({ summary: '', outcome: '', follow_up_date: '' });
    },
  });

  return (
    <div className="gesi-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">לוג שיחות</h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-[#2dd4a8] hover:bg-[#1fa882]">
          <Plus className="w-4 h-4 ml-1" />
          רשום שיחה
        </Button>
      </div>

      {showForm && (
        <div className="bg-[#142e38] rounded-lg p-4 mb-4 space-y-3">
          <Textarea
            placeholder="סיכום השיחה..."
            value={callData.summary}
            onChange={(e) => setCallData({...callData, summary: e.target.value})}
            className="bg-[#0a1a1f] border-[rgba(45,212,168,0.1)] text-white"
            rows={3}
          />
          <Input
            placeholder="תוצאה / פעולה (אופציונלי)"
            value={callData.outcome}
            onChange={(e) => setCallData({...callData, outcome: e.target.value})}
            className="bg-[#0a1a1f] border-[rgba(45,212,168,0.1)] text-white"
          />
          <Input
            type="date"
            placeholder="תאריך מעקב"
            value={callData.follow_up_date}
            onChange={(e) => setCallData({...callData, follow_up_date: e.target.value})}
            className="bg-[#0a1a1f] border-[rgba(45,212,168,0.1)] text-white"
          />
          <div className="flex gap-2">
            <Button onClick={() => logCallMutation.mutate(callData)} disabled={!callData.summary} className="bg-[#2dd4a8] hover:bg-[#1fa882]">
              שמור
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-gray-600">ביטול</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {calls.slice(0, 10).map(call => (
          <div key={call.id} className="flex gap-3 bg-[#142e38] rounded-lg p-3">
            <Phone className="w-5 h-5 text-[#2dd4a8] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-white">{call.description}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{call.actor_name}</span>
                <span>•</span>
                <span>{moment(call.created_date).format('DD/MM/YY HH:mm')}</span>
              </div>
            </div>
          </div>
        ))}
        {calls.length === 0 && <p className="text-center text-gray-500 py-8">אין שיחות מתועדות</p>}
      </div>
    </div>
  );
}