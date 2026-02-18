import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Settings, User, Shield, Bell, Palette } from "lucide-react";

export default function CrmSettings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const sections = [
    { icon: User, title: "פרופיל", description: "עדכון פרטים אישיים" },
    { icon: Shield, title: "הרשאות", description: "ניהול תפקידים והרשאות" },
    { icon: Bell, title: "התראות", description: "הגדרות התראות" },
    { icon: Palette, title: "מראה", description: "התאמת מראה המערכת" },
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-white">הגדרות</h1>

      {/* User info */}
      {user && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="gesi-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2dd4a8]/10 flex items-center justify-center text-[#2dd4a8] text-xl font-bold">
              {user.full_name?.[0] || user.email?.[0] || "U"}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{user.full_name || 'משתמש'}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
              <p className="text-xs text-[#2dd4a8] mt-1">{user.role || 'user'}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="gesi-card p-5 cursor-pointer hover:border-[#2dd4a8]/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#142e38] flex items-center justify-center">
                <section.icon className="w-5 h-5 text-[#2dd4a8]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{section.title}</p>
                <p className="text-[10px] text-gray-500">{section.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}