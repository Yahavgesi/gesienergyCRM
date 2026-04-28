import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Paperclip, Send, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function LeadStageDrawer({ stage, leadId, onClose }) {
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const queryClient = useQueryClient();

  const { data: stageNotes = [] } = useQuery({
    queryKey: ["stage-notes", leadId, stage?.value],
    queryFn: () => base44.entities.ActivityLog.filter({ entity_type: "lead", entity_id: leadId }, "-created_date").then(
      all => all.filter(a => a.metadata?.stage === stage?.value)
    ),
    enabled: !!leadId && !!stage,
  });

  const addNote = useMutation({
    mutationFn: async (text) => {
      const user = await base44.auth.me();
      return base44.entities.ActivityLog.create({
        entity_type: "lead",
        entity_id: leadId,
        action_type: "note_added",
        description: text,
        actor_email: user.email,
        actor_name: user.full_name || user.email,
        metadata: { stage: stage.value },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["stage-notes", leadId, stage?.value]);
      queryClient.invalidateQueries(["activities", "lead", leadId]);
      setNote("");
    },
  });

  const uploadFile = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const user = await base44.auth.me();
    await base44.entities.ActivityLog.create({
      entity_type: "lead",
      entity_id: leadId,
      action_type: "file_uploaded",
      description: `קובץ הועלה: ${file.name}`,
      actor_email: user.email,
      actor_name: user.full_name || user.email,
      metadata: { stage: stage.value, file_url, file_name: file.name },
    });
    queryClient.invalidateQueries(["stage-notes", leadId, stage?.value]);
    queryClient.invalidateQueries(["activities", "lead", leadId]);
    setUploading(false);
    toast.success("קובץ הועלה בהצלחה");
  };

  if (!stage) return null;

  const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <motion.div
        initial={{ x: -420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -420, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed top-0 left-0 h-full w-96 z-50 flex flex-col shadow-2xl"
        style={{ background: '#0d1f26', borderRight: '1px solid rgba(45,212,168,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(45,212,168,0.1)' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2dd4a8]" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">שלב</span>
            </div>
            <h3 className="text-white font-bold text-base">{stage.label}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {stageNotes.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">אין הערות עדיין לשלב זה</p>
            </div>
          )}
          {stageNotes.map(n => (
            <div key={n.id} className="rounded-xl bg-[#142e38]/60 p-3">
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-xs font-medium text-white">{n.actor_name || "מערכת"}</span>
                <span className="text-[10px] text-gray-500">
                  {new Date(n.created_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {n.action_type === "file_uploaded" && n.metadata?.file_url ? (
                <div className="mt-1">
                  {isImage(n.metadata.file_url) ? (
                    <img src={n.metadata.file_url} alt={n.metadata.file_name} className="rounded-lg max-h-48 w-full object-cover" />
                  ) : (
                    <a href={n.metadata.file_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-[#2dd4a8] hover:underline">
                      <Paperclip className="w-3.5 h-3.5" />
                      {n.metadata.file_name || "קובץ"}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{n.description}</p>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: 'rgba(45,212,168,0.1)' }}>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="הוסף הערה לשלב זה..."
            className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 min-h-[70px] text-sm resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey && note.trim()) { addNote.mutate(note); } }}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => note.trim() && addNote.mutate(note)}
              disabled={!note.trim() || addNote.isPending}
              className="flex-1 text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}
            >
              <Send className="w-3.5 h-3.5 ml-1.5" /> שלח
            </Button>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.xlsx" className="hidden"
              onChange={e => { if (e.target.files[0]) uploadFile(e.target.files[0]); e.target.value = ""; }} />
            <Button variant="outline" onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="border-gray-600 text-gray-400 hover:text-white hover:bg-[#1a3a47] px-3">
              {uploading ? <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-gray-600 text-center">קבצים ותמונות ישמרו בקבצי הליד</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}