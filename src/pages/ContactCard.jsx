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
                <h1 className="text-2xl font-bold text-white">{contact.full_name}</h1>
                <StatusBadge status={contact.status} />
                {contact.lead_id && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">הומר מליד</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                {contact.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</div>}
                {contact.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</div>}
                {contact.city && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{contact.city}</div>}
                {contact.company_id && <div className="flex items-center gap-1"><Building2 className="w-3 h-3" />חברה משויכת</div>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setContractOpen(true)} style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
              <FileText className="w-4 h-4 ml-2" />
              הסכם חדש
            </Button>
            <Button onClick={() => { setProjectData({}); setProjectOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Briefcase className="w-4 h-4 ml-2" />
              פרויקט חדש
            </Button>
            <Button variant="outline" onClick={() => { setEditData(contact); setEditOpen(true); }} className="border-gray-600">
              <Edit className="w-4 h-4 ml-2" />
              ערוך
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-[#142e38] border-b border-[rgba(45,212,168,0.1)]">
            <TabsTrigger value="overview">סקירה</TabsTrigger>
            {leadHistory && <TabsTrigger value="lead-history">היסטוריית ליד</TabsTrigger>}
            <TabsTrigger value="projects">פרויקטים</TabsTrigger>
            <TabsTrigger value="documents">מסמכים</TabsTrigger>
            <TabsTrigger value="payments">תשלומים</TabsTrigger>
            <TabsTrigger value="chat">צ'אט</TabsTrigger>
            <TabsTrigger value="timeline">פעילות</TabsTrigger>
            <TabsTrigger value="tasks">משימות</TabsTrigger>
            <TabsTrigger value="files">קבצים</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Quick Stats */}
              <div className="gesi-card p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#2dd4a8]/20 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[#2dd4a8]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{projects.length}</p>
                  <p className="text-xs text-gray-400">פרויקטים</p>
                </div>
              </div>
              
              <div className="gesi-card p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{documents.length}</p>
                  <p className="text-xs text-gray-400">מסמכים</p>
                </div>
              </div>

              <div className="gesi-card p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{contact.status === 'active' ? 'פעיל' : contact.status === 'vip' ? 'VIP' : 'לא פעיל'}</p>
                  <p className="text-xs text-gray-400">סטטוס</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="gesi-card p-6 space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#2dd4a8]" />
                  פרטי לקוח
                </h3>
                <InfoRow label="שם מלא" value={contact.full_name} />
                <InfoRow label="טלפון" value={contact.phone} />
                <InfoRow label="אימייל" value={contact.email} />
                <InfoRow label="ת.ז." value={contact.id_number} />
                <InfoRow label="כתובת" value={contact.address} />
                <InfoRow label="עיר" value={contact.city} />
                <InfoRow label="שפה" value={contact.language} />
                <InfoRow label="סוכן" value={contact.assigned_agent} />
              </div>

              <div className="gesi-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">סטטוס ומידע</h3>
                <InfoRow label="סטטוס" value={contact.status} />
                <InfoRow label="משתמש מחובר" value={contact.user_email} />
                {contact.lead_id && <InfoRow label="מקור ליד" value="כן (לחץ על טאב היסטוריה)" />}
                <InfoRow label="נוצר בתאריך" value={new Date(contact.created_date).toLocaleDateString('he-IL')} />
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
          { key: 'kwp', label: 'kWp', type: 'number', placeholder: '0' },
          { key: 'address', label: 'כתובת התקנה', placeholder: contact.address || '' },
          { key: 'start_date', label: 'תאריך התחלה', type: 'date' },
          { key: 'estimated_completion', label: 'צפי סיום', type: 'date' },
        ]}
        data={projectData}
        setData={setProjectData}
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
    <div className="flex justify-between items-center py-2 border-b border-[rgba(45,212,168,0.05)]">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-white font-medium">{value || '—'}</span>
    </div>
  );
}