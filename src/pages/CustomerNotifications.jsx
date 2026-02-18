import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import EmptyState from "../components/shared/EmptyState";
import { Bell, FileText, CreditCard, Gift, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";

const typeIcons = {
  step_action: AlertTriangle,
  document_sign: FileText,
  payment_request: CreditCard,
  payment_confirmation: CheckCircle2,
  monthly_benefit: Gift,
  general: Bell,
};

const typeColors = {
  step_action: "text-amber-400 bg-amber-400/10",
  document_sign: "text-blue-400 bg-blue-400/10",
  payment_request: "text-purple-400 bg-purple-400/10",
  payment_confirmation: "text-[#2dd4a8] bg-[#2dd4a8]/10",
  monthly_benefit: "text-pink-400 bg-pink-400/10",
  general: "text-gray-400 bg-gray-400/10",
};

export default function CustomerNotifications() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: notifications } = useQuery({
    queryKey: ['customer-notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
    initialData: [],
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-notifications'] }),
  });

  const handleClick = (notif) => {
    if (!notif.is_read) markReadMutation.mutate(notif.id);
    if (notif.deep_link) navigate(createPageUrl(notif.deep_link));
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto" dir="rtl">
      <h1 className="text-lg font-bold text-white mb-4">התראות</h1>
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="אין התראות" description="ההתראות שלך יופיעו כאן" />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const Icon = typeIcons[notif.type] || Bell;
            const colorClass = typeColors[notif.type] || typeColors.general;
            return (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleClick(notif)}
                className={`w-full text-right gesi-card p-4 flex items-start gap-3 transition-all ${!notif.is_read ? 'border-[#2dd4a8]/20' : 'opacity-60'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass.split(' ')[1]}`}>
                  <Icon className={`w-5 h-5 ${colorClass.split(' ')[0]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{notif.title}</p>
                  {notif.body && <p className="text-xs text-gray-400 mt-0.5">{notif.body}</p>}
                  <p className="text-[10px] text-gray-600 mt-1">{new Date(notif.created_date).toLocaleDateString('he-IL')}</p>
                </div>
                {notif.deep_link && <ArrowLeft className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}