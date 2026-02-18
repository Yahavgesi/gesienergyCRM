import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import CurrentStepCard from "../components/customer/CurrentStepCard";
import ProjectTimeline from "../components/customer/ProjectTimeline";
import SkeletonCard from "../components/shared/SkeletonCard";
import EmptyState from "../components/shared/EmptyState";
import { Sun, ChevronDown, ChevronUp, Zap } from "lucide-react";

export default function CustomerHome() {
  const [user, setUser] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showNextSteps, setShowNextSteps] = useState(false);

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

  // Next steps after current
  const upcomingSteps = steps.filter((_, i) => i > currentStepIndex).slice(0, 3);

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
    <div className="p-4 pb-24 max-w-lg mx-auto space-y-4" dir="rtl">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-xs text-gray-500">שלום,</p>
          <h1 className="text-lg font-bold text-white">{user?.full_name || 'לקוח'}</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2dd4a8]/10 border border-[#2dd4a8]/20">
          <Zap className="w-3.5 h-3.5 text-[#2dd4a8]" />
          <span className="text-xs font-medium text-[#2dd4a8]">{activeProject.kwp || '—'} kWp</span>
        </div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="gesi-card p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">התקדמות הפרויקט</span>
          <span className="text-xs font-bold text-[#2dd4a8]">{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#142e38] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #1fa882, #2dd4a8)' }}
          />
        </div>
        <p className="text-[10px] text-gray-500 mt-1.5">{completedCount} מתוך {steps.length} שלבים הושלמו</p>
      </motion.div>

      {/* Current Step Card */}
      <CurrentStepCard step={currentStep} />

      {/* What happens next */}
      {upcomingSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => setShowNextSteps(!showNextSteps)}
            className="w-full gesi-card px-4 py-3 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-gray-300">מה קורה הלאה?</span>
            {showNextSteps ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {showNextSteps && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-2 space-y-2"
            >
              {upcomingSteps.map((step, i) => (
                <div key={step.id} className="gesi-card px-4 py-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#142e38] flex items-center justify-center text-[10px] text-gray-500 font-bold">
                    {currentStepIndex + i + 2}
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">{step.name}</p>
                    {step.eta && <p className="text-[10px] text-gray-500">צפי: {new Date(step.eta).toLocaleDateString('he-IL')}</p>}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Full Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="w-full gesi-card px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm font-medium text-gray-300">ציר הזמן המלא</span>
          {showTimeline ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {showTimeline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mt-4"
          >
            <ProjectTimeline steps={steps} currentStepIndex={currentStepIndex} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}