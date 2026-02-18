import React from "react";
import { motion } from "framer-motion";

export default function KpiCard({ title, value, subtitle, icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="gesi-card p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,168,0.3), transparent)' }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[#2dd4a8]/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#2dd4a8]" />
          </div>
        )}
      </div>
    </motion.div>
  );
}