import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mail, Send, Inbox, Star, Trash2, Reply, Forward, Plus, Search, RefreshCw, Paperclip, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const FOLDERS = [
  { id: 'inbox', label: 'דואר נכנס', icon: Inbox },
  { id: 'sent', label: 'נשלח', icon: Send },
  { id: 'starred', label: 'מסומן', icon: Star },
  { id: 'trash', label: 'אשפה', icon: Trash2 },
];

export default function CrmInbox() {
  const [folder, setFolder] = useState('inbox');
  const [selected, setSelected] = useState(null);
  const [composing, setComposing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['inbox-messages', folder],
    queryFn: () => base44.entities.Message.list('-created_date', 100),
  });

  const sendMutation = useMutation({
    mutationFn: (d) => base44.entities.Message.create({ ...d, direction: 'out', status: 'sent' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inbox-messages'] }); setComposing(false); setComposeData({ to: '', subject: '', body: '' }); },
  });

  const filtered = messages.filter(m =>
    !searchTerm ||
    m.subject?.includes(searchTerm) ||
    m.from_name?.includes(searchTerm) ||
    m.content?.includes(searchTerm)
  );

  return (
    <div className="flex h-[calc(100vh-64px)] lg:h-screen" dir="rtl">
      {/* Sidebar */}
      <div className="w-48 lg:w-56 border-l border-[rgba(45,212,168,0.1)] flex flex-col" style={{ background: '#0d1f26' }}>
        <div className="p-3">
          <Button onClick={() => setComposing(true)} className="w-full text-sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
            <Plus className="w-4 h-4 ml-1" /> כתוב
          </Button>
        </div>
        <nav className="flex-1 px-2 space-y-0.5">
          {FOLDERS.map(f => (
            <button key={f.id} onClick={() => setFolder(f.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${folder === f.id ? 'bg-[#2dd4a8]/10 text-[#2dd4a8]' : 'text-gray-400 hover:bg-[#142e38] hover:text-white'}`}>
              <f.icon className="w-4 h-4" />
              {f.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Message List */}
      <div className={`flex-1 flex flex-col border-l border-[rgba(45,212,168,0.1)] ${selected ? 'hidden lg:flex lg:w-72 lg:flex-none' : ''}`} style={{ background: '#0f1f26' }}>
        <div className="p-3 border-b border-[rgba(45,212,168,0.1)] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="חיפוש..." className="bg-[#142e38] border-none text-sm pr-7 h-8" />
          </div>
          <button onClick={() => refetch()} className="p-1.5 rounded-lg hover:bg-[#142e38] text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-16 bg-[#142e38]/50 rounded-lg animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Mail className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">אין הודעות</p>
            </div>
          ) : (
            filtered.map(msg => (
              <div key={msg.id} onClick={() => setSelected(msg)}
                className={`p-3 border-b border-[rgba(45,212,168,0.05)] cursor-pointer transition-colors ${selected?.id === msg.id ? 'bg-[#2dd4a8]/5' : 'hover:bg-[#142e38]/40'}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium text-white truncate">{msg.from_name || msg.from_email || 'לא ידוע'}</span>
                  <span className="text-[10px] text-gray-500 flex-shrink-0 mr-2">{msg.created_date ? new Date(msg.created_date).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' }) : ''}</span>
                </div>
                <p className="text-xs text-gray-300 truncate">{msg.subject || '(ללא נושא)'}</p>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">{msg.content || ''}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message View / Compose */}
      <div className="flex-1 flex flex-col" style={{ background: '#0a1a1f' }}>
        {composing ? (
          <div className="flex-1 flex flex-col p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">הודעה חדשה</h2>
              <button onClick={() => setComposing(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <Input value={composeData.to} onChange={e => setComposeData(p => ({...p, to: e.target.value}))} placeholder="אל:" className="bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white" />
            <Input value={composeData.subject} onChange={e => setComposeData(p => ({...p, subject: e.target.value}))} placeholder="נושא:" className="bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white" />
            <Textarea value={composeData.body} onChange={e => setComposeData(p => ({...p, body: e.target.value}))} placeholder="כתוב כאן..." className="flex-1 min-h-[300px] bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white" />
            <div className="flex gap-2">
              <Button onClick={() => sendMutation.mutate({ to_email: composeData.to, subject: composeData.subject, content: composeData.body })} disabled={sendMutation.isPending} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
                <Send className="w-4 h-4 ml-1" /> שלח
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300" onClick={() => setComposing(false)}>ביטול</Button>
            </div>
          </div>
        ) : selected ? (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSelected(null)} className="lg:hidden p-1.5 rounded-lg hover:bg-[#142e38] text-gray-400">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:bg-[#142e38]"><Reply className="w-3.5 h-3.5" /></Button>
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:bg-[#142e38]"><Forward className="w-3.5 h-3.5" /></Button>
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:bg-[#142e38]"><Star className="w-3.5 h-3.5" /></Button>
                <Button variant="outline" size="sm" className="border-gray-700 text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{selected.subject || '(ללא נושא)'}</h2>
            <div className="flex items-center gap-3 mb-6 text-sm text-gray-400">
              <div className="w-8 h-8 rounded-full bg-[#2dd4a8]/20 flex items-center justify-center text-[#2dd4a8] font-bold text-xs">
                {(selected.from_name || selected.from_email || '?')[0].toUpperCase()}
              </div>
              <div>
                <span className="text-white">{selected.from_name || selected.from_email || 'לא ידוע'}</span>
                <span className="mx-2">•</span>
                <span>{selected.created_date ? new Date(selected.created_date).toLocaleString('he-IL') : ''}</span>
              </div>
            </div>
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-[#0f2229] rounded-xl p-5 border border-[rgba(45,212,168,0.08)]">
              {selected.content || '(הודעה ריקה)'}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Mail className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm">בחר הודעה לקריאה</p>
            <p className="text-xs mt-1 text-gray-600">או כתוב הודעה חדשה</p>
          </div>
        )}
      </div>
    </div>
  );
}