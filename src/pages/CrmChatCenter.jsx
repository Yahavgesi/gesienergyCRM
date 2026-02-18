import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../components/shared/EmptyState";
import SkeletonCard from "../components/shared/SkeletonCard";
import { MessageCircle, Send, User } from "lucide-react";
import { motion } from "framer-motion";

export default function CrmChatCenter() {
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: chats, isLoading: loadingChats } = useQuery({
    queryKey: ['crm-chats'], queryFn: () => base44.entities.Chat.list('-last_message_at', 100), initialData: []
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['crm-messages', selectedChat?.id],
    queryFn: () => base44.entities.Message.filter({ chat_id: selectedChat.id }, 'created_date'),
    enabled: !!selectedChat?.id,
    initialData: [],
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (content) => base44.entities.Message.create({
      chat_id: selectedChat.id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      content,
      message_type: "text",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-messages'] });
      setMessage("");
    },
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="flex h-[calc(100vh-2rem)] m-3 rounded-2xl overflow-hidden gesi-card" dir="rtl">
      {/* Chat List */}
      <div className="w-80 border-l flex-shrink-0 flex flex-col" style={{ borderColor: 'rgba(45,212,168,0.08)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(45,212,168,0.08)' }}>
          <h2 className="text-sm font-bold text-white">שיחות</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? <div className="p-3"><SkeletonCard lines={3} /></div> : chats.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">אין שיחות</div>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full p-3 flex items-center gap-3 text-right border-b transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-[#2dd4a8]/5' : 'hover:bg-[#142e38]'
                }`}
                style={{ borderColor: 'rgba(255,255,255,0.03)' }}
              >
                <div className="w-9 h-9 rounded-full bg-[#2dd4a8]/10 flex items-center justify-center text-[#2dd4a8] text-xs font-bold flex-shrink-0">
                  {chat.customer_name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{chat.customer_name || chat.customer_email}</p>
                  <p className="text-[10px] text-gray-500 truncate">{chat.last_message || 'אין הודעות'}</p>
                </div>
                {chat.unread_agent > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#2dd4a8] text-white text-[10px] font-bold flex items-center justify-center">{chat.unread_agent}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedChat ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={MessageCircle} title="בחר שיחה" description="בחר שיחה מהרשימה לצפייה" />
          </div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'rgba(45,212,168,0.08)' }}>
              <div className="w-8 h-8 rounded-full bg-[#2dd4a8]/10 flex items-center justify-center text-[#2dd4a8] text-xs font-bold">
                {selectedChat.customer_name?.[0] || "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{selectedChat.customer_name}</p>
                <p className="text-[10px] text-gray-500">{selectedChat.customer_email}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(msg => {
                const isAgent = msg.sender_email !== selectedChat.customer_email;
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[65%] px-3.5 py-2 rounded-xl text-sm ${
                      isAgent ? 'bg-[#2dd4a8] text-white rounded-br-sm' : 'bg-[#142e38] text-gray-200 rounded-bl-sm'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-[9px] mt-0.5 ${isAgent ? 'text-white/50' : 'text-gray-600'}`}>
                        {new Date(msg.created_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t" style={{ borderColor: 'rgba(45,212,168,0.08)' }}>
              <div className="flex gap-2">
                <input
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && message.trim() && sendMutation.mutate(message.trim())}
                  placeholder="הקלד הודעה..."
                  className="flex-1 bg-[#142e38] border border-[rgba(45,212,168,0.1)] rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-[#2dd4a8]/30"
                />
                <button
                  onClick={() => message.trim() && sendMutation.mutate(message.trim())}
                  disabled={!message.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-30"
                  style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}