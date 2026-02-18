import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function FormModal({ open, onClose, title, fields, data, setData, onSubmit, submitting }) {
  const handleChange = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs text-gray-400">{field.label}</Label>
              {field.type === 'select' ? (
                <Select value={data[field.key] || ''} onValueChange={(v) => handleChange(field.key, v)}>
                  <SelectTrigger className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white">
                    <SelectValue placeholder={field.placeholder || 'בחר...'} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#142e38] border-[rgba(45,212,168,0.15)]">
                    {field.options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-gray-300 focus:bg-[#1a3a47] focus:text-white">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  value={data[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 min-h-[80px]"
                />
              ) : (
                <Input
                  type={field.type || 'text'}
                  value={data[field.key] || ''}
                  onChange={(e) => handleChange(field.key, field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value)}
                  placeholder={field.placeholder}
                  className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 text-white"
            style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}
          >
            {submitting ? 'שומר...' : 'שמור'}
          </Button>
          <Button variant="outline" onClick={() => onClose(false)} className="border-gray-600 text-gray-300 hover:bg-[#142e38]">
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}