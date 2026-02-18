import React from "react";
import { motion } from "framer-motion";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#142e38] flex items-center justify-center mb-4 border border-[rgba(45,212,168,0.12)]">
          <Icon className="w-8 h-8 text-[#2dd4a8]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>}
      {action}
    </motion.div>
  );
}