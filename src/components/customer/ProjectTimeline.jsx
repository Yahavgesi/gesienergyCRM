import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Clock, Loader2 } from "lucide-react";

const statusConfig = {
  completed: { icon: CheckCircle2, color: "#2dd4a8", bg: "bg-[#2dd4a8]", line: "bg-[#2dd4a8]" },
  in_progress: { icon: Loader2, color: "#60a5fa", bg: "bg-blue-500", line: "bg-blue-500/30", animate: true },
  waiting_customer: { icon: AlertTriangle, color: "#fbbf24", bg: "bg-amber-500", line: "bg-amber-500/30" },
  pending: { icon: Clock, color: "#64748b", bg: "bg-gray-600", line: "bg-gray-700" },
  blocked: { icon: AlertTriangle, color: "#f87171", bg: "bg-red-500", line: "bg-red-500/30" },
};

export default function ProjectTimeline({ steps, currentStepIndex }) {
  return (
    <div className="space-y-0 pr-2">
      {steps.map((step, index) => {
        const config = statusConfig[step.status] || statusConfig.pending;
        const Icon = config.icon;
        const isLast = index === steps.length - 1;
        const isCurrent = index === currentStepIndex;

        return (
          <motion.div
            key={step.id || index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="flex gap-4"
          >
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center">
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCurrent ? 'animate-pulse-glow' : ''
              }`} style={{ background: `${config.color}20` }}>
                <Icon className={`w-5 h-5 ${config.animate ? 'animate-spin' : ''}`} style={{ color: config.color }} />
              </div>
              {!isLast && (
                <div className={`w-0.5 h-12 ${config.line} transition-all`} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 flex-1 ${isCurrent ? '' : 'opacity-70'}`}>
              <p className={`text-sm font-semibold ${step.status === 'completed' ? 'text-[#2dd4a8]' : 'text-white'}`}>
                {step.name}
              </p>
              {step.description && (
                <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
              )}
              {step.status === 'waiting_customer' && step.customer_action_description && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-300">⚠ {step.customer_action_description}</p>
                </div>
              )}
              {step.eta && step.status !== 'completed' && (
                <p className="text-[10px] text-gray-500 mt-1">צפי: {new Date(step.eta).toLocaleDateString('he-IL')}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}