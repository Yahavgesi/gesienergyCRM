import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import EmptyState from "../components/shared/EmptyState";
import SkeletonCard from "../components/shared/SkeletonCard";
import { CreditCard, CheckCircle2, Clock, XCircle, Receipt, ChevronDown, ChevronUp } from "lucide-react";

const statusConfig = {
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", label: "ממתין לתשלום" },
  processing: { icon: Clock, color: "text-blue-400", bg: "bg-blue-400/10", label: "בעיבוד" },
  completed: { icon: CheckCircle2, color: "text-[#2dd4a8]", bg: "bg-[#2dd4a8]/10", label: "שולם" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", label: "נכשל" },
  refunded: { icon: Receipt, color: "text-purple-400", bg: "bg-purple-400/10", label: "הוחזר" },
};

export default function CustomerPayments() {
  const [user, setUser] = useState(null);
  const [expandedPayment, setExpandedPayment] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['customer-payments', user?.email],
    queryFn: () => base44.entities.Payment.filter({ customer_email: user.email }, '-created_date'),
    enabled: !!user?.email,
    initialData: [],
  });

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingTotal = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);

  if (isLoading) {
    return <div className="p-4 space-y-3" dir="rtl">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto" dir="rtl">
      <h1 className="text-lg font-bold text-white mb-4">תשלומים</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="gesi-card p-4">
          <p className="text-[10px] text-gray-500 mb-1">שולם</p>
          <p className="text-xl font-bold text-[#2dd4a8]">₪{totalPaid.toLocaleString()}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="gesi-card p-4">
          <p className="text-[10px] text-gray-500 mb-1">ממתין</p>
          <p className="text-xl font-bold text-amber-400">₪{pendingTotal.toLocaleString()}</p>
        </motion.div>
      </div>

      {payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="אין תשלומים" description="התשלומים שלך יופיעו כאן" />
      ) : (
        <div className="space-y-3">
          {payments.map((payment, i) => {
            const config = statusConfig[payment.status] || statusConfig.pending;
            const Icon = config.icon;
            const isExpanded = expandedPayment === payment.id;

            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="gesi-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedPayment(isExpanded ? null : payment.id)}
                  className="w-full p-4 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-semibold text-white">{payment.description || 'תשלום'}</p>
                    <p className="text-[10px] text-gray-500">{new Date(payment.created_date).toLocaleDateString('he-IL')}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">₪{(payment.amount || 0).toLocaleString()}</p>
                    <p className={`text-[10px] ${config.color}`}>{config.label}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    className="px-4 pb-4 border-t border-[rgba(45,212,168,0.08)]"
                  >
                    <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                      <div>
                        <p className="text-gray-500">סוג</p>
                        <p className="text-white">{payment.type === 'deposit' ? 'מקדמה' : payment.type === 'milestone' ? 'אבן דרך' : payment.type === 'installment' ? 'תשלום' : 'רכישה'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">אמצעי תשלום</p>
                        <p className="text-white">{payment.method === 'credit_card' ? 'כרטיס אשראי' : payment.method || '—'}</p>
                      </div>
                      {payment.installment_number && (
                        <div>
                          <p className="text-gray-500">תשלום</p>
                          <p className="text-white">{payment.installment_number} מתוך {payment.total_installments}</p>
                        </div>
                      )}
                    </div>
                    {payment.status === 'pending' && (
                      <button className="gesi-btn-primary w-full mt-4 py-2.5 text-sm">
                        שלם עכשיו
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}