import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import RoadmapStep from "../components/customer/RoadmapStep";
import SkeletonCard from "../components/shared/SkeletonCard";
import EmptyState from "../components/shared/EmptyState";
import { Sun, Zap, MessageCircle, Sparkles } from "lucide-react";

export default function CustomerHome() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const me = await base44.auth.me();
      setUser(me);
    };
    loadUser();
  }, []);

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['customer-projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ customer_email: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const activeProject = projects.find(p => p.status === 'active') || projects[0];

  const { data: steps, isLoading: loadingSteps } = useQuery({
    queryKey: ['project-steps', activeProject?.id],
    queryFn: () => base44.entities.ProjectStep.filter({ project_id: activeProject.id }, 'step_index'),
    enabled: !!activeProject?.id,
    initialData: [],
  });

  const currentStep = steps.find(s => s.status === 'in_progress' || s.status === 'waiting_customer') || steps[0];
  const currentStepIndex = steps.indexOf(currentStep);
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const handleStepAction = (step) => {
    if (!step.requires_customer_action) return;
    
    // Route to the appropriate action based on action_type
    switch (step.action_type) {
      case 'sign_document':
        navigate(createPageUrl('CustomerDocuments'));
        break;
      case 'approve_simulation':
        navigate(createPageUrl('CustomerDocuments'));
        break;
      case 'payment':
        navigate(createPageUrl('CustomerPayments'));
        break;
      case 'fill_form':
      case 'confirm':
        navigate(createPageUrl('CustomerChat'));
        break;
      default:
        navigate(createPageUrl('CustomerChat'));
    }
  };

  if (loadingProjects || loadingSteps) {
    return (
      <div className="p-4 space-y-4" dir="rtl">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="p-4" dir="rtl">
        <EmptyState
          icon={Sun}
          title="ברוך הבא ל-GesiEnergy+"
          description="ברגע שהפרויקט שלך יתחיל, תוכל לעקוב אחרי כל השלבים כאן"
        />
      </div>
    );
  }

  return (
    <div className="pb-24 relative" dir="rtl">
      {/* Hero Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-[#0a1a1f] via-[#0d1f26] to-transparent pt-4 pb-6 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3 h-3" />
                שלום,
              </p>
              <h1 className="text-xl font-bold text-white">{user?.full_name || 'לקוח'}</h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#2dd4a8]/20 to-[#1fa882]/20 border border-[#2dd4a8]/30">
              <Zap className="w-4 h-4 text-[#2dd4a8]" />
              <span className="text-sm font-bold text-[#2dd4a8]">{activeProject.kwp || '—'} kWp</span>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.15)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">מסע הקמת המערכת הסולארית</span>
              <span className="text-sm font-bold text-[#2dd4a8]">{progressPercent}%</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-[#142e38] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full relative"
                style={{ background: 'linear-gradient(90deg, #1fa882, #2dd4a8)' }}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={{ 
                    backgroundPosition: ['0% 0%', '100% 0%'],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    backgroundSize: '50% 100%'
                  }}
                />
              </motion.div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-gray-500">{completedCount} מתוך {steps.length} שלבים</p>
              {currentStep && (
                <p className="text-[10px] text-[#2dd4a8] font-medium">
                  כעת: {currentStep.name}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Roadmap */}
      <div className="px-4 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <h2 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#2dd4a8]" />
            מפת דרכים להתקנה
          </h2>
          <p className="text-[11px] text-gray-500">עקוב אחר כל שלב בדרך למערכת הסולארית שלך</p>
        </motion.div>

        <div className="space-y-6 relative">
          {/* Zigzag connector */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px opacity-20"
            style={{ background: 'linear-gradient(to bottom, #2dd4a8 0%, #142e38 100%)' }}
          />

          {steps.map((step, index) => (
            <RoadmapStep
              key={step.id}
              step={step}
              index={index}
              isActive={index === currentStepIndex}
              onAction={() => handleStepAction(step)}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 mb-4"
        >
          <button
            onClick={() => navigate(createPageUrl('CustomerChat'))}
            className="w-full rounded-2xl p-4 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/40 transition-colors">
                <MessageCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">יש לך שאלות?</p>
                <p className="text-xs text-gray-400">שוחח עם הצ'אט החכם שלנו</p>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 text-xs">→</span>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}