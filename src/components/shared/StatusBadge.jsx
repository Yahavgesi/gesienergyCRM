import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Clock, XCircle, Loader2 } from "lucide-react";

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-[#2dd4a8]", bg: "bg-[#2dd4a8]/10", border: "border-[#2dd4a8]/30", label: "הושלם" },
  in_progress: { icon: Loader2, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30", label: "בביצוע", animate: true },
  waiting_customer: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", label: "ממתין ללקוח" },
  pending: { icon: Clock, color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/30", label: "ממתין" },
  blocked: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30", label: "חסום" },
};

export default function StatusBadge({ status, label }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.color}`}
    >
      <Icon className={`w-3 h-3 ${config.animate ? 'animate-spin' : ''}`} />
      <span>{label || config.label}</span>
    </motion.div>
  );
}