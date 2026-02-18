import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, Clock, Loader2 } from "lucide-react";

export default function CurrentStepCard({ step, onAction }) {
  if (!step) return null;

  const needsAction = step.status === 'waiting_customer';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl p-6 border ${
        needsAction 
          ? 'border-amber-500/30 bg-amber-500/5' 
          : 'border-[rgba(45,212,168,0.15)] bg-[#0f2229]'
      }`}
    >
      {/* Glow effect */}
      <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl" 
        style={{ background: needsAction 
          ? 'linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)' 
          : 'linear-gradient(90deg, transparent, rgba(45,212,168,0.5), transparent)' 
        }} 
      />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {needsAction ? (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          ) : step.status === 'in_progress' ? (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          ) : (
            <Clock className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-xs font-medium text-gray-400">השלב הנוכחי</span>
        </div>
        {step.eta && (
          <span className="text-[10px] text-gray-500 bg-[#142e38] px-2 py-1 rounded-full">
            צפי: {new Date(step.eta).toLocaleDateString('he-IL')}
          </span>
        )}
      </div>

      <h2 className="text-xl font-bold text-white mb-2">{step.name}</h2>
      {step.description && (
        <p className="text-sm text-gray-400 mb-4">{step.description}</p>
      )}

      {needsAction && step.customer_action_description && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-300 font-medium">
            ⚠ פעולה נדרשת: {step.customer_action_description}
          </p>
        </div>
      )}

      {needsAction && onAction && (
        <button
          onClick={onAction}
          className="gesi-btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          <span>בצע פעולה</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}