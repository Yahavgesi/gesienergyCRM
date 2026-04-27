import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Edit, Phone, Mail, MapPin, ExternalLink,
  FileText, User, Briefcase, Plus, DollarSign, CheckCircle2,
  Clock, TrendingUp
} from "lucide-react";
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

const TAB_STYLE = "data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3 text-sm whitespace-nowrap";

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

  const { data: allPayments = [] } = useQuery({
    queryKey: ['contact-all-payments', id],
    queryFn: async () => {
      const projectIds = projects.map(p => p.id);
      if (!projectIds.length) return [];
      const all = await base44.entities.Payment.list('-created_date', 200);
      return all.filter(p => projectIds.includes(p.project_id) || p.customer_id === id);
    },
    enabled: !!id && projects.length > 0,
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contact', id]);
      queryClient.invalidateQueries(['crm-contacts']);
      setEditOpen(false);
      toast.success('איש קשר עודכן');
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data) => {
      const project = await base44.entities.Project.create({
        ...data,
        customer_id: id,
        customer_name: contact.full_name,
        customer_email: contact.user_email || contact.email,
        ...(data.price_per_kwp && data.kwp ? {
          price_per_kwp_with_vat: Math.round(parseFloat(data.price_per_kwp) * 1.18),
          total_price: Math.round(parseFloat(data.price_per_kwp) * 1.18 * parseFloat(data.kwp))
        } : {})
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
        defaultSteps.map(s => ({ ...s, project_id: project.id, customer_email: contact.user_email || contact.email, status: s.step_index === 0 ? "in_progress" : "pending" }))
      );
      await base44.entities.Project.update(project.id, { current_step: defaultSteps[0].name, current_step_index: 0 });
      await base44.entities.ActivityLog.create({
        entity_type: 'contact', entity_id: id,
        action_type: 'status_change',
        description: `פרויקט חדש נוצר: ${data.title}`,
      });
      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries(['projects', 'contact', id]);
      queryClient.invalidateQueries(['crm-projects']);
      setProjectOpen(false);
      toast.success('פרויקט נוצר בהצלחה');
      navigate(createPageUrl(`ProjectCard?id=${project.id}`));
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (contractData) => {
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
      await base44.entities.ActivityLog.create({
        entity_type: 'contact', entity_id: id,
        action_type: 'document_sent',
        description: `הסכם התקנה נוצר ונשלח לחתימה - מקדמה: ₪${contractData.deposit_amount}`
      });
      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', 'contact', id]);
      queryClient.invalidateQueries(['activities', 'contact', id]);
      setContractOpen(false);
      toast.success('הסכם נוצר בהצלחה');
    },
  });

  if (isLoading || !contact) {
    return <div className="p-8"><div className="animate-pulse h-96 bg-[#142e38] rounded-xl" /></div>;
  }

  const totalRevenue = allPayments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#0a1a1f]" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-[#0f2229] to-[#142e38] border-b border-[rgba(45,212,168,0.1)]">
          <div className="p-4 lg:p-6 pb-5">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white hover:bg-[#1a3a47] mb-3">
              <ArrowRight className="w-4 h-4 ml-2" /> חזור
            </Button>

            <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-[#2dd4a8] to-[#1fa882] flex items-center justify-center text-white text-2xl font-bold shadow-xl flex-shrink-0">
                  {contact.full_name?.[0] || 'C'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">{contact.full_name}</h1>
                    <StatusBadge status={contact.status === 'active' ? 'completed' : contact.status === 'vip' ? 'in_progress' : 'blocked'}
                      label={contact.status === 'active' ? 'פעיל' : contact.status === 'vip' ? 'VIP' : 'לא פעיל'} />
                    {contact.lead_id && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full">הומר מליד</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-gray-300 hover:text-[#2dd4a8] transition-colors">
                        <Phone className="w-4 h-4 text-[#2dd4a8]" /> {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-gray-300 hover:text-[#2dd4a8] transition-colors">
                        <Mail className="w-4 h-4 text-blue-400" /> {contact.email}
                      </a>
                    )}
                    {contact.city && (
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <MapPin className="w-4 h-4 text-purple-400" /> {contact.city}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setContractOpen(true)} className="bg-gradient-to-r from-[#2dd4a8] to-[#1fa882]">
                  <FileText className="w-4 h-4 ml-2" /> הסכם חדש
                </Button>
                <Button onClick={() => { setProjectData({}); setProjectOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
                  <Briefcase className="w-4 h-4 ml-2" /> פרויקט חדש
                </Button>
                <Button variant="outline" onClick={() => { setEditData(contact); setEditOpen(true); }} className="border-gray-600 hover:bg-[#1a3a47]">
                  <Edit className="w-4 h-4 ml-2" /> ערוך
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { label: 'פרויקטים', val: projects.length, icon: Briefcase, color: 'text-[#2dd4a8]' },
                { label: 'פרויקטים פעילים', val: activeProjects, icon: CheckCircle2, color: 'text-blue-400' },
                { label: 'גבייה', val: `₪${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-[#2dd4a8]' },
                { label: 'מסמכים', val: documents.length, icon: FileText, color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="bg-[#0a1a1f]/50 rounded-xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#142e38] flex items-center justify-center flex-shrink-0">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className={`text-base font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-gray-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b border-[rgba(45,212,168,0.1)] bg-[#0d1f26] sticky top-0 z-10 overflow-x-auto">
            <TabsList className="bg-transparent w-full justify-start px-4 py-0 h-auto min-w-max">
              <TabsTrigger value="overview" className={TAB_STYLE}>סקירה</TabsTrigger>
              {leadHistory && <TabsTrigger value="lead-history" className={TAB_STYLE}>היסטוריית ליד</TabsTrigger>}
              <TabsTrigger value="projects" className={TAB_STYLE}>פרויקטים ({projects.length})</TabsTrigger>
              <TabsTrigger value="documents" className={TAB_STYLE}>מסמכים ({documents.length})</TabsTrigger>
              <TabsTrigger value="payments" className={TAB_STYLE}>תשלומים</TabsTrigger>
              <TabsTrigger value="tasks" className={TAB_STYLE}>משימות</TabsTrigger>
              <TabsTrigger value="chat" className={TAB_STYLE}>צ'אט</TabsTrigger>
              <TabsTrigger value="timeline" className={TAB_STYLE}>פעילות</TabsTrigger>
              <TabsTrigger value="files" className={TAB_STYLE}>קבצים</TabsTrigger>
            </TabsList>
          </div>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="p-4 lg:p-6 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-[#2dd4a8]/10 flex items-center justify-center"><User className="w-4 h-4 text-[#2dd4a8]" /></div>
                  <h3 className="text-base font-semibold text-white">פרטי איש קשר</h3>
                </div>
                <InfoRow label="שם מלא" value={contact.full_name} />
                <InfoRow label="טלפון" value={contact.phone} />
                <InfoRow label="אימייל" value={contact.email} />
                <InfoRow label="ת.ז." value={contact.id_number} />
                <InfoRow label="כתובת" value={contact.address} />
                <InfoRow label="עיר" value={contact.city} />
                <InfoRow label="שפה" value={{ he: 'עברית', en: 'אנגלית', ar: 'ערבית', ru: 'רוסית' }[contact.language] || contact.language} />
                <InfoRow label="סוכן מטפל" value={contact.assigned_agent} />
                <InfoRow label="תאריך יצירה" value={contact.created_date ? new Date(contact.created_date).toLocaleDateString('he-IL') : '—'} />
              </div>

              <div className="space-y-4">
                {/* Financial summary */}
                <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-amber-400" /></div>
                    <h3 className="text-base font-semibold text-white">סיכום פיננסי</h3>
                  </div>
                  <InfoRow label="פרויקטים" value={projects.length} />
                  <InfoRow label="שווי פרויקטים" value={`₪${projects.reduce((s,p) => s+(p.total_price||0),0).toLocaleString()}`} />
                  <InfoRow label="גבייה" value={`₪${totalRevenue.toLocaleString()}`} />
                  <InfoRow label="ממתין לגבייה" value={`₪${totalPending.toLocaleString()}`} />
                </div>

                {/* Projects preview */}
                {projects.length > 0 && (
                  <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">פרויקטים</h3>
                      <span className="text-xs text-gray-500">{projects.length}</span>
                    </div>
                    <div className="space-y-2">
                      {projects.slice(0,3).map(p => (
                        <Link key={p.id} to={createPageUrl(`ProjectCard?id=${p.id}`)}
                          className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#142e38]/70 transition-colors group">
                          <div className="w-7 h-7 rounded-lg bg-[#2dd4a8]/10 flex items-center justify-center text-xs font-bold text-[#2dd4a8]">
                            {p.title?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{p.title}</p>
                            <p className="text-[10px] text-gray-500">{p.kwp} kWp • {p.current_step || '—'}</p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-[#2dd4a8] transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* LEAD HISTORY */}
          {leadHistory && (
            <TabsContent value="lead-history" className="p-4 lg:p-6">
              <div className="gesi-card p-5 mb-5">
                <h3 className="text-base font-semibold text-white mb-4">מקור ליד</h3>
                <div className="grid grid-cols-2 gap-0">
                  <InfoRow label="מקור" value={leadHistory.source} />
                  <InfoRow label="סטטוס" value={leadHistory.status} />
                  <InfoRow label="גודל גג" value={leadHistory.roof_size_sqm ? `${leadHistory.roof_size_sqm} מ״ר` : '—'} />
                  <InfoRow label="kWp משוער" value={leadHistory.estimated_kwp} />
                  <InfoRow label="מחיר לkWp" value={leadHistory.price_per_kwp ? `₪${leadHistory.price_per_kwp}` : '—'} />
                  <InfoRow label="עיר" value={leadHistory.city} />
                </div>
              </div>
              <ActivityTimeline activities={leadActivities} title="פעילות מליד" />
            </TabsContent>
          )}

          {/* PROJECTS */}
          <TabsContent value="projects" className="p-4 lg:p-6 space-y-3">
            <div className="flex justify-end">
              <Button onClick={() => { setProjectData({}); setProjectOpen(true); }} size="sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
                <Plus className="w-4 h-4 ml-1" /> פרויקט חדש
              </Button>
            </div>
            {projects.map(p => (
              <Link key={p.id} to={createPageUrl(`ProjectCard?id=${p.id}`)}
                className="block gesi-card p-4 hover:border-[#2dd4a8]/30 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2dd4a8]/10 flex items-center justify-center font-bold text-[#2dd4a8] flex-shrink-0">
                    {p.title?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{p.title}</h4>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-gray-400">{p.kwp} kWp • {p.current_step || 'טרם החל'} • {p.address || '—'}</p>
                    <div className="h-1.5 bg-[#142e38] rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#2dd4a8] to-[#1fa882] rounded-full"
                        style={{ width: `${Math.min(100, ((p.current_step_index || 0) / 9) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    {p.total_price > 0 && <p className="text-sm font-bold text-[#2dd4a8]">₪{p.total_price.toLocaleString()}</p>}
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-[#2dd4a8] mt-1 mr-auto transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">אין פרויקטים</p>
              </div>
            )}
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents">
            <DocumentsPanel customerId={id} contact={contact} />
          </TabsContent>

          {/* PAYMENTS */}
          <TabsContent value="payments">
            <PaymentsPanel customerId={id} />
          </TabsContent>

          <TabsContent value="tasks"><TasksPanel entityType="contact" entityId={id} /></TabsContent>
          <TabsContent value="chat"><InternalChat entityType="contact" entityId={id} /></TabsContent>
          <TabsContent value="timeline"><ActivityTimeline activities={activities} /></TabsContent>
          <TabsContent value="files"><FilesPanel entityType="contact" entityId={id} /></TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <FormModal open={editOpen} onClose={() => setEditOpen(false)} title="ערוך איש קשר"
        fields={[
          { key: 'full_name', label: 'שם מלא', type: 'text' },
          { key: 'phone', label: 'טלפון', type: 'text' },
          { key: 'email', label: 'אימייל', type: 'email' },
          { key: 'id_number', label: 'ת.ז.', type: 'text' },
          { key: 'address', label: 'כתובת', type: 'text' },
          { key: 'city', label: 'עיר', type: 'text' },
          { key: 'status', label: 'סטטוס', type: 'select', options: [
            { value: 'active', label: 'פעיל' }, { value: 'inactive', label: 'לא פעיל' }, { value: 'vip', label: 'VIP' },
          ]},
          { key: 'language', label: 'שפה', type: 'select', options: [
            { value: 'he', label: 'עברית' }, { value: 'en', label: 'אנגלית' },
            { value: 'ar', label: 'ערבית' }, { value: 'ru', label: 'רוסית' },
          ]},
        ]}
        data={editData} setData={setEditData}
        onSubmit={() => updateMutation.mutate(editData)} submitting={updateMutation.isPending} />

      <FormModal open={projectOpen} onClose={() => setProjectOpen(false)} title="פרויקט חדש"
        fields={[
          { key: 'title', label: 'שם פרויקט', placeholder: 'פרויקט התקנה סולארית' },
          { key: 'type', label: 'סוג', type: 'select', options: [
            { value: 'residential', label: 'פרטי' }, { value: 'commercial', label: 'מסחרי' }, { value: 'tender', label: 'מכרז' }
          ]},
          { key: 'kwp', label: 'גודל מערכת (kWp)', type: 'number', placeholder: '10' },
          { key: 'price_per_kwp', label: 'מחיר לkWp (ללא מע״מ)', type: 'number', placeholder: '4500' },
          { key: 'address', label: 'כתובת התקנה', placeholder: contact.address || '' },
          { key: 'start_date', label: 'תאריך התחלה', type: 'date' },
          { key: 'estimated_completion', label: 'צפי סיום', type: 'date' },
        ]}
        data={projectData} setData={setProjectData}
        onSubmit={() => createProjectMutation.mutate(projectData)} submitting={createProjectMutation.isPending} />

      <ContractModal open={contractOpen} onClose={() => setContractOpen(false)}
        contact={contact} onSubmit={(data) => createContractMutation.mutate(data)} submitting={createContractMutation.isPending} />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[rgba(45,212,168,0.05)] last:border-0 px-1">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-white font-medium">{value || '—'}</span>
    </div>
  );
}