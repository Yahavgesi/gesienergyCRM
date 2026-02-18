import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileText, ExternalLink } from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import moment from "moment";

export default function DocumentsPanel({ customerId, projectId, companyId }) {
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', customerId, projectId, companyId],
    queryFn: async () => {
      let docs = await base44.entities.Document.list('-created_date');
      if (customerId) docs = docs.filter(d => d.customer_id === customerId);
      if (projectId) docs = docs.filter(d => d.project_id === projectId);
      return docs;
    },
  });

  return (
    <div className="space-y-3">
      {documents.map(doc => (
        <div key={doc.id} className="gesi-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#2dd4a8]" />
            <div>
              <h4 className="text-sm font-semibold text-white">{doc.title}</h4>
              <p className="text-xs text-gray-400">{doc.category} • {moment(doc.created_date).format('DD/MM/YY')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={doc.status} />
            {doc.file_url && (
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[#2dd4a8] hover:text-[#1fa882]">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      ))}
      {documents.length === 0 && <p className="text-center text-gray-500 py-8">אין מסמכים</p>}
    </div>
  );
}