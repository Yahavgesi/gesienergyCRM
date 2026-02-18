import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, DollarSign, Truck, Wrench, Zap } from "lucide-react";

const milestoneIcons = {
  deposit: DollarSign,
  equipment: Truck,
  completion: Wrench,
  grid_connection: Zap,
};

export default function PaymentMilestones({ project }) {
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', project?.id],
    queryFn: () => base44.entities.Payment.filter({ project_id: project.id, status: 'completed' }),
    enabled: !!project?.id,
    initialData: [],
  });

  if (!project?.price_per_kwp || !project?.kwp) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-6 text-center">
        <p className="text-gray-400 text-sm">טרם הוגדרו מחירים לפרויקט</p>
      </div>
    );
  }

  const depositAmount = 5900; // Fixed deposit including VAT
  const totalWithVat = project.total_price || 0;
  const remainingAfterDeposit = totalWithVat - depositAmount;

  // Check which milestones are paid
  const isPaid = (milestoneId) => {
    return payments.some(p => p.milestone_type === milestoneId);
  };

  const milestones = [
    {
      id: 'deposit',
      name: 'מקדמה',
      description: 'תשלום מקדמה לפני תחילת עבודה',
      percentage: null,
      amount: depositAmount,
      icon: 'deposit',
      color: 'from-[#2dd4a8] to-[#1fa882]',
      status: isPaid('deposit') ? 'completed' : 'pending',
    },
    {
      id: 'equipment',
      name: 'פריקת ציוד ותחילת עבודה',
      description: '50% מיתרת הסכום',
      percentage: 50,
      amount: remainingAfterDeposit * 0.5,
      icon: 'equipment',
      color: 'from-blue-500 to-blue-600',
      status: isPaid('equipment_delivery') ? 'completed' : 'pending',
    },
    {
      id: 'completion',
      name: 'מוכנות מתקן וסיום עבודות',
      description: '45% מיתרת הסכום',
      percentage: 45,
      amount: remainingAfterDeposit * 0.45,
      icon: 'completion',
      color: 'from-purple-500 to-purple-600',
      status: isPaid('system_completion') ? 'completed' : 'pending',
    },
    {
      id: 'grid_connection',
      name: 'חיבור מתקן לרשת',
      description: '5% מיתרת הסכום',
      percentage: 5,
      amount: remainingAfterDeposit * 0.05,
      icon: 'grid_connection',
      color: 'from-amber-500 to-amber-600',
      status: isPaid('grid_connection') ? 'completed' : 'pending',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Total Summary */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.15)] p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">גודל מערכת</p>
            <p className="text-2xl font-bold text-white">{project.kwp} <span className="text-sm text-gray-400">kWp</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">מחיר לקילו-וואט</p>
            <p className="text-2xl font-bold text-[#2dd4a8]">₪{project.price_per_kwp_with_vat?.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">כולל מע״מ</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[rgba(45,212,168,0.1)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">סה״כ מחיר מערכת</p>
            <p className="text-3xl font-bold text-[#2dd4a8]">₪{totalWithVat.toLocaleString()}</p>
          </div>
          <p className="text-[10px] text-gray-500 text-left mt-1">כולל מע״מ</p>
        </div>
      </div>

      {/* Payment Milestones */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 px-2">
          <DollarSign className="w-4 h-4 text-[#2dd4a8]" />
          אבני דרך לתשלום
        </h3>

        {milestones.map((milestone, index) => {
          const Icon = milestoneIcons[milestone.icon] || DollarSign;
          const isPaid = milestone.status === 'completed';

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-xl border-2 overflow-hidden ${
                isPaid 
                  ? 'border-[#2dd4a8]/30 bg-[#2dd4a8]/5' 
                  : 'border-[rgba(45,212,168,0.1)] bg-[#0f2229]'
              }`}
            >
              {/* Progress bar on top */}
              <div className={`h-1 bg-gradient-to-r ${milestone.color}`} style={{ width: isPaid ? '100%' : '0%' }} />

              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isPaid ? 'bg-[#2dd4a8]/20' : 'bg-[#142e38]'
                  }`}>
                    {isPaid ? (
                      <CheckCircle2 className="w-6 h-6 text-[#2dd4a8]" />
                    ) : (
                      <Icon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h4 className="text-sm font-bold text-white">{milestone.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{milestone.description}</p>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <p className="text-lg font-bold text-white">₪{milestone.amount.toLocaleString()}</p>
                        {milestone.percentage && (
                          <p className="text-[10px] text-gray-500">{milestone.percentage}%</p>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2 mt-2">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-[#2dd4a8]/20 text-[#2dd4a8] px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          שולם
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          ממתין
                        </span>
                      )}
                      {index === 0 && !isPaid && (
                        <span className="text-[10px] text-gray-500">סכום קבוע כולל מע״מ</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total Breakdown */}
      <div className="rounded-xl bg-[#0f2229]/50 border border-[rgba(45,212,168,0.08)] p-4">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">מקדמה</span>
            <span className="text-white font-medium">₪{depositAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">יתרת תשלומים (50% + 45% + 5%)</span>
            <span className="text-white font-medium">₪{remainingAfterDeposit.toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t border-[rgba(45,212,168,0.08)] flex justify-between">
            <span className="text-gray-300 font-semibold">סה״כ</span>
            <span className="text-[#2dd4a8] font-bold">₪{totalWithVat.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}