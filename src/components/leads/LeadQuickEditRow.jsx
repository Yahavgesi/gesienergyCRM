import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X } from "lucide-react";

const SOURCE_OPTIONS = [
  { value: "website", label: "אתר" }, { value: "referral", label: "הפניה" },
  { value: "facebook", label: "פייסבוק" }, { value: "google", label: "גוגל" },
  { value: "phone", label: "טלפון" }, { value: "walk_in", label: "פנה ישירות" },
  { value: "other", label: "אחר" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "חדש" }, { value: "contacted", label: "נוצר קשר" },
  { value: "qualified", label: "מתאים" }, { value: "unqualified", label: "לא מתאים" },
];

const SALES_STAGE_OPTIONS = [
  { value: "new_lead", label: "ליד חדש" }, { value: "initial_contact", label: "יצירת קשר" },
  { value: "site_survey", label: "סיור באתר" }, { value: "quote_sent", label: "הצעת מחיר" },
  { value: "negotiation", label: "משא ומתן" }, { value: "closing", label: "סגירה" },
  { value: "won", label: "נסגר" }, { value: "lost", label: "אבוד" },
];

export default function LeadQuickEditRow({ lead, columns, onSave, onCancel }) {
  const [data, setData] = useState({ ...lead });

  const renderField = (colKey) => {
    const inputClass = "h-8 text-xs bg-[#0a1a1f] border-[rgba(45,212,168,0.2)] text-white";

    if (colKey === "source") return (
      <Select value={data.source || ""} onValueChange={v => setData(p => ({ ...p, source: v }))}>
        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#142e38] border-[rgba(45,212,168,0.15)]">
          {SOURCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-gray-300 text-xs">{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );

    if (colKey === "status") return (
      <Select value={data.status || ""} onValueChange={v => setData(p => ({ ...p, status: v }))}>
        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#142e38] border-[rgba(45,212,168,0.15)]">
          {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-gray-300 text-xs">{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );

    if (colKey === "sales_stage") return (
      <Select value={data.sales_stage || ""} onValueChange={v => setData(p => ({ ...p, sales_stage: v }))}>
        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#142e38] border-[rgba(45,212,168,0.15)]">
          {SALES_STAGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-gray-300 text-xs">{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );

    if (colKey === "estimated_kwp" || colKey === "price_per_kwp") return (
      <Input type="number" value={data[colKey] || ""} onChange={e => setData(p => ({ ...p, [colKey]: e.target.value }))} className={inputClass} />
    );

    return (
      <Input value={data[colKey] || ""} onChange={e => setData(p => ({ ...p, [colKey]: e.target.value }))} className={inputClass} />
    );
  };

  return (
    <tr className="bg-[#0a1a1f] border-b border-[rgba(45,212,168,0.08)]">
      {columns.map(col => (
        <td key={col.key} className="px-3 py-2">
          {renderField(col.key)}
        </td>
      ))}
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <Button size="sm" onClick={() => onSave(data)} className="h-7 px-2 bg-[#2dd4a8] hover:bg-[#1fa882] text-white text-xs">
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 px-2 text-gray-400 hover:text-white text-xs">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}