import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import moment from "moment";

export default function PaymentsPanel({ customerId, projectId, companyId }) {
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', customerId, projectId, companyId],
    queryFn: async () => {
      let pays = await base44.entities.Payment.list('-created_date');
      if (customerId) pays = pays.filter(p => p.customer_id === customerId);
      if (projectId) pays = pays.filter(p => p.project_id === projectId);
      return pays;
    },
  });

  const total = payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0);

  return (
    <div>
      <div className="gesi-card p-4 mb-4">
        <p className="text-sm text-gray-400">סה״כ שולם</p>
        <p className="text-2xl font-bold text-white">₪{total.toLocaleString()}</p>
      </div>

      <div className="space-y-3">
        {payments.map(payment => (
          <div key={payment.id} className="gesi-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-[#2dd4a8]" />
              <div>
                <h4 className="text-sm font-semibold text-white">{payment.description || payment.type}</h4>
                <p className="text-xs text-gray-400">{moment(payment.created_date).format('DD/MM/YY')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white">₪{payment.amount.toLocaleString()}</span>
              <StatusBadge status={payment.status} />
            </div>
          </div>
        ))}
        {payments.length === 0 && <p className="text-center text-gray-500 py-8">אין תשלומים</p>}
      </div>
    </div>
  );
}