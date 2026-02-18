import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Edit, Phone, Mail, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { createPageUrl } from "../utils";
import StatusBadge from "../components/shared/StatusBadge";
import FormModal from "../components/crm/FormModal";
import ActivityTimeline from "../components/crm/ActivityTimeline";
import InternalChat from "../components/crm/InternalChat";
import TasksPanel from "../components/crm/TasksPanel";
import FilesPanel from "../components/crm/FilesPanel";
import CallsLog from "../components/crm/CallsLog";

export default function LeadCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => base44.entities.Lead.get(id),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', 'lead', id],
    queryFn: () => base44.entities.ActivityLog.filter({ entity_type: 'lead', entity_id: id }, '-created_date'),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lead', id]);
      queryClient.invalidateQueries(['crm-leads']);
      setEditOpen(false);
    },
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      // Create Contact
      const contact = await base44.entities.Contact.create({
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        city: lead.city,
        lead_id: lead.id,
        assigned_agent: lead.assigned_agent,
      });

      // Update lead
      await base44.entities.Lead.update(id, { status: 'converted' });

      // Log activity
      await base44.entities.ActivityLog.create({
        entity_type: 'lead',
        entity_id: id,
        action_type: 'status_change',
        description: `ליד הומר ללקוח: ${contact.full_name}`,
      });

      return contact;
    },
    onSuccess: (contact) => {
      queryClient.invalidateQueries(['lead', id]);
      navigate(createPageUrl(`ContactCard/${contact.id}`));
    },
  });

  if (isLoading) {
    return <div className="p-8"><div className="animate-pulse h-96 bg-[#142e38] rounded-xl" /></div>;
  }

  const editFields = [
    { key: 'full_name', label: 'שם מלא', type: 'text', placeholder: 'שם מלא' },
    { key: 'phone', label: 'טלפון', type: 'text', placeholder: '05X-XXXXXXX' },
    { key: 'email', label: 'אימייל', type: 'email', placeholder: 'email@example.com' },
    { key: 'address', label: 'כתובת', type: 'text', placeholder: 'רחוב X, עיר' },
    { key: 'city', label: 'עיר', type: 'text' },
    { key: 'status', label: 'סטטוס', type: 'select', options: [
      { value: 'new', label: 'חדש' },
      { value: 'contacted', label: 'יצרנו קשר' },
      { value: 'qualified', label: 'מוסמך' },
      { value: 'unqualified', label: 'לא מוסמך' },
    ]},
    { key: 'source', label: 'מקור', type: 'select', options: [
      { value: 'website', label: 'אתר' },
      { value: 'referral', label: 'המלצה' },
      { value: 'facebook', label: 'פייסבוק' },
      { value: 'google', label: 'גוגל' },
      { value: 'phone', label: 'טלפון' },
    ]},
    { key: 'roof_size_sqm', label: 'גודל גג (מ"ר)', type: 'number' },
    { key: 'estimated_kwp', label: 'kWp משוער', type: 'number' },
    { key: 'notes', label: 'הערות', type: 'textarea' },
  ];

  return (
    <div className="min-h-screen p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="border-gray-600">
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{lead.full_name}</h1>
                <StatusBadge status={lead.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                {lead.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</div>}
                {lead.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</div>}
                {lead.city && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.city}</div>}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {lead.status !== 'converted' && (
              <Button onClick={() => convertMutation.mutate()} className="bg-[#2dd4a8] hover:bg-[#1fa882]">
                <CheckCircle2 className="w-4 h-4 ml-2" />
                המר ללקוח
              </Button>
            )}
            <Button variant="outline" onClick={() => { setEditData(lead); setEditOpen(true); }} className="border-gray-600">
              <Edit className="w-4 h-4 ml-2" />
              ערוך
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-[#142e38] border-b border-[rgba(45,212,168,0.1)]">
            <TabsTrigger value="overview">סקירה</TabsTrigger>
            <TabsTrigger value="timeline">פעילות</TabsTrigger>
            <TabsTrigger value="chat">צ'אט פנימי</TabsTrigger>
            <TabsTrigger value="tasks">משימות</TabsTrigger>
            <TabsTrigger value="calls">שיחות</TabsTrigger>
            <TabsTrigger value="files">קבצים</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="gesi-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">פרטים</h3>
                <InfoRow label="שם" value={lead.full_name} />
                <InfoRow label="טלפון" value={lead.phone} />
                <InfoRow label="אימייל" value={lead.email} />
                <InfoRow label="כתובת" value={lead.address} />
                <InfoRow label="עיר" value={lead.city} />
                <InfoRow label="מקור" value={lead.source} />
                <InfoRow label="סוכן" value={lead.assigned_agent} />
              </div>

              <div className="gesi-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">מידע טכני</h3>
                <InfoRow label="גודל גג (מ״ר)" value={lead.roof_size_sqm} />
                <InfoRow label="kWp משוער" value={lead.estimated_kwp} />
                <InfoRow label="סוג נכס" value={lead.property_type} />
                <InfoRow label="הערות" value={lead.notes} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <ActivityTimeline activities={activities} />
          </TabsContent>

          <TabsContent value="chat">
            <InternalChat entityType="lead" entityId={id} />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksPanel entityType="lead" entityId={id} />
          </TabsContent>

          <TabsContent value="calls">
            <CallsLog entityType="lead" entityId={id} />
          </TabsContent>

          <TabsContent value="files">
            <FilesPanel entityType="lead" entityId={id} />
          </TabsContent>
        </Tabs>
      </div>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="ערוך ליד"
        fields={editFields}
        data={editData}
        setData={setEditData}
        onSubmit={() => updateMutation.mutate(editData)}
        submitting={updateMutation.isPending}
      />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[rgba(45,212,168,0.05)]">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-white font-medium">{value || '—'}</span>
    </div>
  );
}