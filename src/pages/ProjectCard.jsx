import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Edit, DollarSign, Upload, Zap, User, CheckCircle2, Briefcase } from "lucide-react";
import { createPageUrl } from "../utils";
import StatusBadge from "../components/shared/StatusBadge";
import FormModal from "../components/crm/FormModal";
import ActivityTimeline from "../components/crm/ActivityTimeline";
import InternalChat from "../components/crm/InternalChat";
import TasksPanel from "../components/crm/TasksPanel";
import FilesPanel from "../components/crm/FilesPanel";
import DocumentsPanel from "../components/crm/DocumentsPanel";
import PaymentsPanel from "../components/crm/PaymentsPanel";
import ProjectFinancials from "../components/crm/ProjectFinancials";

export default function ProjectCard() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: '', type: 'deposit', installments: 1 });

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => base44.entities.Project.get(id),
  });

  const { data: steps = [] } = useQuery({
    queryKey: ['project-steps', id],
    queryFn: () => base44.entities.ProjectStep.filter({ project_id: id }, 'step_index'),
    enabled: !!id,
  });

  const { data: contact } = useQuery({
    queryKey: ['contact', project?.customer_id],
    queryFn: () => base44.entities.Contact.get(project.customer_id),
    enabled: !!project?.customer_id,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', 'project', id],
    queryFn: () => base44.entities.ActivityLog.filter({ entity_type: 'project', entity_id: id }, '-created_date'),
    enabled: !!id,
  });

  const { data: simulations = [] } = useQuery({
    queryKey: ['simulations', id],
    queryFn: () => base44.entities.Simulation.filter({ project_id: id }, '-created_date'),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      queryClient.invalidateQueries(['crm-projects']);
      setEditOpen(false);
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const paymentRequest = await base44.entities.PaymentRequest.create({
        project_id: id,
        customer_email: project.customer_email,
        contact_id: project.customer_id,
        ...data,
      });
      
      // Create Stripe checkout
      const response = await base44.functions.invoke('stripeCreateCheckout', {
        payment_request_id: paymentRequest.id,
      });

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['payments']);
      setPaymentOpen(false);
      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
      }
    },
  });

  if (isLoading) {
    return <div className="p-8"><div className="animate-pulse h-96 bg-[#142e38] rounded-xl" /></div>;
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  const editFields = [
    { key: 'title', label: 'שם פרויקט', type: 'text' },
    { key: 'kwp', label: 'kWp', type: 'number' },
    { key: 'address', label: 'כתובת', type: 'text' },
    { key: 'status', label: 'סטטוס', type: 'select', options: [
      { value: 'active', label: 'פעיל' },
      { value: 'on_hold', label: 'מושהה' },
      { value: 'completed', label: 'הושלם' },
      { value: 'cancelled', label: 'בוטל' },
    ]},
    { key: 'estimated_completion', label: 'צפי סיום', type: 'date' },
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
                {/* Project Icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2dd4a8] to-[#1fa882] flex items-center justify-center text-white shadow-xl">
                  <div className="text-3xl font-bold">{project.title?.[0] || 'P'}</div>
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold text-white">{project.title}</h1>
                    <StatusBadge status={project.status} />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <div className="w-8 h-8 rounded-lg bg-[#2dd4a8]/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-[#2dd4a8]" />
                      </div>
                      <span className="font-semibold">{project.kwp} kWp</span>
                    </div>
                    {contact && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-400" />
                        </div>
                        <span>{contact.full_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-300">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      </div>
                      <span>{project.current_step || 'טרם החל'}</span>
                    </div>
                  </div>
                  
                  <div className="w-80">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span className="font-medium">התקדמות פרויקט</span>
                      <span className="font-bold text-[#2dd4a8]">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-[#142e38] rounded-full overflow-hidden border border-[rgba(45,212,168,0.1)]">
                      <div 
                        className="h-full bg-gradient-to-l from-[#2dd4a8] to-[#1fa882] transition-all duration-500 shadow-lg shadow-[#2dd4a8]/20" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>{completedSteps} הושלמו</span>
                      <span>{steps.length} שלבים סה"כ</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => setPaymentOpen(true)} 
                  className="bg-gradient-to-r from-[#2dd4a8] to-[#1fa882] hover:shadow-lg hover:shadow-[#2dd4a8]/25 transition-all"
                >
                  <DollarSign className="w-4 h-4 ml-2" />
                  בקשת תשלום
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => { setEditData(project); setEditOpen(true); }} 
                  className="border-gray-600 hover:bg-[#1a3a47]"
                >
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
              <TabsTrigger value="financials" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">כספים</TabsTrigger>
              <TabsTrigger value="steps" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">שלבים</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">מסמכים</TabsTrigger>
              <TabsTrigger value="simulations" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">הדמיות</TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">תשלומים</TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">צ'אט</TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">פעילות</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">משימות</TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3">קבצים</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#2dd4a8]/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-[#2dd4a8]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">פרטי פרויקט</h3>
                </div>
                <div className="space-y-3">
                  <InfoRow label="שם" value={project.title} />
                  <InfoRow label="לקוח" value={project.customer_name} />
                  <InfoRow label="kWp" value={project.kwp} />
                  <InfoRow label="כתובת" value={project.address} />
                  <InfoRow label="סוג" value={project.type} />
                  <InfoRow label="סטטוס" value={project.status} />
                  <InfoRow label="תחילה" value={project.start_date ? new Date(project.start_date).toLocaleDateString('he-IL') : '—'} />
                  <InfoRow label="צפי סיום" value={project.estimated_completion ? new Date(project.estimated_completion).toLocaleDateString('he-IL') : '—'} />
                </div>
              </div>

              {contact && (
                <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">פרטי לקוח</h3>
                  </div>
                  <div className="space-y-3">
                    <InfoRow label="שם" value={contact.full_name} />
                    <InfoRow label="טלפון" value={contact.phone} />
                    <InfoRow label="אימייל" value={contact.email} />
                    <InfoRow label="כתובת" value={contact.address} />
                  </div>
                  <div className="pt-6">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(createPageUrl(`ContactCard?id=${contact.id}`))}
                      className="w-full border-gray-600 hover:bg-[#1a3a47]"
                    >
                      פתח כרטיס לקוח
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="financials" className="mt-6">
            <ProjectFinancials project={project} />
          </TabsContent>

          <TabsContent value="steps" className="p-6">
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={step.id} className="rounded-xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-4 hover:border-[rgba(45,212,168,0.2)] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                      step.status === 'completed' ? 'bg-[#2dd4a8]/20 text-[#2dd4a8] border-2 border-[#2dd4a8]' :
                      step.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-400' :
                      'bg-gray-500/10 text-gray-500 border-2 border-gray-600'
                    }`}>
                      {step.step_index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white mb-1">{step.name}</h4>
                      <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                    <StatusBadge status={step.status} />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsPanel projectId={id} />
          </TabsContent>

          <TabsContent value="simulations">
            <div className="space-y-3">
              {simulations.map(sim => (
                <div key={sim.id} className="gesi-card p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold text-white">הדמיה גרסה {sim.version}</h4>
                      <p className="text-xs text-gray-400">{new Date(sim.created_date).toLocaleDateString('he-IL')}</p>
                    </div>
                    <StatusBadge status={sim.status} />
                  </div>
                </div>
              ))}
              {simulations.length === 0 && <p className="text-center text-gray-500 py-8">אין הדמיות</p>}
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsPanel projectId={id} />
          </TabsContent>

          <TabsContent value="chat">
            <InternalChat entityType="project" entityId={id} />
          </TabsContent>

          <TabsContent value="timeline">
            <ActivityTimeline activities={activities} />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksPanel entityType="project" entityId={id} />
          </TabsContent>

          <TabsContent value="files">
            <FilesPanel entityType="project" entityId={id} />
          </TabsContent>
        </Tabs>
      </div>

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="ערוך פרויקט"
        fields={editFields}
        data={editData}
        setData={setEditData}
        onSubmit={() => updateMutation.mutate(editData)}
        submitting={updateMutation.isPending}
      />

      <FormModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="בקשת תשלום"
        fields={[
          { key: 'amount', label: 'סכום', type: 'number', placeholder: '0' },
          { key: 'type', label: 'סוג', type: 'select', options: [
            { value: 'deposit', label: 'מקדמה' },
            { value: 'milestone', label: 'אבן דרך' },
            { value: 'final_payment', label: 'תשלום סופי' },
          ]},
          { key: 'installments', label: 'תשלומים', type: 'number', placeholder: '1' },
          { key: 'description', label: 'תיאור', type: 'textarea' },
        ]}
        data={paymentData}
        setData={setPaymentData}
        onSubmit={() => createPaymentMutation.mutate(paymentData)}
        submitting={createPaymentMutation.isPending}
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