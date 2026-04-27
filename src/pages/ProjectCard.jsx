import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight, Edit, DollarSign, Zap, User, CheckCircle2, Briefcase,
  MessageSquare, Clock, Phone, Mail, MapPin, ExternalLink, FileText,
  Receipt, Flag, TrendingUp, Plus
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
import MilestonesPanel from "../components/crm/MilestonesPanel";
import ProjectExpensesPanel from "../components/crm/ProjectExpensesPanel";
import { toast } from "sonner";

const TAB_STYLE = "data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-4 py-3 text-sm whitespace-nowrap";

export default function ProjectCard() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [stepNotes, setStepNotes] = useState({});

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

  const { data: stepActivities = [] } = useQuery({
    queryKey: ['step-activities', id],
    queryFn: async () => {
      const all = await base44.entities.ActivityLog.filter({ entity_type: 'project', entity_id: id }, '-created_date');
      return all.filter(a => a.metadata?.step_id);
    },
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', 'project', id],
    queryFn: () => base44.entities.Document.filter({ project_id: id }, '-created_date'),
    enabled: !!id,
    initialData: [],
  });

  const { data: projectExpenses = [] } = useQuery({
    queryKey: ['project-expenses', id],
    queryFn: () => base44.entities.ProjectExpense.filter({ project_id: id }),
    enabled: !!id,
    initialData: [],
  });

  const { data: milestonePayments = [] } = useQuery({
    queryKey: ['milestone-payments', id],
    queryFn: () => base44.entities.Payment.filter({ project_id: id }),
    enabled: !!id,
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', id]);
      queryClient.invalidateQueries(['crm-projects']);
      setEditOpen(false);
      toast.success('פרויקט עודכן');
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: ({ stepId, data }) => base44.entities.ProjectStep.update(stepId, data),
    onSuccess: async (_, vars) => {
      queryClient.invalidateQueries(['project-steps', id]);
      if (vars.data.status === 'completed') {
        const allSteps = await base44.entities.ProjectStep.filter({ project_id: id }, 'step_index');
        const nextStep = allSteps.find(s => s.step_index > steps.find(st => st.id === vars.stepId)?.step_index && s.status !== 'completed');
        if (nextStep) {
          await base44.entities.ProjectStep.update(nextStep.id, { status: 'in_progress' });
          await base44.entities.Project.update(id, { current_step: nextStep.name, current_step_index: nextStep.step_index });
          queryClient.invalidateQueries(['project', id]);
          queryClient.invalidateQueries(['project-steps', id]);
        }
      }
    },
  });

  const addStepNoteMutation = useMutation({
    mutationFn: async ({ stepId, note }) => {
      const user = await base44.auth.me();
      await base44.entities.ActivityLog.create({
        entity_type: 'project', entity_id: id,
        action_type: 'note_added',
        description: note,
        actor_email: user.email,
        actor_name: user.full_name || user.email,
        metadata: { step_id: stepId }
      });
    },
    onSuccess: () => { queryClient.invalidateQueries(['step-activities', id]); setStepNotes({}); },
  });

  if (isLoading || !project) {
    return <div className="p-8"><div className="animate-pulse h-96 bg-[#142e38] rounded-xl" /></div>;
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const totalPaid = milestonePayments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = projectExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0a1a1f]" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-br from-[#0f2229] to-[#142e38] border-b border-[rgba(45,212,168,0.1)]">
          <div className="p-4 lg:p-6 pb-6 lg:pb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white hover:bg-[#1a3a47] mb-4">
              <ArrowRight className="w-4 h-4 ml-2" /> חזור
            </Button>

            <div className="flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-[#2dd4a8] to-[#1fa882] flex items-center justify-center text-white shadow-xl flex-shrink-0">
                  <span className="text-2xl lg:text-3xl font-bold">{project.title?.[0] || 'P'}</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">{project.title}</h1>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Zap className="w-4 h-4 text-[#2dd4a8]" />
                      <span className="font-semibold">{project.kwp} kWp</span>
                    </div>
                    {contact && (
                      <Link to={createPageUrl(`ContactCard?id=${contact.id}`)} className="flex items-center gap-1.5 text-gray-300 hover:text-[#2dd4a8] transition-colors">
                        <User className="w-4 h-4 text-blue-400" />
                        <span>{contact.full_name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    {project.address && (
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs">{project.address}</span>
                      </div>
                    )}
                    {project.total_price > 0 && (
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold">₪{project.total_price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full max-w-sm">
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>התקדמות פרויקט</span>
                      <span className="font-bold text-[#2dd4a8]">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2.5 bg-[#142e38] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-[#2dd4a8] to-[#1fa882] transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>{completedSteps}/{steps.length} שלבים</span>
                      <span>{project.current_step || 'טרם החל'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => { setEditData(project); setEditOpen(true); }} className="border-gray-600 hover:bg-[#1a3a47]">
                  <Edit className="w-4 h-4 ml-2" /> ערוך
                </Button>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              {[
                { label: 'גבייה', val: `₪${totalPaid.toLocaleString()}`, color: 'text-[#2dd4a8]', icon: DollarSign },
                { label: 'הוצאות', val: `₪${totalExpenses.toLocaleString()}`, color: 'text-red-400', icon: Receipt },
                { label: 'מסמכים', val: documents.length, color: 'text-blue-400', icon: FileText },
                { label: 'שלבים שהושלמו', val: `${completedSteps}/${steps.length}`, color: 'text-purple-400', icon: CheckCircle2 },
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
              <TabsTrigger value="steps" className={TAB_STYLE}>שלבים</TabsTrigger>
              <TabsTrigger value="milestones" className={TAB_STYLE}>אבני דרך 💰</TabsTrigger>
              <TabsTrigger value="expenses" className={TAB_STYLE}>הוצאות</TabsTrigger>
              <TabsTrigger value="documents" className={TAB_STYLE}>מסמכים</TabsTrigger>
              <TabsTrigger value="payments" className={TAB_STYLE}>תשלומים</TabsTrigger>
              <TabsTrigger value="simulations" className={TAB_STYLE}>הדמיות</TabsTrigger>
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
                  <div className="w-9 h-9 rounded-lg bg-[#2dd4a8]/10 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-[#2dd4a8]" />
                  </div>
                  <h3 className="text-base font-semibold text-white">פרטי פרויקט</h3>
                </div>
                <div className="space-y-0">
                  <InfoRow label="שם" value={project.title} />
                  <InfoRow label="לקוח" value={project.customer_name} />
                  <InfoRow label="kWp" value={project.kwp} />
                  <InfoRow label="מחיר לkWp (ללא מע״מ)" value={project.price_per_kwp ? `₪${project.price_per_kwp.toLocaleString()}` : '—'} />
                  <InfoRow label="מחיר לkWp (עם מע״מ)" value={project.price_per_kwp_with_vat ? `₪${project.price_per_kwp_with_vat.toLocaleString()}` : '—'} />
                  <InfoRow label="מחיר כולל" value={project.total_price ? `₪${project.total_price.toLocaleString()}` : '—'} />
                  <InfoRow label="כתובת" value={project.address} />
                  <InfoRow label="סוג" value={{ residential: 'פרטי', commercial: 'מסחרי', tender: 'מכרז' }[project.type] || project.type} />
                  <InfoRow label="תחילה" value={project.start_date ? new Date(project.start_date).toLocaleDateString('he-IL') : '—'} />
                  <InfoRow label="צפי סיום" value={project.estimated_completion ? new Date(project.estimated_completion).toLocaleDateString('he-IL') : '—'} />
                </div>
              </div>

              {contact && (
                <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <h3 className="text-base font-semibold text-white">איש קשר</h3>
                    </div>
                    <Link to={createPageUrl(`ContactCard?id=${contact.id}`)}
                      className="text-xs text-[#2dd4a8] hover:underline flex items-center gap-1">
                      פתח כרטיס <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2dd4a8] to-[#1fa882] flex items-center justify-center text-white text-lg font-bold">
                      {contact.full_name?.[0]}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{contact.full_name}</p>
                      <p className="text-xs text-gray-400">{contact.city || '—'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-gray-300 hover:text-[#2dd4a8] transition-colors p-2 rounded-lg hover:bg-[#142e38]/50">
                        <Phone className="w-4 h-4 text-[#2dd4a8]" /> {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-gray-300 hover:text-[#2dd4a8] transition-colors p-2 rounded-lg hover:bg-[#142e38]/50">
                        <Mail className="w-4 h-4 text-blue-400" /> {contact.email}
                      </a>
                    )}
                    {contact.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 p-2">
                        <MapPin className="w-4 h-4 text-purple-400" /> {contact.address}
                      </div>
                    )}
                  </div>
                  <InfoRow label="ת.ז." value={contact.id_number} />
                </div>
              )}
            </div>

            {/* Documents preview */}
            {documents.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white">מסמכים אחרונים</h3>
                  <span className="text-xs text-gray-500">{documents.length} מסמכים</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {documents.slice(0, 4).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#142e38]/50 border border-[rgba(45,212,168,0.05)]">
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{doc.title}</p>
                        <p className="text-[10px] text-gray-500">{doc.category} • {doc.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* STEPS */}
          <TabsContent value="steps" className="p-4 lg:p-6">
            <Accordion type="single" collapsible className="space-y-2">
              {steps.map((step) => {
                const stepActivityList = stepActivities.filter(a => a.metadata?.step_id === step.id);
                return (
                  <AccordionItem key={step.id} value={step.id} className="rounded-xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] overflow-hidden">
                    <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-[rgba(45,212,168,0.02)] transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                          step.status === 'completed' ? 'bg-[#2dd4a8]/20 text-[#2dd4a8] border-2 border-[#2dd4a8]' :
                          step.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-400' :
                          step.status === 'blocked' ? 'bg-red-500/20 text-red-400 border-2 border-red-400' :
                          'bg-gray-500/10 text-gray-500 border-2 border-gray-600'
                        }`}>
                          {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : step.step_index + 1}
                        </div>
                        <div className="flex-1 text-right">
                          <h4 className="text-sm font-semibold text-white">{step.name}</h4>
                          {step.description && <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {stepActivityList.length > 0 && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />{stepActivityList.length}
                            </span>
                          )}
                          <StatusBadge status={step.status} />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-3 border-t border-[rgba(45,212,168,0.05)]">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {step.eta && <div className="flex items-center gap-2 text-gray-400"><Clock className="w-3 h-3" />צפי: {new Date(step.eta).toLocaleDateString('he-IL')}</div>}
                          {step.completed_date && <div className="flex items-center gap-2 text-[#2dd4a8]"><CheckCircle2 className="w-3 h-3" />הושלם: {new Date(step.completed_date).toLocaleDateString('he-IL')}</div>}
                          {step.blocker_reason && <div className="col-span-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400"><span className="font-semibold">חסימה: </span>{step.blocker_reason}</div>}
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1.5">סטטוס</label>
                          <select value={step.status} onChange={(e) => updateStepMutation.mutate({ stepId: step.id, data: { status: e.target.value, ...(e.target.value === 'completed' ? { completed_date: new Date().toISOString().slice(0,10) } : {}) } })}
                            className="w-full bg-[#142e38] border border-[rgba(45,212,168,0.1)] rounded-lg px-3 py-2 text-sm text-white">
                            <option value="pending">ממתין</option>
                            <option value="in_progress">בביצוע</option>
                            <option value="waiting_customer">ממתין ללקוח</option>
                            <option value="completed">הושלם ✓</option>
                            <option value="blocked">חסום</option>
                          </select>
                        </div>
                        {stepActivityList.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-semibold text-gray-400">עדכונים ({stepActivityList.length})</h5>
                            {stepActivityList.map(a => (
                              <div key={a.id} className="bg-[#142e38]/50 rounded-lg p-3 text-xs">
                                <div className="flex justify-between mb-1">
                                  <span className="text-white font-medium">{a.actor_name || 'מערכת'}</span>
                                  <span className="text-gray-500">{new Date(a.created_date).toLocaleDateString('he-IL')}</span>
                                </div>
                                <p className="text-gray-300">{a.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-gray-400 block mb-1.5">הוסף הערה</label>
                          <Textarea value={stepNotes[step.id] || ''} onChange={(e) => setStepNotes({ ...stepNotes, [step.id]: e.target.value })}
                            placeholder="כתוב עדכון..." className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 text-sm min-h-[60px]" />
                          <Button size="sm" onClick={() => { if (stepNotes[step.id]?.trim()) addStepNoteMutation.mutate({ stepId: step.id, note: stepNotes[step.id] }); }}
                            disabled={!stepNotes[step.id]?.trim() || addStepNoteMutation.isPending}
                            className="mt-2 bg-[#2dd4a8] hover:bg-[#1fa882] text-white text-xs">שמור</Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>

          {/* MILESTONES */}
          <TabsContent value="milestones">
            <MilestonesPanel project={project} />
          </TabsContent>

          {/* EXPENSES */}
          <TabsContent value="expenses">
            <ProjectExpensesPanel project={project} />
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents">
            <DocumentsPanel projectId={id} contact={contact} />
          </TabsContent>

          {/* PAYMENTS */}
          <TabsContent value="payments">
            <PaymentsPanel projectId={id} />
          </TabsContent>

          {/* SIMULATIONS */}
          <TabsContent value="simulations" className="p-4 lg:p-6">
            <div className="space-y-3">
              {simulations.map(sim => (
                <div key={sim.id} className="gesi-card p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">הדמיה גרסה {sim.version}</h4>
                    <p className="text-xs text-gray-400">{new Date(sim.created_date).toLocaleDateString('he-IL')}</p>
                    {sim.customer_notes && <p className="text-xs text-gray-500 mt-1">{sim.customer_notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {sim.file_url && <a href={sim.file_url} target="_blank" rel="noreferrer" className="text-xs text-[#2dd4a8] hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />פתח</a>}
                    <StatusBadge status={sim.status} />
                  </div>
                </div>
              ))}
              {simulations.length === 0 && <p className="text-center text-gray-500 py-8">אין הדמיות</p>}
            </div>
          </TabsContent>

          <TabsContent value="tasks"><TasksPanel entityType="project" entityId={id} /></TabsContent>
          <TabsContent value="chat"><InternalChat entityType="project" entityId={id} /></TabsContent>
          <TabsContent value="timeline"><ActivityTimeline activities={activities} /></TabsContent>
          <TabsContent value="files"><FilesPanel entityType="project" entityId={id} /></TabsContent>
        </Tabs>
      </div>

      <FormModal open={editOpen} onClose={() => setEditOpen(false)} title="ערוך פרויקט"
        fields={[
          { key: 'title', label: 'שם פרויקט', type: 'text' },
          { key: 'kwp', label: 'kWp', type: 'number' },
          { key: 'price_per_kwp', label: 'מחיר לkWp (ללא מע״מ)', type: 'number' },
          { key: 'address', label: 'כתובת', type: 'text' },
          { key: 'status', label: 'סטטוס', type: 'select', options: [
            { value: 'active', label: 'פעיל' }, { value: 'on_hold', label: 'מושהה' },
            { value: 'completed', label: 'הושלם' }, { value: 'cancelled', label: 'בוטל' },
          ]},
          { key: 'start_date', label: 'תאריך התחלה', type: 'date' },
          { key: 'estimated_completion', label: 'צפי סיום', type: 'date' },
        ]}
        data={editData} setData={(d) => {
          if (d.price_per_kwp && d.kwp) {
            d.price_per_kwp_with_vat = Math.round(parseFloat(d.price_per_kwp) * 1.18);
            d.total_price = Math.round(d.price_per_kwp_with_vat * parseFloat(d.kwp));
          }
          setEditData(d);
        }}
        onSubmit={() => updateMutation.mutate(editData)}
        submitting={updateMutation.isPending}
      />
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