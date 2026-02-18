import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileText, ExternalLink, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "../shared/StatusBadge";
import moment from "moment";
import DepositPaymentModal from "./DepositPaymentModal";

export default function DocumentsPanel({ customerId, projectId, companyId, contact }) {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', customerId, projectId, companyId],
    queryFn: async () => {
      let docs = await base44.entities.Document.list('-created_date');
      if (customerId) docs = docs.filter(d => d.contact_id === customerId);
      if (projectId) docs = docs.filter(d => d.project_id === projectId);
      return docs;
    },
  });

  const handlePayDeposit = (doc) => {
    setSelectedDocument(doc);
    setPaymentModalOpen(true);
  };

  return (
    <>
      <div className="space-y-3">
        {documents.map(doc => (
          <div key={doc.id} className="gesi-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#2dd4a8]" />
                <div>
                  <h4 className="text-sm font-semibold text-white">{doc.title}</h4>
                  <p className="text-xs text-gray-400">{doc.category} • {moment(doc.created_date).format('DD/MM/YY')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={doc.status === 'signed' ? 'completed' : doc.status === 'pending_signature' ? 'waiting_customer' : 'pending'} />
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[#2dd4a8] hover:text-[#1fa882]">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Deposit Payment Section */}
            {doc.category === 'contract' && doc.status === 'signed' && doc.deposit_amount > 0 && (
              <div className="mt-3 pt-3 border-t border-[rgba(45,212,168,0.1)]">
                {doc.deposit_paid ? (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-[#2dd4a8]/20 flex items-center justify-center">
                      <CreditCard className="w-3 h-3 text-[#2dd4a8]" />
                    </div>
                    <span className="text-[#2dd4a8] font-medium">מקדמה שולמה - ₪{doc.deposit_amount.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="text-gray-400">מקדמה לתשלום</p>
                      <p className="text-xl font-bold text-[#2dd4a8]">₪{doc.deposit_amount.toLocaleString()}</p>
                    </div>
                    <Button
                      onClick={() => handlePayDeposit(doc)}
                      size="sm"
                      style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}
                    >
                      <CreditCard className="w-4 h-4 ml-2" />
                      שלם מקדמה
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {documents.length === 0 && <p className="text-center text-gray-500 py-8">אין מסמכים</p>}
      </div>

      {selectedDocument && contact && (
        <DepositPaymentModal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedDocument(null);
          }}
          document={selectedDocument}
          contact={contact}
        />
      )}
    </>
  );
}