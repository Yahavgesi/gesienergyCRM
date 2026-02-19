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
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
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
      queryClient.invalidateQueries(['crm-companies']);
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
    <div className="min-h-screen bg-[#0a1a1f]" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-[#0f2229] to-[#142e38] border-b border-[rgba(45,212,168,0.1)]">
          <div className="p-6 pb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="text-gray-400 hover:text-white hover:bg-[#1a3a47] mb-4"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              חזור
            </Button>

            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                {/* Company Icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white shadow-xl">
                  <Users className="w-10 h-10" />
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold text-white">{company.name}</h1>
                    <StatusBadge status={company.status} />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {company.business_number && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-400">ח.פ</span>
                        </div>
                        <span>{company.business_number}</span>
                      </div>
                    )}
                    {company.phone && (
                      <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-gray-300 hover:text-[#2dd4a8] transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-[#2dd4a8]/10 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-[#2dd4a8]" />
                        </div>
                        <span>{company.phone}</span>
                      </a>
                    )}
                    {company.email && (
                      <a href={`mailto:${company.email}`} className="flex items-center gap-2 text-gray-300 hover:text-[#2dd4a8] transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-blue-400" />
                        </div>
                        <span>{company.email}</span>
                      </a>
                    )}
                    {company.city && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-purple-400" />
                        </div>
                        <span>{company.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => { setEditData(company); setEditOpen(true); }} 
                className="border-gray-600 hover:bg-[#1a3a47]"
              >
                <Edit className="w-4 h-4 ml-2" />
                ערוך
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b border-[rgba(45,212,168,0.1)] bg-[#0d1f26] sticky top-0 z-10">
            <TabsList className="bg-transparent w-full justify-start px-6 py-0 h-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">סקירה</TabsTrigger>
              <TabsTrigger value="contacts" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">אנשי קשר</TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">פרויקטים</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">מסמכים</TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">תשלומים</TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">צ'אט</TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">פעילות</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">משימות</TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">קבצים</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">פרטי חברה</h3>
              </div>
              <div className="space-y-3">
                <InfoRow label="שם חברה" value={company.name} />
                <InfoRow label="ח.פ." value={company.business_number} />
                <InfoRow label="טלפון" value={company.phone} />
                <InfoRow label="אימייל" value={company.email} />
                <InfoRow label="כתובת" value={company.address} />
                <InfoRow label="עיר" value={company.city} />
                <InfoRow label="סוכן" value={company.assigned_agent} />
                <InfoRow label="סטטוס" value={company.status} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="p-6">
            <div className="space-y-3">
              {contacts.map(c => (
                <Link key={c.id} to={createPageUrl(`ContactCard?id=${c.id}`)} className="block rounded-xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-4 hover:border-[rgba(45,212,168,0.2)] transition-colors">
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

          <TabsContent value="projects" className="p-6">
            <div className="space-y-3">
              {projects.map(p => (
                <Link key={p.id} to={createPageUrl(`ProjectCard?id=${p.id}`)} className="block rounded-xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-4 hover:border-[rgba(45,212,168,0.2)] transition-colors">
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

          <TabsContent value="documents" className="p-6">
            <DocumentsPanel companyId={id} />
          </TabsContent>

          <TabsContent value="payments" className="p-6">
            <PaymentsPanel companyId={id} />
          </TabsContent>

          <TabsContent value="chat" className="p-6">
            <InternalChat entityType="company" entityId={id} />
          </TabsContent>

          <TabsContent value="timeline" className="p-6">
            <ActivityTimeline activities={activities} />
          </TabsContent>

          <TabsContent value="tasks" className="p-6">
            <TasksPanel entityType="company" entityId={id} />
          </TabsContent>

          <TabsContent value="files" className="p-6">
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
    <div className="flex justify-between items-center py-3 border-b border-[rgba(45,212,168,0.05)] last:border-0 hover:bg-[rgba(45,212,168,0.02)] transition-colors rounded-lg px-2">
      <span className="text-sm text-gray-400 font-medium">{label}</span>
      <span className="text-sm text-white font-semibold">{value || '—'}</span>
    </div>
  );
}