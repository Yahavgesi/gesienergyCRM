import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Building2, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function DepositPaymentModal({ open, onClose, document, contact }) {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const bankDetails = {
    bankName: "בנק הפועלים",
    branch: "748",
    accountNumber: "12-34567-89",
    accountName: "חברת GESI סולאר בע״מ"
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("הועתק ללוח");
  };

  const handleCreditCardPayment = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('stripeCreateCheckout', {
        amount: document.deposit_amount,
        currency: 'ILS',
        description: `מקדמה - ${document.title}`,
        customer_email: contact.email || contact.user_email,
        metadata: {
          document_id: document.id,
          contact_id: contact.id,
          type: 'deposit'
        }
      });

      if (response.data?.checkout_url) {
        window.open(response.data.checkout_url, '_blank');
        toast.success('עובר לדף תשלום מאובטח');
      }
    } catch (error) {
      toast.error('שגיאה ביצירת קישור תשלום');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateDepositMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Document.update(document.id, {
        deposit_paid: true
      });

      await base44.entities.ActivityLog.create({
        entity_type: 'contact',
        entity_id: contact.id,
        action_type: 'payment_paid',
        description: `מקדמה שולמה - ₪${document.deposit_amount} (העברה בנקאית)`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['activities']);
      toast.success('סטטוס עודכן - יש להמתין לאישור מנציג החברה');
      onClose();
    }
  });

  if (!paymentMethod) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white text-center">בחר אמצעי תשלום</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm mb-2">סכום מקדמה לתשלום</p>
              <p className="text-3xl font-bold text-[#2dd4a8]">₪{document.deposit_amount?.toLocaleString()}</p>
            </div>

            <button
              onClick={() => setPaymentMethod('credit_card')}
              className="w-full p-6 rounded-xl border-2 border-[rgba(45,212,168,0.2)] hover:border-[#2dd4a8] hover:bg-[#142e38] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2dd4a8]/20 flex items-center justify-center group-hover:bg-[#2dd4a8]/30">
                  <CreditCard className="w-6 h-6 text-[#2dd4a8]" />
                </div>
                <div className="text-right flex-1">
                  <h3 className="font-semibold text-white">כרטיס אשראי</h3>
                  <p className="text-xs text-gray-400">תשלום מיידי ומאובטח</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('bank_transfer')}
              className="w-full p-6 rounded-xl border-2 border-[rgba(45,212,168,0.2)] hover:border-[#2dd4a8] hover:bg-[#142e38] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-right flex-1">
                  <h3 className="font-semibold text-white">העברה בנקאית</h3>
                  <p className="text-xs text-gray-400">העברה ישירה לחשבון החברה</p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (paymentMethod === 'credit_card') {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#2dd4a8]" />
              תשלום בכרטיס אשראי
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-[#142e38] p-4 rounded-lg text-center">
              <p className="text-gray-400 text-sm mb-2">סכום לתשלום</p>
              <p className="text-3xl font-bold text-[#2dd4a8]">₪{document.deposit_amount?.toLocaleString()}</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-300">
                  <p className="font-semibold mb-1">תשלום מאובטח</p>
                  <p>התשלום מתבצע דרך Stripe - ספק תשלומים מוביל עולמי</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleCreditCardPayment}
                disabled={loading}
                className="flex-1 text-white"
                style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    טוען...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 ml-2" />
                    עבור לתשלום
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPaymentMethod(null)}
                className="border-gray-600"
                disabled={loading}
              >
                חזור
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (paymentMethod === 'bank_transfer') {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-[#0f2229] border-[rgba(45,212,168,0.15)] text-white max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              העברה בנקאית
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-[#142e38] p-4 rounded-lg text-center">
              <p className="text-gray-400 text-sm mb-2">סכום לתשלום</p>
              <p className="text-3xl font-bold text-[#2dd4a8]">₪{document.deposit_amount?.toLocaleString()}</p>
            </div>

            <div className="bg-[#142e38] p-4 rounded-lg space-y-3">
              <h4 className="font-semibold text-white text-sm mb-3">פרטי חשבון בנק</h4>
              
              <div className="flex justify-between items-center py-2 border-b border-[rgba(45,212,168,0.1)]">
                <span className="text-sm text-gray-400">שם בנק</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{bankDetails.bankName}</span>
                  <button onClick={() => copyToClipboard(bankDetails.bankName)} className="p-1 hover:bg-[#1a3a47] rounded">
                    <Copy className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[rgba(45,212,168,0.1)]">
                <span className="text-sm text-gray-400">סניף</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{bankDetails.branch}</span>
                  <button onClick={() => copyToClipboard(bankDetails.branch)} className="p-1 hover:bg-[#1a3a47] rounded">
                    <Copy className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[rgba(45,212,168,0.1)]">
                <span className="text-sm text-gray-400">מספר חשבון</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{bankDetails.accountNumber}</span>
                  <button onClick={() => copyToClipboard(bankDetails.accountNumber)} className="p-1 hover:bg-[#1a3a47] rounded">
                    <Copy className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">שם בעל החשבון</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{bankDetails.accountName}</span>
                  <button onClick={() => copyToClipboard(bankDetails.accountName)} className="p-1 hover:bg-[#1a3a47] rounded">
                    <Copy className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 text-xs font-bold">!</span>
                </div>
                <div className="text-xs text-amber-300">
                  <p className="font-semibold mb-1">חשוב!</p>
                  <p>לאחר ביצוע ההעברה, יש לשלוח אסמכתא/צילום מסך של ההעברה לנציג שלכם מטעם החברה לאישור.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => updateDepositMutation.mutate()}
                disabled={updateDepositMutation.isPending}
                className="flex-1 text-white"
                style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}
              >
                {updateDepositMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    שומר...
                  </>
                ) : (
                  'ביצעתי את ההעברה'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPaymentMethod(null)}
                className="border-gray-600"
                disabled={updateDepositMutation.isPending}
              >
                חזור
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}