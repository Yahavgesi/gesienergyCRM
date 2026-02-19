import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import EmptyState from "../components/shared/EmptyState";
import SkeletonCard from "../components/shared/SkeletonCard";
import StatusBadge from "../components/shared/StatusBadge";
import { FileText, Eye, Download, FolderOpen, CheckCircle2, Clock, Shield, File } from "lucide-react";

const categoryLabels = {
  contract: { label: "חוזה", icon: FileText, color: "blue" },
  utility_forms: { label: "טפסי חברת חשמל", icon: FolderOpen, color: "amber" },
  office_forms: { label: "טפסי משרד", icon: File, color: "purple" },
  permits: { label: "היתרים", icon: Shield, color: "green" },
  other: { label: "אחר", icon: FileText, color: "gray" },
};

const statusLabels = {
  draft: "טיוטה",
  pending_signature: "ממתין לחתימה",
  signed: "נחתם ✓",
  approved: "אושר",
  rejected: "נדחה",
};

export default function SystemFolder() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['system-folder', user?.email],
    queryFn: () => base44.entities.Document.filter({ 
      customer_email: user.email,
      status: 'signed'  // רק מסמכים חתומים בתיק מערכת
    }, '-created_date'),
    enabled: !!user?.email,
    initialData: [],
  });

  if (isLoading) {
    return <div className="p-4 space-y-3" dir="rtl">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;
  }

  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {});

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2dd4a8] to-[#1fa882] flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">תיק מערכת</h1>
            <p className="text-xs text-gray-400">כל המסמכים החתומים שלך במקום אחד</p>
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <EmptyState 
          icon={FolderOpen} 
          title="אין מסמכים בתיק" 
          description="מסמכים חתומים יופיעו כאן אוטומטית"
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocs).map(([category, docs]) => {
            const config = categoryLabels[category] || categoryLabels.other;
            const Icon = config.icon;
            
            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Icon className={`w-4 h-4 text-${config.color}-400`} />
                  <h2 className="text-sm font-semibold text-white">{config.label}</h2>
                  <span className="text-xs text-gray-500">({docs.length})</span>
                </div>

                <div className="space-y-2">
                  {docs.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="gesi-card p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-${config.color}-500/10 flex items-center justify-center flex-shrink-0`}>
                          <CheckCircle2 className={`w-5 h-5 text-${config.color}-400`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>נחתם ב-{new Date(doc.updated_date).toLocaleDateString('he-IL')}</span>
                            {doc.version && (
                              <>
                                <span>•</span>
                                <span>גרסה {doc.version}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {doc.signed_pdf_url ? (
                          <>
                            <a 
                              href={doc.signed_pdf_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#142e38] text-gray-300 text-xs font-medium hover:bg-[#1a3a47] transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              צפייה
                            </a>
                            <a 
                              href={doc.signed_pdf_url} 
                              download
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all"
                              style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)', color: 'white' }}
                            >
                              <Download className="w-3.5 h-3.5" />
                              הורדה
                            </a>
                          </>
                        ) : doc.file_url && (
                          <a 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#142e38] text-gray-300 text-xs font-medium hover:bg-[#1a3a47] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            צפייה
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}