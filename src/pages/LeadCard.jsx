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
import { ArrowRight, Edit, Phone, Mail, MapPin, CheckCircle2, TrendingUp, FileText, ExternalLink, Users, MapPinned, Zap } from "lucide-react";
import { createPageUrl } from "../utils";
import StatusBadge from "../components/shared/StatusBadge";
import ActivityTimeline from "../components/crm/ActivityTimeline";
import InternalChat from "../components/crm/InternalChat";
import TasksPanel from "../components/crm/TasksPanel";
import FilesPanel from "../components/crm/FilesPanel";
import CallsLog from "../components/crm/CallsLog";
import { motion } from "framer-motion";

const salesStages = [
  { value: 'new_lead', label: 'ליד חדש', color: 'bg-gray-500' },
  { value: 'initial_contact', label: 'יצירת קשר ראשוני', color: 'bg-blue-500' },
  { value: 'site_survey', label: 'סיור באתר', color: 'bg-purple-500' },
  { value: 'quote_sent', label: 'הצעת מחיר נשלחה', color: 'bg-yellow-500' },
  { value: 'negotiation', label: 'משא ומתן', color: 'bg-orange-500' },
  { value: 'closing', label: 'סגירה', color: 'bg-green-500' },
  { value: 'won', label: 'נסגר בהצלחה', color: 'bg-emerald-600' },
  { value: 'lost', label: 'אבוד', color: 'bg-red-500' },
];

