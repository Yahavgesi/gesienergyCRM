import React from "react";
import { motion } from "framer-motion";
import { Clock, FileText, CreditCard, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
import moment from "moment";

const iconMap = {
  stage_change: CheckCircle,
  document_sent: FileText,
  document_signed: FileText,
  simulation_sent: FileText,
  simulation_approved: CheckCircle,
  payment_requested: CreditCard,
  payment_paid: CreditCard,
  payment_failed: AlertCircle,
  message_sent: MessageCircle,
  note_added: MessageCircle,
  file_uploaded: FileText,
  status_change: CheckCircle,
};

export default function ActivityTimeline({ activities = [], title = "פעילות אחרונה" }) {
  return (
    <div className="gesi-card p-6">
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
      <div className="space-y-4">
        {activities.map((activity, idx) => {
          const Icon = iconMap[activity.action_type] || Clock;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex gap-4 relative pb-4"
            >
              {idx < activities.length - 1 && (
                <div className="absolute right-[19px] top-10 w-[2px] h-full bg-gradient-to-b from-[#2dd4a8]/30 to-transparent" />
              )}
              <div className="w-10 h-10 rounded-xl bg-[#142e38] flex items-center justify-center flex-shrink-0 border border-[rgba(45,212,168,0.2)] relative z-10">
                <Icon className="w-5 h-5 text-[#2dd4a8]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{activity.actor_name || activity.actor_email}</span>
                  <span>•</span>
                  <span>{moment(activity.created_date).fromNow()}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {activities.length === 0 && (
          <p className="text-center text-gray-500 py-8">אין פעילות עדיין</p>
        )}
      </div>
    </div>
  );
}