import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Edit, Phone, Mail, MapPin, ExternalLink, Users } from "lucide-react";
import { createPageUrl } from "../utils";
import StatusBadge from "../components/shared/StatusBadge";
import FormModal from "../components/crm/FormModal";
import ActivityTimeline from "../components/crm/ActivityTimeline";
import InternalChat from "../components/crm/InternalChat";
import TasksPanel from "../components/crm/TasksPanel";
import FilesPanel from "../components/crm/FilesPanel";
import DocumentsPanel from "../components/crm/DocumentsPanel";
import PaymentsPanel from "../components/crm/PaymentsPanel";

export default function CompanyCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => base44.entities.Company.get(id),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', 'company', id],
    queryFn: () => base44.entities.Contact.filter({ company_id: id }),
    enabled: !!id,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'company', id],
    queryFn: async () => {
      const allProjects = await base44.entities.Project.list();
      return allProjects.filter(p => contacts.some(c => c.id === p.customer_id));
    },
    enabled: contacts.length > 0,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', 'company', id],
    queryFn: () => base44.entities.ActivityLog.filter({ entity_type: 'company', entity_id: id }, '-created_date'),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['company', id]);
      setEditOpen(false);
    },
  });

  if (isLoading) {
    return <div className="p-8"><div className="animate-pulse h-96 bg-[#142e38] rounded-xl" /></div>;
  }

  const editFields = [
    { key: 'name', label: 'שם חברה', type: 'text' },
    { key: 'business_number', label: 'ח.פ.', type: 'text' },
    { key: 'phone', label: 'טלפון', type: 'text' },
    { key: 'email', label: 'אימייל', type: 'email' },
    { key: 'address', label: 'כתובת', type: 'text' },
    { key: 'city', label: 'עיר', type: 'text' },
    { key: 'status', label: 'סטטוס', type: 'select', options: [
      { value: 'active', label: 'פעיל' },
      { value: 'inactive', label: 'לא פעיל' },
    ]},
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
                <h1 className="text-2xl font-bold text-white">{company.name}</h1>
                <StatusBadge status={company.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                {company.business_number && <span>ח.פ. {company.business_number}</span>}
                {company.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{company.phone}</div>}
                {company.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{company.email}</div>}
                {company.city && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{company.city}</div>}
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={() => { setEditData(company); setEditOpen(true); }} className="border-gray-600">
            <Edit className="w-4 h-4 ml-2" />
            ערוך
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-[#142e38] border-b border-[rgba(45,212,168,0.1)]">
            <TabsTrigger value="overview">סקירה</TabsTrigger>
            <TabsTrigger value="contacts">אנשי קשר</TabsTrigger>
            <TabsTrigger value="projects">פרויקטים</TabsTrigger>
            <TabsTrigger value="documents">מסמכים</TabsTrigger>
            <TabsTrigger value="payments">תשלומים</TabsTrigger>
            <TabsTrigger value="chat">צ'אט</TabsTrigger>
            <TabsTrigger value="timeline">פעילות</TabsTrigger>
            <TabsTrigger value="tasks">משימות</TabsTrigger>
            <TabsTrigger value="files">קבצים</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="gesi-card p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">פרטי חברה</h3>
              <InfoRow label="שם חברה" value={company.name} />
              <InfoRow label="ח.פ." value={company.business_number} />
              <InfoRow label="טלפון" value={company.phone} />
              <InfoRow label="אימייל" value={company.email} />
              <InfoRow label="כתובת" value={company.address} />
              <InfoRow label="עיר" value={company.city} />
              <InfoRow label="סוכן" value={company.assigned_agent} />
              <InfoRow label="סטטוס" value={company.status} />
            </div>
          </TabsContent>

          <TabsContent value="contacts">
            <div className="space-y-3">
              {contacts.map(c => (
                <Link key={c.id} to={createPageUrl(`ContactCard/${c.id}`)} className="block gesi-card p-4 hover:bg-[#1a3a47] transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-white">{c.full_name}</h4>
                      <p className="text-sm text-gray-400">{c.phone} • {c.email}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </div>
                </Link>
              ))}
              {contacts.length === 0 && <p className="text-center text-gray-500 py-8">אין אנשי קשר</p>}
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <div className="space-y-3">
              {projects.map(p => (
                <Link key={p.id} to={createPageUrl(`ProjectCard/${p.id}`)} className="block gesi-card p-4 hover:bg-[#1a3a47] transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-white">{p.title}</h4>
                      <p className="text-sm text-gray-400">{p.kwp} kWp • {p.current_step || 'טרם החל'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </Link>
              ))}
              {projects.length === 0 && <p className="text-center text-gray-500 py-8">אין פרויקטים</p>}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsPanel companyId={id} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsPanel companyId={id} />
          </TabsContent>

          <TabsContent value="chat">
            <InternalChat entityType="company" entityId={id} />
          </TabsContent>

          <TabsContent value="timeline">
            <ActivityTimeline activities={activities} />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksPanel entityType="company" entityId={id} />
          </TabsContent>

          <TabsContent value="files">
            <FilesPanel entityType="company" entityId={id} />
          </TabsContent>
        </Tabs>
      </div>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="ערוך חברה"
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