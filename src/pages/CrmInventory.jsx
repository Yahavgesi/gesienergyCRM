import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package, AlertTriangle } from "lucide-react";
import FormModal from "../components/crm/FormModal";
import DataTable from "../components/crm/DataTable";
import { motion } from "framer-motion";

const categoryLabels = { panels: "פאנלים", inverters: "מהפכים", mounting: "מבנה", cables: "כבלים", electrical: "חשמל", tools: "כלים", other: "אחר" };

const formFields = [
  { key: "name", label: "שם פריט", placeholder: "שם המוצר" },
  { key: "sku", label: "קוד מוצר", placeholder: "SKU-001" },
  { key: "category", label: "קטגוריה", type: "select", options: Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l })) },
  { key: "brand", label: "מותג", placeholder: "Jinko, Huawei..." },
  { key: "model", label: "דגם" },
  { key: "quantity", label: "כמות במלאי", type: "number", placeholder: "0" },
  { key: "min_quantity", label: "מלאי מינימלי", type: "number", placeholder: "5" },
  { key: "unit", label: "יחידת מידה", placeholder: "יחידה" },
  { key: "cost_price", label: "מחיר עלות (₪)", type: "number" },
  { key: "sale_price", label: "מחיר מכירה (₪)", type: "number" },
  { key: "location", label: "מיקום במחסן", placeholder: "מדף A-1" },
  { key: "notes", label: "הערות", type: "textarea" },
];

const columns = [
  { key: "name", label: "שם" },
  { key: "sku", label: "קוד" },
  { key: "category", label: "קטגוריה", render: r => categoryLabels[r.category] || r.category || '—' },
  { key: "brand", label: "מותג", render: r => r.brand || '—' },
  { key: "quantity", label: "כמות", render: r => (
    <span className={`font-bold ${(r.quantity || 0) <= (r.min_quantity || 0) ? 'text-red-400' : 'text-[#2dd4a8]'}`}>
      {r.quantity || 0} {r.unit || ''}
    </span>
  )},
  { key: "cost_price", label: "עלות", render: r => r.cost_price ? `₪${r.cost_price.toLocaleString()}` : '—' },
  { key: "location", label: "מיקום", render: r => r.location || '—' },
];

export default function CrmInventory() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ quantity: 0, unit: "יחידה" });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['crm-inventory'],
    queryFn: () => base44.entities.Inventory.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Inventory.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['crm-inventory'] }); setShowForm(false); setFormData({ quantity: 0, unit: "יחידה" }); },
  });

  const lowStock = items.filter(i => (i.quantity || 0) <= (i.min_quantity || 0));
  const totalValue = items.reduce((s, i) => s + ((i.quantity || 0) * (i.cost_price || 0)), 0);

  const filtered = items.filter(i =>
    (catFilter === "all" || i.category === catFilter) &&
    (!search || i.name?.includes(search) || i.sku?.includes(search) || i.brand?.includes(search))
  );

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">מחסן וציוד</h1>
          <p className="text-sm text-gray-400 mt-1">{items.length} פריטים • שווי: ₪{totalValue.toLocaleString()}</p>
        </div>
        <Button onClick={() => { setFormData({ quantity: 0, unit: "יחידה" }); setShowForm(true); }} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          <Plus className="w-4 h-4 ml-2" /> פריט חדש
        </Button>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-bold">{lowStock.length} פריטים</span> במלאי נמוך: {lowStock.slice(0, 3).map(i => i.name).join(', ')}{lowStock.length > 3 ? '...' : ''}
          </p>
        </motion.div>
      )}

      {/* Filters */}
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
        <div className="h-64 rounded-xl bg-[#142e38] animate-pulse" />
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage="אין פריטים במלאי" />
      )}

      <FormModal open={showForm} onClose={setShowForm} title="פריט חדש" fields={formFields}
        data={formData} setData={setFormData} onSubmit={() => createMutation.mutate(formData)} submitting={createMutation.isPending} />
    </div>
  );
}