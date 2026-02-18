import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import EmptyState from "../components/shared/EmptyState";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Send, Paperclip, MessageCircle } from "lucide-react";

export default function CustomerChat() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: chats } = useQuery({
    queryKey: ['customer-chats', user?.email],
    queryFn: () => base44.entities.Chat.filter({ customer_email: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const activeChat = chats[0];

  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-messages', activeChat?.id],
    queryFn: () => base44.entities.Message.filter({ chat_id: activeChat.id }, 'created_date'),
    enabled: !!activeChat?.id,
    initialData: [],
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (content) => base44.entities.Message.create({
      chat_id: activeChat.id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      content,
      message_type: "text",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
      setMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !activeChat) return;
    sendMutation.mutate(message.trim());
  };

  if (!activeChat) {
    return (
      <div className="p-4" dir="rtl">
        <EmptyState icon={MessageCircle} title="אין שיחות" description="שיחה עם הנציג שלך תיפתח כאשר הפרויקט יתחיל" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]" dir="rtl">
      {/* Chat header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(45,212,168,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#2dd4a8]/20 flex items-center justify-center text-[#2dd4a8] text-sm font-bold">
            {activeChat.agent_email?.[0]?.toUpperCase() || "G"}
          </div>
          <div>
            <p className="text-sm font-medium text-white">צוות Gesi</p>
            <p className="text-[10px] text-gray-500">מענה בשעות פעילות</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <SkeletonCard />
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_email === user?.email;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  isMe 
                    ? 'bg-[#2dd4a8] text-white rounded-br-md' 
                    : 'bg-[#142e38] text-gray-200 rounded-bl-md'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[9px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-500'}`}>
                    {new Date(msg.created_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(45,212,168,0.08)' }}>
        <div className="flex gap-2 items-center">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="הקלד הודעה..."
            className="flex-1 bg-[#142e38] border border-[rgba(45,212,168,0.1)] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-[#2dd4a8]/30 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}