import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Truck, Phone, Mail, Star } from "lucide-react";
import FormModal from "../components/crm/FormModal";
import { motion } from "framer-motion";
import { createPageUrl } from "../utils";

const categoryLabels = { panels: "פאנלים", inverters: "מהפכים", mounting: "מבנה", electrical: "חשמל", labor: "עבודה", permits: "היתרים", other: "אחר" };
const categoryColors = { panels: "text-yellow-400 bg-yellow-400/10", inverters: "text-blue-400 bg-blue-400/10", mounting: "text-orange-400 bg-orange-400/10", electrical: "text-red-400 bg-red-400/10", labor: "text-purple-400 bg-purple-400/10", permits: "text-green-400 bg-green-400/10", other: "text-gray-400 bg-gray-400/10" };

const formFields = [
  { key: "name", label: "שם ספק", placeholder: "שם החברה" },
  { key: "contact_name", label: "איש קשר", placeholder: "שם" },
  { key: "phone", label: "טלפון", placeholder: "050-0000000" },
  { key: "email", label: "אימייל", type: "email" },
  { key: "category", label: "קטגוריה", type: "select", options: Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l })) },
  { key: "tax_id", label: "ח.פ.", placeholder: "מספר ח.פ." },
  { key: "payment_terms", label: "תנאי תשלום", placeholder: "שוטף + 30" },
  { key: "credit_limit", label: "מסגרת אשראי (₪)", type: "number" },
  { key: "address", label: "כתובת" },
  { key: "rating", label: "דירוג (1-5)", type: "number", placeholder: "5" },
  { key: "notes", label: "הערות", type: "textarea" },
];

export default function CrmSuppliers() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ status: "active" });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['crm-suppliers'],
    queryFn: () => base44.entities.Supplier.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Supplier.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-suppliers'] }); setShowForm(false); setFormData({ status: "active" }); },
  });

  const filtered = suppliers.filter(s =>
    (catFilter === "all" || s.category === catFilter) &&
    (!search || s.name?.includes(search) || s.contact_name?.includes(search) || s.phone?.includes(search))
  );

  const totalDebt = suppliers.reduce((s, sup) => s + (sup.current_balance || 0), 0);

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">ספקים</h1>
          <p className="text-sm text-gray-400 mt-1">{suppliers.length} ספקים • חוב כולל: ₪{totalDebt.toLocaleString()}</p>
        </div>
        <Button onClick={() => { setFormData({ status: "active" }); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-2" /> ספק חדש
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש..." className="pr-9 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 w-56" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[["all", "הכל"], ...Object.entries(categoryLabels)].map(([val, label]) => (
            <button key={val} onClick={() => setCatFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${catFilter === val ? 'bg-[#2dd4a8] text-white' : 'bg-[#142e38] text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl bg-[#142e38] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>אין ספקים</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sup, i) => (
            <motion.div key={sup.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="gesi-card p-5 cursor-pointer hover:border-[#2dd4a8]/30 hover:bg-[#142e38]/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white mb-1">{sup.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[sup.category] || 'text-gray-400 bg-gray-400/10'}`}>
                    {categoryLabels[sup.category] || sup.category || '—'}
                  </span>
                </div>
                {sup.rating && (
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= sup.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />)}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                {sup.contact_name && <p className="text-sm text-gray-400">{sup.contact_name}</p>}
                {sup.phone && <div className="flex items-center gap-2 text-sm text-gray-400"><Phone className="w-3.5 h-3.5" />{sup.phone}</div>}
                {sup.email && <div className="flex items-center gap-2 text-sm text-gray-400 truncate"><Mail className="w-3.5 h-3.5 flex-shrink-0" />{sup.email}</div>}
              </div>
              {(sup.current_balance > 0 || sup.payment_terms) && (
                <div className="mt-3 pt-3 border-t border-[rgba(45,212,168,0.08)] flex justify-between text-xs">
                  <span className="text-gray-500">{sup.payment_terms || 'תנאי תשלום'}</span>
                  {sup.current_balance > 0 && <span className="text-red-400 font-semibold">חוב: ₪{sup.current_balance.toLocaleString()}</span>}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <FormModal open={showForm} onClose={setShowForm} title="ספק חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}