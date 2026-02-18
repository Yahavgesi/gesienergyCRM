import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2 } from "lucide-react";

export default function ContractModal({ open, onClose, contact, onSubmit, submitting }) {
  const [contractData, setContractData] = useState({
    system_kwp: '',
    installation_address: contact?.address || '',
    total_price: '',
    deposit_amount: '',
    deposit_percentage: '30',
    warranty_years: '25',
    estimated_completion_days: '60',
    notes: ''
  });

  const handleChange = (key, value) => {
    setContractData(prev => {
      const updated = { ...prev, [key]: value };
      
      // Auto-calculate deposit if percentage or price changes
      if (key === 'total_price' || key === 'deposit_percentage') {
        const price = parseFloat(key === 'total_price' ? value : prev.total_price) || 0;
        const percentage = parseFloat(key === 'deposit_percentage' ? value : prev.deposit_percentage) || 0;
        updated.deposit_amount = Math.round(price * (percentage / 100));
      }
      
      return updated;
    });
  };

  const handleSubmit = () => {
    onSubmit(contractData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2dd4a8]" />
            יצירת הסכם התקנה
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* System Details */}
          <div className="bg-[#142e38] p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-[#2dd4a8] text-sm">פרטי מערכת</h4>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">גודל מערכת (kWp)</Label>
              <Input
                type="number"
                value={contractData.system_kwp}
                onChange={(e) => handleChange('system_kwp', e.target.value)}
                placeholder="לדוגמה: 10"
                className="bg-[#0f2229] border-[rgba(45,212,168,0.1)] text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">כתובת התקנה</Label>
              <Input
                value={contractData.installation_address}
                onChange={(e) => handleChange('installation_address', e.target.value)}
                placeholder="כתובת מלאה"
                className="bg-[#0f2229] border-[rgba(45,212,168,0.1)] text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">משך זמן משוער לסיום (ימים)</Label>
              <Input
                type="number"
                value={contractData.estimated_completion_days}
                onChange={(e) => handleChange('estimated_completion_days', e.target.value)}
                className="bg-[#0f2229] border-[rgba(45,212,168,0.1)] text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">תקופת אחריות (שנים)</Label>
              <Input
                type="number"
                value={contractData.warranty_years}
                onChange={(e) => handleChange('warranty_years', e.target.value)}
                className="bg-[#0f2229] border-[rgba(45,212,168,0.1)] text-white"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-[#142e38] p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-[#2dd4a8] text-sm">תמחור ותשלום</h4>
            
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400">מחיר כולל (₪)</Label>
              <Input
                type="number"
                value={contractData.total_price}
                onChange={(e) => handleChange('total_price', e.target.value)}
                placeholder="לדוגמה: 50000"
                className="bg-[#0f2229] border-[rgba(45,212,168,0.1)] text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">אחוז מקדמה (%)</Label>
                <Input
                  type="number"
                  value={contractData.deposit_percentage}
                  onChange={(e) => handleChange('deposit_percentage', e.target.value)}
                  className="bg-[#0f2229] border-[rgba(45,212,168,0.1)] text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-400">סכום מקדמה (₪)</Label>
                <Input
                  type="number"
                  value={contractData.deposit_amount}
                  onChange={(e) => handleChange('deposit_amount', e.target.value)}
                  className="bg-[#0f2229] border-[rgba(45,212,168,0.1)] text-white"
                />
              </div>
            </div>

            {contractData.deposit_amount > 0 && (
              <div className="text-xs text-gray-400 bg-[#2dd4a8]/5 p-2 rounded border border-[#2dd4a8]/20">
                💡 הלקוח יתבקש לשלם מקדמה של <span className="font-bold text-[#2dd4a8]">₪{contractData.deposit_amount.toLocaleString()}</span> לאחר חתימה על ההסכם
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">הערות נוספות (יופיעו בהסכם)</Label>
            <Textarea
              value={contractData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="תנאים מיוחדים, הערות נוספות..."
              className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 min-h-[80px]"
            />
          </div>

          {/* Contact Info Preview */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
            <p className="text-xs text-blue-300 font-semibold mb-2">👤 פרטי לקוח</p>
            <div className="text-xs text-gray-300 space-y-1">
              <div><strong>שם:</strong> {contact.full_name}</div>
              <div><strong>ת.ז.:</strong> {contact.id_number || '—'}</div>
              <div><strong>טלפון:</strong> {contact.phone}</div>
              <div><strong>אימייל:</strong> {contact.email || '—'}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !contractData.system_kwp || !contractData.total_price}
            className="flex-1 text-white"
            style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                שולח לחתימה...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 ml-2" />
                צור הסכם ושלח לחתימה
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onClose(false)} 
            className="border-gray-600 text-gray-300 hover:bg-[#142e38]"
            disabled={submitting}
          >
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}