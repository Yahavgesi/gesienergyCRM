import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../components/shared/EmptyState";
import SkeletonCard from "../components/shared/SkeletonCard";
import StatusBadge from "../components/shared/StatusBadge";
import { FileText, Eye, PenTool, Upload, FileCheck, FolderOpen, Shield, File, Folder } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categoryLabels = {
  contract: { label: "חוזה", icon: FileCheck },
  utility_forms: { label: "טפסי חברת חשמל", icon: FolderOpen },
  office_forms: { label: "טפסי משרד", icon: File },
  permits: { label: "היתרים", icon: Shield },
  other: { label: "אחר", icon: FileText },
};

const statusLabels = {
  draft: "טיוטה",
  pending_signature: "ממתין לחתימה",
  signed: "נחתם",
  approved: "אושר",
  rejected: "נדחה",
};

export default function CustomerDocuments() {
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['customer-documents', user?.email],
    queryFn: () => base44.entities.Document.filter({ customer_email: user.email }, '-created_date'),
    enabled: !!user?.email,
    initialData: [],
  });

  const signMutation = useMutation({
    mutationFn: (doc) => base44.entities.Document.update(doc.id, {
      status: "signed",
      signed_by: [...(doc.signed_by || []), user.email],
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-documents'] }),
  });

  const filtered = activeCategory === "all" ? documents : documents.filter(d => d.category === activeCategory);

  if (isLoading) {
    return <div className="p-4 space-y-3" dir="rtl">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>;
  }

  const signedDocsCount = documents.filter(d => d.status === 'signed').length;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-white">מסמכים</h1>
        {signedDocsCount > 0 && (
          <Link 
            to={createPageUrl("SystemFolder")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)', color: 'white' }}
          >
            <Folder className="w-3.5 h-3.5" />
            תיק מערכת ({signedDocsCount})
          </Link>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            activeCategory === "all" ? 'bg-[#2dd4a8]/20 text-[#2dd4a8] border border-[#2dd4a8]/30' : 'bg-[#142e38] text-gray-400 border border-transparent'
          }`}
        >
          הכל ({documents.length})
        </button>
        {Object.entries(categoryLabels).map(([key, val]) => {
          const count = documents.filter(d => d.category === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === key ? 'bg-[#2dd4a8]/20 text-[#2dd4a8] border border-[#2dd4a8]/30' : 'bg-[#142e38] text-gray-400 border border-transparent'
              }`}
            >
              {val.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="אין מסמכים" description="המסמכים שלך יופיעו כאן" />
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {filtered.map((doc, i) => {
              const CatIcon = categoryLabels[doc.category]?.icon || FileText;
              const needsSign = doc.status === 'pending_signature' && !(doc.signed_by || []).includes(user?.email);

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`gesi-card p-4 ${needsSign ? 'border-amber-500/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      needsSign ? 'bg-amber-500/10' : 'bg-[#142e38]'
                    }`}>
                      <CatIcon className={`w-5 h-5 ${needsSign ? 'text-amber-400' : 'text-[#2dd4a8]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={doc.status === 'pending_signature' ? 'waiting_customer' : doc.status === 'signed' ? 'completed' : 'pending'} label={statusLabels[doc.status]} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#142e38] text-gray-300 text-xs font-medium hover:bg-[#1a3a47] transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        צפייה
                      </a>
                    )}
                    {needsSign ? (
                      <button
                        onClick={() => signMutation.mutate(doc)}
                        disabled={signMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)', color: 'white' }}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        חתימה
                      </button>
                    ) : doc.status === 'signed' && (
                      <Link
                        to={createPageUrl("SystemFolder")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#2dd4a8]/30 text-[#2dd4a8] text-xs font-medium hover:bg-[#2dd4a8]/10 transition-colors"
                      >
                        <Folder className="w-3.5 h-3.5" />
                        תיק מערכת
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}