import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Edit, Phone, Mail, MapPin, Building2, ExternalLink, FileText, User, Briefcase } from "lucide-react";
import { createPageUrl } from "../utils";
import StatusBadge from "../components/shared/StatusBadge";
import FormModal from "../components/crm/FormModal";
import ActivityTimeline from "../components/crm/ActivityTimeline";
import InternalChat from "../components/crm/InternalChat";
import TasksPanel from "../components/crm/TasksPanel";
import FilesPanel from "../components/crm/FilesPanel";
import DocumentsPanel from "../components/crm/DocumentsPanel";
import PaymentsPanel from "../components/crm/PaymentsPanel";
import ContractModal from "../components/crm/ContractModal";
import { toast } from "sonner";

export default function ContactCard() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectData, setProjectData] = useState({});
  const [contractOpen, setContractOpen] = useState(false);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => base44.entities.Contact.get(id),
  });

  const { data: leadHistory } = useQuery({
    queryKey: ['lead', contact?.lead_id],
    queryFn: () => base44.entities.Lead.get(contact.lead_id),
    enabled: !!contact?.lead_id,
  });

  const { data: leadActivities = [] } = useQuery({
    queryKey: ['activities', 'lead', contact?.lead_id],
    queryFn: () => base44.entities.ActivityLog.filter({ entity_type: 'lead', entity_id: contact.lead_id }, '-created_date'),
    enabled: !!contact?.lead_id,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', 'contact', id],
    queryFn: () => base44.entities.ActivityLog.filter({ entity_type: 'contact', entity_id: id }, '-created_date'),
    enabled: !!id,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', 'contact', id],
    queryFn: () => base44.entities.Project.filter({ customer_id: id }),
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', 'contact', id],
    queryFn: () => base44.entities.Document.filter({ contact_id: id }, '-created_date'),
    enabled: !!id,
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contact', id]);
      queryClient.invalidateQueries(['crm-contacts']);
      setEditOpen(false);
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data) => {
      const project = await base44.entities.Project.create({
        ...data,
        customer_id: id,
        customer_name: contact.full_name,
        customer_email: contact.user_email,
      });

      const defaultSteps = [
        { name: "חתימת חוזה", description: "חתימה על חוזה התקנה", step_index: 0 },
        { name: "תשלום מקדמה", description: "תשלום מקדמה לפני תחילת עבודה", step_index: 1 },
        { name: "סקר גג", description: "ביצוע סקר הנדסי של הגג", step_index: 2 },
        { name: "תכנון מערכת", description: "תכנון ועיצוב המערכת הסולארית", step_index: 3 },
        { name: "היתרים ואישורים", description: "קבלת היתרים מחברת החשמל", step_index: 4 },
        { name: "הזמנת ציוד", description: "הזמנת פאנלים ומהפכים", step_index: 5 },
        { name: "התקנה", description: "התקנת המערכת על הגג", step_index: 6 },
        { name: "חיבור לרשת", description: "חיבור לרשת החשמל", step_index: 7 },
        { name: "בדיקות סופיות", description: "בדיקות ואישור תקינות", step_index: 8 },
        { name: "הפעלה", description: "הפעלת המערכת", step_index: 9 },
      ];

      await base44.entities.ProjectStep.bulkCreate(
        defaultSteps.map(s => ({ ...s, project_id: project.id, customer_email: contact.user_email, status: s.step_index === 0 ? "in_progress" : "pending" }))
      );

      await base44.entities.Project.update(project.id, { current_step: defaultSteps[0].name, current_step_index: 0 });

      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries(['projects']);
      navigate(createPageUrl(`ProjectCard/${project.id}`));
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (contractData) => {
      // Create document with contract data
      const document = await base44.entities.Document.create({
        title: `הסכם התקנה - ${contact.full_name}`,
        contact_id: id,
        customer_email: contact.email || contact.user_email,
        category: 'contract',
        status: 'pending_signature',
        deposit_amount: parseFloat(contractData.deposit_amount),
        template_data: {
          customer_name: contact.full_name,
          customer_id_number: contact.id_number,
          customer_phone: contact.phone,
          customer_email: contact.email || contact.user_email,
          customer_address: contact.address,
          ...contractData
        },
        required_signers: [contact.email || contact.user_email]
      });

      // Log activity
      await base44.entities.ActivityLog.create({
        entity_type: 'contact',
        entity_id: id,
        action_type: 'document_sent',
        description: `הסכם התקנה נוצר ונשלח לחתימה - מקדמה: ₪${contractData.deposit_amount}`
      });

      return document;
    },
    onSuccess: (document) => {
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['activities']);
      setContractOpen(false);
      toast.success('הסכם נוצר בהצלחה ונשלח לחתימה דיגיטלית');
    },
  });

  if (isLoading || !contact) {
    return <div className="p-8"><div className="animate-pulse h-96 bg-[#142e38] rounded-xl" /></div>;
  }

  const editFields = [
    { key: 'full_name', label: 'שם מלא', type: 'text' },
    { key: 'phone', label: 'טלפון', type: 'text' },
    { key: 'email', label: 'אימייל', type: 'email' },
    { key: 'id_number', label: 'ת.ז.', type: 'text' },
    { key: 'address', label: 'כתובת', type: 'text' },
    { key: 'city', label: 'עיר', type: 'text' },
    { key: 'status', label: 'סטטוס', type: 'select', options: [
      { value: 'active', label: 'פעיל' },
      { value: 'inactive', label: 'לא פעיל' },
      { value: 'vip', label: 'VIP' },
    ]},
    { key: 'language', label: 'שפה', type: 'select', options: [
      { value: 'he', label: 'עברית' },
      { value: 'en', label: 'אנגלית' },
      { value: 'ar', label: 'עברית' },
      { value: 'ru', label: 'רוסית' },
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
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2dd4a8] to-[#1fa882] flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                  {contact.full_name?.[0] || 'L'}
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold text-white">{contact.full_name}</h1>
                    <StatusBadge status={contact.status === 'active' ? 'completed' : contact.status === 'vip' ? 'in_progress' : 'blocked'} label={contact.status === 'active' ? 'פעיל' : contact.status === 'vip' ? 'VIP' : 'לא פעיל'} />
                  </div>
                  
                  {contact.lead_id && (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      הומר מליד
                    </span>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-gray-300 hover:text-[#2dd4a8] transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-[#2dd4a8]/10 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-[#2dd4a8]" />
                        </div>
                        <span>{contact.phone}</span>
                      </a>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-gray-300 hover:text-[#2dd4a8] transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-blue-400" />
                        </div>
                        <span>{contact.email}</span>
                      </a>
                    )}
                    {contact.city && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-purple-400" />
                        </div>
                        <span>{contact.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setContractOpen(true)} className="bg-gradient-to-r from-[#2dd4a8] to-[#1fa882] hover:shadow-lg hover:shadow-[#2dd4a8]/25 transition-all">
                  <FileText className="w-4 h-4 ml-2" />
                  הסכם חדש
                </Button>
                <Button onClick={() => { setProjectData({}); setProjectOpen(true); }} className="bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 transition-all">
                  <Briefcase className="w-4 h-4 ml-2" />
                  פרויקט חדש
                </Button>
                <Button variant="outline" onClick={() => { setEditData(contact); setEditOpen(true); }} className="border-gray-600 hover:bg-[#1a3a47]">
                  <Edit className="w-4 h-4 ml-2" />
                  ערוך
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b border-[rgba(45,212,168,0.1)] bg-[#0d1f26] sticky top-0 z-10">
            <TabsList className="bg-transparent w-full justify-start px-6 py-0 h-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">סקירה</TabsTrigger>
              {leadHistory && <TabsTrigger value="lead-history" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">היסטוריית ליד</TabsTrigger>}
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
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2dd4a8]/10 to-[#2dd4a8]/5 border border-[#2dd4a8]/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white mb-1">{projects.length}</p>
                    <p className="text-sm text-gray-400">פרויקטים פעילים</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-[#2dd4a8]/20 flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-[#2dd4a8]" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -left-2 w-24 h-24 bg-[#2dd4a8]/5 rounded-full blur-2xl" />
              </div>
              
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white mb-1">{documents.length}</p>
                    <p className="text-sm text-gray-400">מסמכים</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-blue-400" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -left-2 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-white mb-1">{contact.status === 'active' ? 'פעיל' : contact.status === 'vip' ? 'VIP' : 'לא פעיל'}</p>
                    <p className="text-sm text-gray-400">סטטוס לקוח</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <User className="w-7 h-7 text-purple-400" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -left-2 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#2dd4a8]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#2dd4a8]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">פרטי לקוח</h3>
                </div>
                <div className="space-y-3">
                  <InfoRow label="שם מלא" value={contact.full_name} />
                  <InfoRow label="טלפון" value={contact.phone} />
                  <InfoRow label="אימייל" value={contact.email} />
                  <InfoRow label="ת.ז." value={contact.id_number} />
                  <InfoRow label="כתובת" value={contact.address} />
                  <InfoRow label="עיר" value={contact.city} />
                  <InfoRow label="שפה" value={contact.language} />
                  <InfoRow label="סוכן מטפל" value={contact.assigned_agent} />
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">מידע נוסף</h3>
                </div>
                <div className="space-y-3">
                  <InfoRow label="סטטוס" value={contact.status} />
                  <InfoRow label="חשבון משתמש" value={contact.user_email} />
                  {contact.lead_id && <InfoRow label="מקור ליד" value="כן - ראה בטאב היסטוריה" />}
                  <InfoRow label="תאריך יצירה" value={new Date(contact.created_date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })} />
                  {contact.company_id && <InfoRow label="חברה משויכת" value="כן" />}
                </div>
              </div>
            </div>
          </TabsContent>

          {leadHistory && (
            <TabsContent value="lead-history" className="mt-6">
              <div className="gesi-card p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">📋 מקור ליד</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <InfoRow label="מקור" value={leadHistory.source} />
                  <InfoRow label="סטטוס ליד" value={leadHistory.status} />
                  <InfoRow label="גודל גג" value={leadHistory.roof_size_sqm} />
                  <InfoRow label="kWp משוער" value={leadHistory.estimated_kwp} />
                </div>
              </div>
              <ActivityTimeline activities={leadActivities} title="פעילות מליד" />
            </TabsContent>
          )}

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
            <DocumentsPanel customerId={id} contact={contact} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsPanel customerId={id} />
          </TabsContent>

          <TabsContent value="chat">
            <InternalChat entityType="contact" entityId={id} />
          </TabsContent>

          <TabsContent value="timeline">
            <ActivityTimeline activities={activities} />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksPanel entityType="contact" entityId={id} />
          </TabsContent>

          <TabsContent value="files">
            <FilesPanel entityType="contact" entityId={id} />
          </TabsContent>
        </Tabs>
      </div>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="ערוך לקוח"
        fields={editFields}
        data={editData}
        setData={setEditData}
        onSubmit={() => updateMutation.mutate(editData)}
        submitting={updateMutation.isPending}
      />

      <FormModal
        open={projectOpen}
        onClose={() => setProjectOpen(false)}
        title="פרויקט חדש"
        fields={[
          { key: 'title', label: 'שם פרויקט', placeholder: 'פרויקט התקנה סולארית' },
          { key: 'type', label: 'סוג', type: 'select', options: [
            { value: 'residential', label: 'פרטי' },
            { value: 'commercial', label: 'מסחרי' },
            { value: 'tender', label: 'מכרז' }
          ]},
          { key: 'kwp', label: 'גודל מערכת (kWp)', type: 'number', placeholder: '10' },
          { key: 'price_per_kwp', label: 'מחיר לקילו-וואט (ללא מע״מ)', type: 'number', placeholder: '4500' },
          { key: 'address', label: 'כתובת התקנה', placeholder: contact.address || '' },
          { key: 'start_date', label: 'תאריך התחלה', type: 'date' },
          { key: 'estimated_completion', label: 'צפי סיום', type: 'date' },
        ]}
        data={projectData}
        setData={(data) => {
          // Auto-calculate prices with VAT
          if (data.price_per_kwp && data.kwp) {
            const priceWithVat = parseFloat(data.price_per_kwp) * 1.18;
            const totalPrice = priceWithVat * parseFloat(data.kwp);
            data.price_per_kwp_with_vat = Math.round(priceWithVat);
            data.total_price = Math.round(totalPrice);
          }
          setProjectData(data);
        }}
        onSubmit={() => createProjectMutation.mutate(projectData)}
        submitting={createProjectMutation.isPending}
      />

      <ContractModal
        open={contractOpen}
        onClose={() => setContractOpen(false)}
        contact={contact}
        onSubmit={(data) => createContractMutation.mutate(data)}
        submitting={createContractMutation.isPending}
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