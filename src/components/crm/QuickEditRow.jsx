import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X } from "lucide-react";

/**
 * Generic inline quick-edit table row.
 * columns: [{ key, label, type?, options? }]
 * type can be: 'text' (default), 'number', 'select', 'date'
 */
export default function QuickEditRow({ record, columns, onSave, onCancel }) {
  const [data, setData] = useState({ ...record });
  const inputClass = "h-8 text-xs bg-[#0a1a1f] border-[rgba(45,212,168,0.2)] text-white";

  const renderField = (col) => {
    if (col.type === 'select' && col.options) return (
      <Select value={data[col.key] || ""} onValueChange={v => setData(p => ({ ...p, [col.key]: v }))}>
        <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
        <SelectContent className="bg-[#142e38] border-[rgba(45,212,168,0.15)]">
          {col.options.map(o => (
            <SelectItem key={o.value} value={o.value} className="text-gray-300 text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
    if (col.type === 'number') return (
      <Input type="number" value={data[col.key] ?? ""} onChange={e => setData(p => ({ ...p, [col.key]: e.target.value }))} className={inputClass} />
    );
    if (col.type === 'date') return (
      <Input type="date" value={data[col.key] ?? ""} onChange={e => setData(p => ({ ...p, [col.key]: e.target.value }))} className={inputClass} />
    );
    // skip render-only columns (no editable type info but has render fn) - show plain text input
    return (
      <Input value={data[col.key] ?? ""} onChange={e => setData(p => ({ ...p, [col.key]: e.target.value }))} className={inputClass} />
    );
  };

  return (
    <tr className="bg-[#0a1a1f] border-b border-[rgba(45,212,168,0.08)]">
      {columns.map(col => (
        <td key={col.key} className="px-3 py-2">
          {renderField(col)}
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