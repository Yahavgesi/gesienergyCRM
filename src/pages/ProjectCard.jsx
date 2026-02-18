import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Edit, DollarSign, Upload } from "lucide-react";
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
                <h1 className="text-2xl font-bold text-white">{project.title}</h1>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{project.kwp} kWp</span>
                <span>•</span>
                <span>{project.current_step || 'טרם החל'}</span>
                {contact && (
                  <>
                    <span>•</span>
                    <span>{contact.full_name}</span>
                  </>
                )}
              </div>
              <div className="mt-3 w-64">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>התקדמות</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-[#142e38] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-[#2dd4a8] to-[#1fa882] transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setPaymentOpen(true)} variant="outline" className="border-[#2dd4a8] text-[#2dd4a8]">
              <DollarSign className="w-4 h-4 ml-2" />
              בקשת תשלום
            </Button>
            <Button variant="outline" onClick={() => { setEditData(project); setEditOpen(true); }} className="border-gray-600">
              <Edit className="w-4 h-4 ml-2" />
              ערוך
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-[#142e38] border-b border-[rgba(45,212,168,0.1)]">
            <TabsTrigger value="overview">סקירה</TabsTrigger>
            <TabsTrigger value="financials">כספים</TabsTrigger>
            <TabsTrigger value="steps">שלבים</TabsTrigger>
            <TabsTrigger value="documents">מסמכים</TabsTrigger>
            <TabsTrigger value="simulations">הדמיות</TabsTrigger>
            <TabsTrigger value="payments">תשלומים</TabsTrigger>
            <TabsTrigger value="chat">צ'אט</TabsTrigger>
            <TabsTrigger value="timeline">פעילות</TabsTrigger>
            <TabsTrigger value="tasks">משימות</TabsTrigger>
            <TabsTrigger value="files">קבצים</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="gesi-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">פרטי פרויקט</h3>
                <InfoRow label="שם" value={project.title} />
                <InfoRow label="לקוח" value={project.customer_name} />
                <InfoRow label="kWp" value={project.kwp} />
                <InfoRow label="כתובת" value={project.address} />
                <InfoRow label="סוג" value={project.type} />
                <InfoRow label="סטטוס" value={project.status} />
                <InfoRow label="תחילה" value={project.start_date} />
                <InfoRow label="צפי סיום" value={project.estimated_completion} />
              </div>

              {contact && (
                <div className="gesi-card p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">פרטי לקוח</h3>
                  <InfoRow label="שם" value={contact.full_name} />
                  <InfoRow label="טלפון" value={contact.phone} />
                  <InfoRow label="אימייל" value={contact.email} />
                  <InfoRow label="כתובת" value={contact.address} />
                  <div className="pt-4">
                    <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl(`ContactCard/${contact.id}`))}>
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

          <TabsContent value="steps">
            <div className="space-y-2">
              {steps.map(step => (
                <div key={step.id} className="gesi-card p-4 flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                    step.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-gray-500/20 text-gray-500'
                  }`}>
                    {step.step_index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">{step.name}</h4>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                  <StatusBadge status={step.status} />
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
    <div className="flex justify-between items-center py-2 border-b border-[rgba(45,212,168,0.05)]">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-white font-medium">{value || '—'}</span>
    </div>
  );
}