export default function LeadCard() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
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

  const { data: nearbyCustomers = [] } = useQuery({
    queryKey: ['nearby-customers', lead?.city],
    queryFn: async () => {
      if (!lead?.city) return [];
      const projects = await base44.entities.Project.filter({ status: 'completed' });
      const customersWithProjects = [];
      for (const project of projects.slice(0, 10)) {
        if (project.address?.includes(lead.city) || project.customer_name?.includes(lead.city)) {
          customersWithProjects.push(project);
        }
      }
      return customersWithProjects;
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
      navigate(createPageUrl(`ContactCard?id=${contact.id}`));
    },
  });

  const handleQuickUpdate = (field, value) => {
    updateMutation.mutate({ [field]: value });
  };

  if (isLoading) {
    return <div className="p-8"><div className="animate-pulse h-96 bg-[#142e38] rounded-xl" /></div>;
  }

  const currentStage = salesStages.find(s => s.value === lead.sales_stage) || salesStages[0];
  const currentStageIndex = salesStages.findIndex(s => s.value === lead.sales_stage);

  return (
    <div className="min-h-screen p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="border-gray-600">
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{lead.full_name}</h1>
                <StatusBadge status={lead.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
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
            <Button variant="outline" onClick={() => setEditMode(!editMode)} className="border-gray-600">
              <Edit className="w-4 h-4 ml-2" />
              {editMode ? 'סיים עריכה' : 'ערוך'}
            </Button>
          </div>
        </div>

        {/* Sales Pipeline */}
        <div className="gesi-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#2dd4a8]" />
            <h2 className="text-lg font-semibold text-white">שלב במסע המכירה</h2>
          </div>
          
          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              {salesStages.map((stage, idx) => (
                <div key={stage.value} className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => !editMode && handleQuickUpdate('sales_stage', stage.value)}
                    disabled={!editMode}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all
                      ${idx <= currentStageIndex ? stage.color : 'bg-gray-700'} text-white
                      ${editMode ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                    `}
                  >
                    {idx + 1}
                  </button>
                  <span className={`text-[10px] mt-2 text-center max-w-[70px] ${idx <= currentStageIndex ? 'text-white font-medium' : 'text-gray-500'}`}>
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-700 -z-10" style={{ width: '90%', marginLeft: '5%' }}>
              <div className={`h-full ${currentStage.color} transition-all duration-500`} style={{ width: `${(currentStageIndex / (salesStages.length - 1)) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<Zap className="w-5 h-5" />}
            label="kWp משוער"
            value={lead.estimated_kwp || '—'}
            editable={editMode}
            onSave={(val) => handleQuickUpdate('estimated_kwp', parseFloat(val))}
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="מחיר לקילו-וואט"
            value={lead.price_per_kwp ? `₪${lead.price_per_kwp.toLocaleString()}` : '—'}
            editable={editMode}
            onSave={(val) => handleQuickUpdate('price_per_kwp', parseFloat(val))}
          />
          <MetricCard
            icon={<MapPinned className="w-5 h-5" />}
            label="גודל גג"
            value={lead.roof_size_sqm ? `${lead.roof_size_sqm} מ"ר` : '—'}
            editable={editMode}
            onSave={(val) => handleQuickUpdate('roof_size_sqm', parseFloat(val))}
          />
          <div className="gesi-card p-4">
            <div className="flex items-center gap-2 mb-2 text-gray-400">
              <FileText className="w-5 h-5" />
              <span className="text-xs">הצעת מחיר</span>
            </div>
            {editMode ? (
              <Input
                defaultValue={lead.quote_url || ''}
                onBlur={(e) => handleQuickUpdate('quote_url', e.target.value)}
                placeholder="הכנס לינק..."
                className="bg-[#142e38] border-[#2dd4a8]/20 text-white text-sm"
              />
            ) : lead.quote_url ? (
              <a href={lead.quote_url} target="_blank" rel="noopener noreferrer" className="text-[#2dd4a8] hover:underline flex items-center gap-1 text-sm">
                צפה בהצעה <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-gray-500 text-sm">לא הוגדר</span>
            )}
          </div>
        </div>

        {/* Nearby Customers */}
        {nearbyCustomers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="gesi-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#2dd4a8]" />
              <h2 className="text-lg font-semibold text-white">לקוחות קרובים גיאוגרפית</h2>
              <span className="text-xs text-gray-500">({nearbyCustomers.length} פרויקטים)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nearbyCustomers.slice(0, 6).map(project => (
                <div key={project.id} className="bg-[#142e38]/50 p-3 rounded-lg border border-[#2dd4a8]/10 hover:border-[#2dd4a8]/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{project.customer_name}</p>
                      <p className="text-xs text-gray-400">{project.address}</p>
                    </div>
                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">פרויקט הושלם</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {project.kwp && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{project.kwp} kWp</span>}
                    {project.type && <span>• {project.type === 'residential' ? 'מגורים' : project.type === 'commercial' ? 'מסחרי' : 'תעשייתי'}</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-[#142e38] border-b border-[rgba(45,212,168,0.1)]">
            <TabsTrigger value="overview">פרטים</TabsTrigger>
            <TabsTrigger value="timeline">פעילות</TabsTrigger>
            <TabsTrigger value="chat">צ'אט פנימי</TabsTrigger>
            <TabsTrigger value="tasks">משימות</TabsTrigger>
            <TabsTrigger value="calls">שיחות</TabsTrigger>
            <TabsTrigger value="files">קבצים</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="gesi-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">פרטי ליד</h3>
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-400">שם מלא</Label>
                      <Input defaultValue={lead.full_name} onBlur={(e) => handleQuickUpdate('full_name', e.target.value)} className="bg-[#142e38] border-[#2dd4a8]/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">טלפון</Label>
                      <Input defaultValue={lead.phone} onBlur={(e) => handleQuickUpdate('phone', e.target.value)} className="bg-[#142e38] border-[#2dd4a8]/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">אימייל</Label>
                      <Input defaultValue={lead.email} onBlur={(e) => handleQuickUpdate('email', e.target.value)} className="bg-[#142e38] border-[#2dd4a8]/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">כתובת</Label>
                      <Input defaultValue={lead.address} onBlur={(e) => handleQuickUpdate('address', e.target.value)} className="bg-[#142e38] border-[#2dd4a8]/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">עיר</Label>
                      <Input defaultValue={lead.city} onBlur={(e) => handleQuickUpdate('city', e.target.value)} className="bg-[#142e38] border-[#2dd4a8]/20 text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    <InfoRow label="שם" value={lead.full_name} />
                    <InfoRow label="טלפון" value={lead.phone} />
                    <InfoRow label="אימייל" value={lead.email} />
                    <InfoRow label="כתובת" value={lead.address} />
                    <InfoRow label="עיר" value={lead.city} />
                    <InfoRow label="מקור" value={lead.source} />
                    <InfoRow label="סוכן" value={lead.assigned_agent} />
                  </>
                )}
              </div>

              <div className="gesi-card p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">מידע נוסף</h3>
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-400">סוג נכס</Label>
                      <Select defaultValue={lead.property_type} onValueChange={(v) => handleQuickUpdate('property_type', v)}>
                        <SelectTrigger className="bg-[#142e38] border-[#2dd4a8]/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#142e38] border-[#2dd4a8]/20">
                          <SelectItem value="residential">מגורים</SelectItem>
                          <SelectItem value="commercial">מסחרי</SelectItem>
                          <SelectItem value="industrial">תעשייתי</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">הערות</Label>
                      <Textarea defaultValue={lead.notes} onBlur={(e) => handleQuickUpdate('notes', e.target.value)} className="bg-[#142e38] border-[#2dd4a8]/20 text-white min-h-[100px]" />
                    </div>
                  </div>
                ) : (
                  <>
                    <InfoRow label="סוג נכס" value={lead.property_type === 'residential' ? 'מגורים' : lead.property_type === 'commercial' ? 'מסחרי' : lead.property_type === 'industrial' ? 'תעשייתי' : '—'} />
                    <InfoRow label="הערות" value={lead.notes} />
                  </>
                )}
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

function MetricCard({ icon, label, value, editable, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  return (
    <div className="gesi-card p-4">
      <div className="flex items-center gap-2 mb-2 text-gray-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      {editable && isEditing ? (
        <Input
          autoFocus
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => {
            if (editValue) onSave(editValue);
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editValue) onSave(editValue);
              setIsEditing(false);
            }
          }}
          className="bg-[#142e38] border-[#2dd4a8]/20 text-white text-lg font-bold"
        />
      ) : (
        <p 
          onClick={() => editable && setIsEditing(true)}
          className={`text-lg font-bold text-white ${editable ? 'cursor-pointer hover:text-[#2dd4a8]' : ''}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}