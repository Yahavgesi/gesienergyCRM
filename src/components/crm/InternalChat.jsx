import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import moment from "moment";

export default function InternalChat({ entityType, entityId }) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ['internal-notes', entityType, entityId],
    queryFn: async () => {
      const activities = await base44.entities.ActivityLog.filter({
        entity_type: entityType,
        entity_id: entityId,
        action_type: 'note_added',
      }, '-created_date');
      return activities;
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content) => {
      const user = await base44.auth.me();
      return base44.entities.ActivityLog.create({
        entity_type: entityType,
        entity_id: entityId,
        action_type: 'note_added',
        actor_email: user.email,
        actor_name: user.full_name || user.email,
        description: content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['internal-notes', entityType, entityId]);
      setMessage("");
    },
  });

  return (
    <div className="gesi-card p-6 h-[600px] flex flex-col">
      <h3 className="text-lg font-semibold text-white mb-4">צ'אט פנימי / הערות</h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {notes.map(note => (
          <div key={note.id} className="bg-[#142e38] rounded-lg p-3">
            <p className="text-sm text-white">{note.description}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span className="font-medium text-[#2dd4a8]">{note.actor_name}</span>
              <span>•</span>
              <span>{moment(note.created_date).format('DD/MM/YY HH:mm')}</span>
            </div>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-center text-gray-500 py-8">אין הערות עדיין</p>
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="הוסף הערה פנימית..."
          className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white resize-none"
          rows={2}
        />
        <Button
          onClick={() => addNoteMutation.mutate(message)}
          disabled={!message.trim() || addNoteMutation.isPending}
          className="bg-[#2dd4a8] hover:bg-[#1fa882]"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}