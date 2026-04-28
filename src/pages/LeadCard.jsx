import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight, Edit, Phone, Mail, MapPin, CheckCircle2, TrendingUp,
  FileText, ExternalLink, Users, MapPinned, Zap, Bell, MessageSquare
} from "lucide-react";
import { createPageUrl } from "../utils";
import StatusBadge from "../components/shared/StatusBadge";
import ActivityTimeline from "../components/crm/ActivityTimeline";
import InternalChat from "../components/crm/InternalChat";
import TasksPanel from "../components/crm/TasksPanel";
import FilesPanel from "../components/crm/FilesPanel";
import CallsLog from "../components/crm/CallsLog";
import LeadReminderModal from "../components/leads/LeadReminderModal";
import LeadStageDrawer from "../components/leads/LeadStageDrawer";
import { motion } from "framer-motion";
import { toast } from "sonner";

const salesStages = [
  { value: 'new_lead', label: 'ליד חדש', color: 'bg-gray-500', hex: '#94a3b8' },
  { value: 'initial_contact', label: 'יצירת קשר ראשוני', color: 'bg-blue-500', hex: '#60a5fa' },
  { value: 'site_survey', label: 'סיור באתר', color: 'bg-purple-500', hex: '#a78bfa' },
  { value: 'quote_sent', label: 'הצעת מחיר נשלחה', color: 'bg-yellow-500', hex: '#fbbf24' },
  { value: 'negotiation', label: 'משא ומתן', color: 'bg-orange-500', hex: '#fb923c' },
  { value: 'closing', label: 'סגירה', color: 'bg-green-500', hex: '#22c55e' },
  { value: 'won', label: 'נסגר בהצלחה', color: 'bg-emerald-600', hex: '#2dd4a8' },
  { value: 'lost', label: 'אבוד', color: 'bg-red-500', hex: '#ef4444' },
];

