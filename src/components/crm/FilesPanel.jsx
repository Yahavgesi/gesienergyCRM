import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Trash2, ExternalLink } from "lucide-react";
import moment from "moment";

export default function FilesPanel({ entityType, entityId }) {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: files = [] } = useQuery({
    queryKey: ['files', entityType, entityId],
    queryFn: async () => {
      const activities = await base44.entities.ActivityLog.filter({
        entity_type: entityType,
        entity_id: entityId,
        action_type: 'file_uploaded',
      }, '-created_date');
      return activities;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const user = await base44.auth.me();
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      return base44.entities.ActivityLog.create({
        entity_type: entityType,
        entity_id: entityId,
        action_type: 'file_uploaded',
        actor_email: user.email,
        actor_name: user.full_name || user.email,
        description: `העלה קובץ: ${file.name}`,
        metadata: { file_url, file_name: file.name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['files', entityType, entityId]);
      setUploading(false);
    },
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    uploadMutation.mutate(file);
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ActivityLog.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['files', entityType, entityId]),
  });

  return (
    <div className="gesi-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">קבצים</h3>
        <label className="cursor-pointer">
          <Button as="span" size="sm" className="bg-[#2dd4a8] hover:bg-[#1fa882]" disabled={uploading}>
            <Upload className="w-4 h-4 ml-1" />
            {uploading ? 'מעלה...' : 'העלה קובץ'}
          </Button>
          <input type="file" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      <div className="space-y-2">
        {files.map(file => (
          <div key={file.id} className="flex items-center gap-3 bg-[#142e38] rounded-lg p-3">
            <FileText className="w-5 h-5 text-[#2dd4a8] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{file.metadata?.file_name || 'קובץ'}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{file.actor_name}</span>
                <span>•</span>
                <span>{moment(file.created_date).format('DD/MM/YY')}</span>
              </div>
            </div>
            <a href={file.metadata?.file_url} target="_blank" rel="noopener noreferrer" className="text-[#2dd4a8] hover:text-[#1fa882]">
              <ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={() => deleteMutation.mutate(file.id)} className="text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {files.length === 0 && <p className="text-center text-gray-500 py-8">אין קבצים</p>}
      </div>
    </div>
  );
}