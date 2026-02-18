import React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, FileText, Search, Wrench, Zap, 
  FileCheck, DollarSign, Sparkles, Home, Phone,
  Clock, AlertTriangle, Loader2, ArrowLeft
} from "lucide-react";

const iconMap = {
  phone: Phone,
  search: Search,
  filetext: FileText,
  wrench: Wrench,
  zap: Zap,
  filecheck: FileCheck,
  dollarsign: DollarSign,
  sparkles: Sparkles,
  home: Home,
};

const statusConfig = {
  completed: { 
    color: "#2dd4a8", 
    bg: "from-[#2dd4a8] to-[#1fa882]",
    border: "border-[#2dd4a8]/30",
    glow: "shadow-[0_0_20px_rgba(45,212,168,0.3)]"
  },
  in_progress: { 
    color: "#60a5fa", 
    bg: "from-blue-500 to-blue-600",
    border: "border-blue-500/30",
    glow: "shadow-[0_0_20px_rgba(96,165,250,0.3)]"
  },
  waiting_customer: { 
    color: "#fbbf24", 
    bg: "from-amber-500 to-amber-600",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-pulse"
  },
  pending: { 
    color: "#64748b", 
    bg: "from-gray-600 to-gray-700",
    border: "border-gray-600/20",
    glow: ""
  },
  blocked: { 
    color: "#f87171", 
    bg: "from-red-500 to-red-600",
    border: "border-red-500/30",
    glow: "shadow-[0_0_20px_rgba(248,113,113,0.3)]"
  },
};

export default function RoadmapStep({ step, index, isActive, onAction }) {
  const config = statusConfig[step.status] || statusConfig.pending;
  const StepIcon = iconMap[step.icon?.toLowerCase()] || FileText;
  const StatusIcon = step.status === 'completed' ? CheckCircle2 
    : step.status === 'in_progress' ? Loader2 
    : step.status === 'waiting_customer' ? AlertTriangle 
    : Clock;

  const needsAction = step.status === 'waiting_customer' && step.requires_customer_action;

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.15,
        type: "spring",
        stiffness: 100 
      }}
      className={`relative ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'} max-w-[85%]`}
    >
      {/* Connector Line */}
      {index > 0 && (
        <div 
          className={`absolute top-0 ${index % 2 === 0 ? 'right-full' : 'left-full'} w-8 h-[2px]`}
          style={{ 
            background: step.status === 'completed' 
              ? 'linear-gradient(90deg, #2dd4a8, transparent)' 
              : 'linear-gradient(90deg, #142e38, transparent)',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
      )}

      {/* Step Card */}
      <motion.div
        whileHover={isActive ? { scale: 1.02, y: -2 } : {}}
        onClick={needsAction ? onAction : undefined}
        className={`
          relative rounded-2xl overflow-hidden border-2 backdrop-blur-sm
          ${config.border} ${config.glow}
          ${needsAction ? 'cursor-pointer' : ''}
          ${isActive ? 'bg-gradient-to-br ' + config.bg : 'bg-[#0f2229]/80'}
        `}
      >
        {/* Glow Bar */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1`}
          style={{ 
            background: isActive 
              ? `linear-gradient(90deg, transparent, ${config.color}, transparent)` 
              : 'transparent'
          }}
        />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* Icon Circle */}
            <div 
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isActive ? 'bg-white/20' : 'bg-[#142e38]'
              }`}
            >
              <StepIcon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                  {step.name}
                </h3>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StatusIcon 
                    className={`w-4 h-4 ${
                      step.status === 'in_progress' ? 'animate-spin' : ''
                    }`} 
                    style={{ color: config.color }}
                  />
                  <span className="text-[10px] font-medium" style={{ color: config.color }}>
                    {index + 1}
                  </span>
                </div>
              </div>

              {step.description && (
                <p className={`text-xs leading-relaxed ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                  {step.description}
                </p>
              )}
            </div>
          </div>

          {/* Customer Action Required */}
          {needsAction && step.customer_action_description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-xl bg-white/10 border border-white/20"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <AlertTriangle className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white font-medium">
                    {step.customer_action_description}
                  </p>
                </div>
                <ArrowLeft className="w-4 h-4 text-white flex-shrink-0" />
              </div>
            </motion.div>
          )}

          {/* ETA */}
          {step.eta && step.status !== 'completed' && (
            <div className="mt-2 flex items-center gap-1.5">
              <Clock className={`w-3 h-3 ${isActive ? 'text-white/60' : 'text-gray-500'}`} />
              <span className={`text-[10px] ${isActive ? 'text-white/60' : 'text-gray-500'}`}>
                צפי: {new Date(step.eta).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}

          {/* Completion Date */}
          {step.completed_date && step.status === 'completed' && (
            <div className="mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#2dd4a8]" />
              <span className="text-[10px] text-[#2dd4a8]">
                הושלם ב-{new Date(step.completed_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
        </div>

        {/* Pulse animation for active step */}
        {isActive && step.status === 'in_progress' && (
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-white/30"
            animate={{ 
              opacity: [0.5, 0, 0.5],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}