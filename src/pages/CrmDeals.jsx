import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DealCard from "../components/crm/DealCard";
import FormModal from "../components/crm/FormModal";
import SkeletonCard from "../components/shared/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

const STAGES = [
  { key: "new_lead", label: "ליד חדש" },
  { key: "contacted", label: "נוצר קשר" },
  { key: "qualified", label: "מתאים" },
  { key: "proposal", label: "הצעה" },
  { key: "negotiation", label: "משא ומתן" },
  { key: "signed", label: "נחתם" },
  { key: "deposit_paid", label: "מקדמה שולמה" },
  { key: "handover_ops", label: "מסירה לתפעול" },
];

const formFields = [
  { key: "title", label: "כותרת", placeholder: "שם העסקה" },
  { key: "customer_name", label: "שם לקוח", placeholder: "שם הלקוח" },
  { key: "type", label: "סוג", type: "select", options: [
    { value: "residential", label: "פרטי" }, { value: "commercial", label: "מסחרי" }, { value: "tender", label: "מכרז" }
  ]},
  { key: "kwp", label: "kWp", type: "number", placeholder: "0" },
  { key: "revenue", label: "הכנסה צפויה", type: "number", placeholder: "0" },
  { key: "probability", label: "סיכוי סגירה (%)", type: "number", placeholder: "0" },
  { key: "stage", label: "שלב", type: "select", options: STAGES.map(s => ({ value: s.key, label: s.label })) },
  { key: "next_action", label: "פעולה הבאה", placeholder: "מה צריך לעשות?" },
  { key: "notes", label: "הערות", type: "textarea", placeholder: "הערות" },
];

export default function CrmDeals() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ stage: "new_lead" });
  const queryClient = useQueryClient();

  const { data: deals, isLoading } = useQuery({
    queryKey: ['crm-deals'], queryFn: () => base44.entities.Deal.list('-created_date', 200), initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Deal.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-deals'] }); setShowForm(false); setFormData({ stage: "new_lead" }); },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }) => base44.entities.Deal.update(id, { stage }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-deals'] }),
  });

  if (isLoading) {
    return <div className="p-6" dir="rtl"><SkeletonCard lines={6} /></div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">עסקאות</h1>
        <Button onClick={() => { setFormData({ stage: "new_lead" }); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-2" />
          עסקה חדשה
        </Button>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage, si) => {
          const stageDeals = deals.filter(d => d.stage === stage.key);
          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05 }}
              className="min-w-[260px] w-[260px] flex-shrink-0"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-semibold text-gray-400">{stage.label}</h3>
                <span className="text-[10px] font-bold text-gray-600 bg-[#142e38] px-2 py-0.5 rounded-full">{stageDeals.length}</span>
              </div>
              <div className="space-y-2 min-h-[100px] p-2 rounded-xl bg-[#0d1f26]/50">
                {stageDeals.map(deal => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
                {stageDeals.length === 0 && (
                  <p className="text-[10px] text-gray-600 text-center py-8">אין עסקאות</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <FormModal
        open={showForm}
        onClose={setShowForm}
        title="עסקה חדשה"
        fields={formFields}
        data={formData}
        setData={setFormData}
        onSubmit={() => createMutation.mutate(formData)}
        submitting={createMutation.isPending}
      />
    </div>
  );
}