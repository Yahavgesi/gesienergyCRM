import React from "react";
import { motion } from "framer-motion";
import { Zap, DollarSign, User } from "lucide-react";

export default function DealCard({ deal, onClick }) {
  const probabilityColor = deal.probability >= 70 ? 'text-[#2dd4a8]' : deal.probability >= 40 ? 'text-amber-400' : 'text-gray-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className="gesi-card p-3 cursor-pointer hover:border-[#2dd4a8]/20 transition-all group"
    >
      <p className="text-sm font-semibold text-white truncate mb-2 group-hover:text-[#2dd4a8] transition-colors">
        {deal.title || deal.customer_name}
      </p>
      <div className="flex items-center gap-3 text-[10px] text-gray-500">
        {deal.kwp && (
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#2dd4a8]" />
            {deal.kwp} kWp
          </span>
        )}
        {deal.revenue && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            ₪{deal.revenue.toLocaleString()}
          </span>
        )}
      </div>
      {deal.probability != null && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-[#142e38] overflow-hidden">
            <div className="h-full rounded-full bg-[#2dd4a8]" style={{ width: `${deal.probability}%` }} />
          </div>
          <span className={`text-[10px] font-bold ${probabilityColor}`}>{deal.probability}%</span>
        </div>
      )}
      {deal.next_action && (
        <p className="text-[10px] text-gray-400 mt-2 truncate">→ {deal.next_action}</p>
      )}
    </motion.div>
  );
}