export default function LeadCard() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [stageDrawer, setStageDrawer] = useState(null); // stage object

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => base44.entities.Lead.get(id),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', 'lead', id],
    queryFn: () => base44.entities.ActivityLog.filter({ entity_type: 'lead', entity_id: id }, '-created_date'),
    enabled: !!id,
  });

  const { data: nearbyCustomers = [] } = useQuery({
    queryKey: ['nearby-customers', lead?.city],
    queryFn: async () => {
      if (!lead?.city) return [];
      const projects = await base44.entities.Project.filter({ status: 'completed' });
      return projects.slice(0, 10).filter(p =>
        p.address?.includes(lead.city) || p.customer_name?.includes(lead.city)
      );
    },
    enabled: !!lead?.city,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lead', id]);
      queryClient.invalidateQueries(['crm-leads']);
      setEditMode(false);
    },
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      const contact = await base44.entities.Contact.create({
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        city: lead.city,
        lead_id: lead.id,
        assigned_agent: lead.assigned_agent,
      });
      await base44.entities.Lead.update(id, { status: 'converted' });
      await logActivity('status_change', `ליד הומר ללקוח: ${contact.full_name}`);
      return contact;
    },
    onSuccess: (contact) => {
      queryClient.invalidateQueries(['lead', id]);
      toast.success('✅ הומר לאיש קשר בהצלחה!', { duration: 2000 });
      setTimeout(() => navigate(createPageUrl(`ContactCard?id=${contact.id}`)), 1000);
    },
  });

  const logActivity = async (action_type, description, extra = {}) => {
    const user = await base44.auth.me();
    return base44.entities.ActivityLog.create({
      entity_type: 'lead',
      entity_id: id,
      action_type,
      description,
      actor_email: user.email,
      actor_name: user.full_name || user.email,
      ...extra,
    });
  };

  const handleQuickUpdate = async (field, value, label) => {
    const oldVal = lead?.[field];
    updateMutation.mutate({ [field]: value });

    // Log every change
    const fieldLabels = {
      full_name: 'שם', phone: 'טלפון', email: 'אימייל', city: 'עיר',
      address: 'כתובת', notes: 'הערות', estimated_kwp: 'kWp',
      price_per_kwp: '₪/kWp', roof_size_sqm: 'גג', assigned_agent: 'סוכן',
      property_type: 'סוג נכס',
    };

    if (field === 'sales_stage') {
      const oldStage = salesStages.find(s => s.value === lead.sales_stage)?.label || 'לא ידוע';
      const newStage = salesStages.find(s => s.value === value)?.label || 'לא ידוע';
      await logActivity('stage_change', `שלב עודכן: ${oldStage} ← ${newStage}`);
      if (value === 'won' && lead.status !== 'converted') {
        toast.success('🎉 ליד נסגר בהצלחה!', { duration: 3000 });
        setTimeout(() => convertMutation.mutate(), 1500);
      }
    } else {
      const fLabel = fieldLabels[field] || field;
      await logActivity('status_change', `שדה עודכן: ${fLabel} שונה מ-"${oldVal || '—'}" ל-"${value}"`);
    }

    queryClient.invalidateQueries(['activities', 'lead', id]);
  };

  if (isLoading) {
    return <div className="p-8"><div className="animate-pulse h-96 bg-[#142e38] rounded-xl" /></div>;
  }

  const currentStage = salesStages.find(s => s.value === lead.sales_stage) || salesStages[0];
  const currentStageIndex = salesStages.findIndex(s => s.value === lead.sales_stage);
  const TAB = "data-[state=active]:bg-transparent data-[state=active]:text-[#2dd4a8] data-[state=active]:border-b-2 data-[state=active]:border-[#2dd4a8] rounded-none px-3 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap";

  return (
    <div className="min-h-screen p-3 sm:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="border-gray-600">
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{lead.full_name}</h1>
                <StatusBadge status={lead.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                {lead.phone && <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-[#2dd4a8] transition-colors"><Phone className="w-3 h-3" />{lead.phone}</a>}
                {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-[#2dd4a8] transition-colors"><Mail className="w-3 h-3" />{lead.email}</a>}
                {lead.city && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.city}</div>}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReminderOpen(true)} className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
              <Bell className="w-4 h-4 ml-1.5" /> תזכורת
            </Button>
            <Button variant="outline" onClick={() => setEditMode(!editMode)} className="border-gray-600">
              <Edit className="w-4 h-4 ml-1.5" />
              {editMode ? 'סיים עריכה' : 'ערוך'}
            </Button>
          </div>
        </div>

        {/* Sales Pipeline */}
        <div className="gesi-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#2dd4a8]" />
            <h2 className="text-base font-semibold text-white">שלב במסע המכירה</h2>
            <span className="text-xs text-gray-500 mr-auto">לחץ על שלב כדי לצפות ולתעד</span>
          </div>

          {/* Desktop */}
          <div className="hidden md:block relative mb-2">
            <div className="flex justify-between items-start">
              {salesStages.map((stage, idx) => {
                const isActive = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div key={stage.value} className="flex flex-col items-center flex-1 relative">
                    <button
                      onClick={() => editMode ? handleQuickUpdate('sales_stage', stage.value) : setStageDrawer(stage)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 relative
                        ${isActive ? stage.color : 'bg-gray-800'} text-white
                        ${isCurrent ? 'ring-2 ring-white/30 scale-110' : ''}
                        hover:scale-110 cursor-pointer
                      `}
                      title={editMode ? `עבור ל: ${stage.label}` : `פתח: ${stage.label}`}
                    >
                      {isCurrent ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </button>
                    <button
                      onClick={() => setStageDrawer(stage)}
                      className={`text-[9px] mt-1.5 text-center max-w-[72px] leading-tight transition-colors hover:text-[#2dd4a8]
                        ${isActive ? 'text-white font-medium' : 'text-gray-600'}
                      `}
                    >
                      {stage.label}
                    </button>
                    {/* Note indicator */}
                    <button onClick={() => setStageDrawer(stage)}
                      className="mt-1 text-[9px] text-gray-600 hover:text-[#2dd4a8] flex items-center gap-0.5 transition-colors">
                      <MessageSquare className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            {/* Progress bar */}
            <div className="absolute top-5 left-[5%] right-[5%] h-0.5 bg-gray-700 -z-0">
              <div className={`h-full ${currentStage.color} transition-all duration-500`}
                style={{ width: currentStageIndex === 0 ? '0%' : `${(currentStageIndex / (salesStages.length - 1)) * 100}%` }} />
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            {salesStages.map((stage, idx) => (
              <div key={stage.value} className="flex items-center gap-2">
                <button
                  onClick={() => editMode ? handleQuickUpdate('sales_stage', stage.value) : setStageDrawer(stage)}
                  className={`flex-1 p-3 rounded-lg flex items-center gap-3 transition-all text-right
                    ${idx <= currentStageIndex ? `${stage.color} text-white` : 'bg-gray-800/40 text-gray-500'}
                  `}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${idx <= currentStageIndex ? 'bg-white/20' : 'bg-gray-600'}
                  `}>
                    {idx === currentStageIndex ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className="text-sm font-medium">{stage.label}</span>
                </button>
                <button onClick={() => setStageDrawer(stage)}
                  className="p-2 rounded-lg bg-gray-800/40 text-gray-500 hover:text-[#2dd4a8] transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={<Zap className="w-5 h-5" />} label="kWp משוער"
            value={lead.estimated_kwp || '—'} editable={editMode}
            onSave={(val) => handleQuickUpdate('estimated_kwp', parseFloat(val))} />
          <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="מחיר לkWp"
            value={lead.price_per_kwp ? `₪${lead.price_per_kwp.toLocaleString()}` : '—'} editable={editMode}
            onSave={(val) => handleQuickUpdate('price_per_kwp', parseFloat(val))} />
          <MetricCard icon={<MapPinned className="w-5 h-5" />} label='גודל גג (מ"ר)'
            value={lead.roof_size_sqm ? `${lead.roof_size_sqm}` : '—'} editable={editMode}
            onSave={(val) => handleQuickUpdate('roof_size_sqm', parseFloat(val))} />
          <div className="gesi-card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2 text-gray-400">
              <FileText className="w-4 h-4" />
              <span className="text-xs">הצעת מחיר</span>
            </div>
            {editMode ? (
              <Input defaultValue={lead.quote_url || ''} onBlur={(e) => handleQuickUpdate('quote_url', e.target.value)}
                placeholder="לינק..." className="bg-[#142e38] border-[#2dd4a8]/20 text-white text-xs" />
            ) : lead.quote_url ? (
              <a href={lead.quote_url} target="_blank" rel="noreferrer" className="text-[#2dd4a8] hover:underline flex items-center gap-1 text-sm">
                צפה <ExternalLink className="w-3 h-3" />
              </a>
            ) : <span className="text-gray-500 text-sm">לא הוגדר</span>}
          </div>
        </div>

        {/* Nearby Customers */}
        {nearbyCustomers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="gesi-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#2dd4a8]" />
              <h2 className="text-base font-semibold text-white">לקוחות קרובים — {lead.city}</h2>
              <span className="text-xs text-gray-500">({nearbyCustomers.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nearbyCustomers.slice(0, 4).map(project => (
                <div key={project.id} className="bg-[#142e38]/50 p-3 rounded-lg border border-[#2dd4a8]/10">
                  <p className="text-sm font-semibold text-white">{project.customer_name}</p>
                  <p className="text-xs text-gray-400">{project.address}</p>
                  {project.kwp && <span className="text-xs text-[#2dd4a8] flex items-center gap-1 mt-1"><Zap className="w-3 h-3" />{project.kwp} kWp</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b border-[rgba(45,212,168,0.1)] bg-[#0d1f26] sticky top-0 z-10">
            <TabsList className="bg-transparent w-full justify-start px-3 sm:px-6 py-0 h-auto overflow-x-auto">
              <TabsTrigger value="overview" className={TAB}>פרטים</TabsTrigger>
              <TabsTrigger value="timeline" className={TAB}>פעילות ({activities.length})</TabsTrigger>
              <TabsTrigger value="chat" className={TAB}>צ'אט</TabsTrigger>
              <TabsTrigger value="tasks" className={TAB}>משימות</TabsTrigger>
              <TabsTrigger value="calls" className={TAB}>שיחות</TabsTrigger>
              <TabsTrigger value="files" className={TAB}>קבצים</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview */}
          <TabsContent value="overview" className="p-3 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-[#2dd4a8]/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#2dd4a8]" />
                  </div>
                  <h3 className="text-base font-semibold text-white">פרטי ליד</h3>
                </div>
                {editMode ? (
                  <div className="space-y-3">
                    {[
                      { key: 'full_name', label: 'שם מלא' }, { key: 'phone', label: 'טלפון' },
                      { key: 'email', label: 'אימייל' }, { key: 'address', label: 'כתובת' },
                      { key: 'city', label: 'עיר' }, { key: 'assigned_agent', label: 'סוכן מכירות' },
                    ].map(f => (
                      <div key={f.key}>
                        <Label className="text-xs text-gray-400">{f.label}</Label>
                        <Input defaultValue={lead[f.key] || ''} onBlur={e => handleQuickUpdate(f.key, e.target.value)}
                          className="bg-[#142e38] border-[#2dd4a8]/20 text-white" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <InfoRow label="שם" value={lead.full_name} />
                    <InfoRow label="טלפון" value={lead.phone} />
                    <InfoRow label="אימייל" value={lead.email} />
                    <InfoRow label="כתובת" value={lead.address} />
                    <InfoRow label="עיר" value={lead.city} />
                    <InfoRow label="מקור" value={{ website: "אתר", referral: "הפניה", facebook: "פייסבוק", google: "גוגל", phone: "טלפון", walk_in: "פנה ישירות", other: "אחר" }[lead.source] || lead.source} />
                    <InfoRow label="סוכן" value={lead.assigned_agent} />
                  </>
                )}
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-[#0f2229] to-[#142e38] border border-[rgba(45,212,168,0.1)] p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white">מידע נוסף</h3>
                </div>
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-400">סוג נכס</Label>
                      <Select defaultValue={lead.property_type} onValueChange={v => handleQuickUpdate('property_type', v)}>
                        <SelectTrigger className="bg-[#142e38] border-[#2dd4a8]/20 text-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#142e38] border-[#2dd4a8]/20">
                          <SelectItem value="residential">מגורים</SelectItem>
                          <SelectItem value="commercial">מסחרי</SelectItem>
                          <SelectItem value="industrial">תעשייתי</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">הערות</Label>
                      <Textarea defaultValue={lead.notes} onBlur={e => handleQuickUpdate('notes', e.target.value)}
                        className="bg-[#142e38] border-[#2dd4a8]/20 text-white min-h-[100px]" />
                    </div>
                  </div>
                ) : (
                  <>
                    <InfoRow label="סוג נכס" value={{ residential: 'מגורים', commercial: 'מסחרי', industrial: 'תעשייתי' }[lead.property_type] || '—'} />
                    <InfoRow label="הערות" value={lead.notes} />
                    <InfoRow label="תאריך יצירה" value={lead.created_date ? new Date(lead.created_date).toLocaleDateString('he-IL') : '—'} />
                    <InfoRow label="עודכן לאחרונה" value={lead.updated_date ? new Date(lead.updated_date).toLocaleDateString('he-IL') : '—'} />
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Activity - full log */}
          <TabsContent value="timeline" className="p-3 sm:p-6">
            <ActivityTimeline activities={activities} />
          </TabsContent>

          <TabsContent value="chat" className="p-3 sm:p-6">
            <InternalChat entityType="lead" entityId={id} />
          </TabsContent>

          <TabsContent value="tasks" className="p-3 sm:p-6">
            <TasksPanel entityType="lead" entityId={id} />
          </TabsContent>

          <TabsContent value="calls" className="p-3 sm:p-6">
            <CallsLog entityType="lead" entityId={id} />
          </TabsContent>

          <TabsContent value="files" className="p-3 sm:p-6">
            <FilesPanel entityType="lead" entityId={id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Reminder Modal */}
      <LeadReminderModal open={reminderOpen} onClose={() => setReminderOpen(false)} lead={lead} />

      {/* Stage Drawer */}
      {stageDrawer && (
        <LeadStageDrawer stage={stageDrawer} leadId={id} onClose={() => setStageDrawer(null)} />
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[rgba(45,212,168,0.05)] last:border-0 hover:bg-[rgba(45,212,168,0.02)] transition-colors rounded-lg px-1">
      <span className="text-sm text-gray-400 font-medium">{label}</span>
      <span className="text-sm text-white font-semibold">{value || '—'}</span>
    </div>
  );
}

function MetricCard({ icon, label, value, editable, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  return (
    <div className="gesi-card p-3 sm:p-4">
      <div className="flex items-center gap-1.5 mb-2 text-gray-400">
        <div className="w-4 h-4">{icon}</div>
        <span className="text-[10px] sm:text-xs">{label}</span>
      </div>
      {editable && isEditing ? (
        <Input autoFocus type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
          onBlur={() => { if (editValue) onSave(editValue); setIsEditing(false); }}
          onKeyDown={e => { if (e.key === 'Enter') { if (editValue) onSave(editValue); setIsEditing(false); } }}
          className="bg-[#142e38] border-[#2dd4a8]/20 text-white text-lg font-bold" />
      ) : (
        <p onClick={() => editable && setIsEditing(true)}
          className={`text-lg font-bold text-white ${editable ? 'cursor-pointer hover:text-[#2dd4a8]' : ''}`}>
          {value}
        </p>
      )}
    </div>
  );
}