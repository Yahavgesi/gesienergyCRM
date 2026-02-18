import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import GesiLogo from "../components/shared/GesiLogo";
import { Sun, Users, ArrowLeft } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const me = await base44.auth.me();
          setUser(me);
          // Auto-redirect based on role
          if (me.role === "admin" || me.role === "manager" || me.role === "sales_agent" || me.role === "office" || me.role === "finance" || me.role === "installer") {
            navigate(createPageUrl("CrmDashboard"));
          } else {
            navigate(createPageUrl("CustomerHome"));
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#142e38] border-t-[#2dd4a8] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" dir="rtl">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #2dd4a8 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center space-y-8"
      >
        <div className="flex justify-center mb-8">
          <GesiLogo size="lg" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          <span className="text-[#2dd4a8]">GesiEnergy</span>+
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          הפלטפורמה המתקדמת לניהול מערכות סולאריות
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("CustomerHome"))}
            className="gesi-btn-primary flex items-center justify-center gap-3 px-8 py-4 text-lg"
          >
            <Sun className="w-5 h-5" />
            כניסת לקוח
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("CrmDashboard"))}
            className="flex items-center justify-center gap-3 px-8 py-4 text-lg rounded-xl border text-gray-300 hover:text-white hover:border-[#2dd4a8]/50 transition-all duration-300"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(15,34,41,0.5)' }}
          >
            <Users className="w-5 h-5" />
            כניסת צוות
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-[11px] text-gray-600"
      >
        © {new Date().getFullYear()} Gesi Solutions — Invest For Your Future
      </motion.p>
    </div>
  );
}