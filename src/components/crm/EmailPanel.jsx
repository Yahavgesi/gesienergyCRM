import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Plus, Send, ChevronDown, ChevronUp } from "lucide-react";
import moment from "moment";
import { toast } from "sonner";

export default function EmailPanel({ entityType, entityId, toEmail, fromEmail }) {
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', body: '' });
  const queryClient = useQueryClient();

  const { data: sentEmails = [] } = useQuery({
    queryKey: ['emails', entityType, entityId],
    queryFn: async () => {
      const activities = await base44.entities.ActivityLog.filter({
        entity_type: entityType,
        entity_id: entityId,
      }, '-created_date');
      return activities.filter(a => a.action_type === 'message_sent' && a.metadata?.channel === 'email');
    },
  });

  const handleSend = async () => {
    if (!emailData.subject || !emailData.body) {
      toast.error('נא למלא נושא ותוכן המייל');
      return;
    }
    if (!toEmail) {
      toast.error('אין כתובת מייל ללקוח');
      return;
    }
    setSending(true);
    const user = await base44.auth.me();
    await base44.integrations.Core.SendEmail({
      to: toEmail,
      subject: emailData.subject,
      body: emailData.body,
      from_name: user.full_name || 'Gesi Solar',
    });
    await base44.entities.ActivityLog.create({
      entity_type: entityType,
      entity_id: entityId,
      action_type: 'message_sent',
      description: `📧 מייל נשלח: "${emailData.subject}"`,
      actor_email: user.email,
      actor_name: user.full_name || user.email,
      metadata: {
        channel: 'email',
        subject: emailData.subject,
        body: emailData.body,
        to: toEmail,
        from: fromEmail || user.email,
      },
    });
    queryClient.invalidateQueries(['emails', entityType, entityId]);
    queryClient.invalidateQueries(['activities', entityType, entityId]);
    setSending(false);
    setShowForm(false);
    setEmailData({ subject: '', body: '' });
    toast.success('המייל נשלח בהצלחה');
  };

  return (
    <div className="gesi-card p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#2dd4a8]" /> דואר אלקטרוני
        </h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm"
          className="bg-[#2dd4a8] hover:bg-[#1fa882] text-white">
          <Plus className="w-4 h-4 ml-1" /> מייל חדש
        </Button>
      </div>

      {/* Compose Form */}
      {showForm && (
        <div className="bg-[#142e38] rounded-xl p-4 space-y-3 border border-[rgba(45,212,168,0.1)]">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">אל:</span>
              <span className="text-white mr-1">{toEmail || 'לא מוגדר'}</span>
            </div>
            <div>
              <span className="text-gray-500">מאת:</span>
              <span className="text-[#2dd4a8] mr-1">{fromEmail || 'כתובת מייל של הסוכן'}</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-400 mb-1 block">נושא</Label>
            <Input
              value={emailData.subject}
              onChange={e => setEmailData(p => ({ ...p, subject: e.target.value }))}
              placeholder="נושא המייל..."
              className="bg-[#0a1a1f] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400 mb-1 block">תוכן</Label>
            <Textarea
              value={emailData.body}
              onChange={e => setEmailData(p => ({ ...p, body: e.target.value }))}
              placeholder="תוכן המייל..."
              className="bg-[#0a1a1f] border-[rgba(45,212,168,0.1)] text-white placeholder-gray-600 min-h-[120px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSend} disabled={sending || !toEmail}
              className="flex-1 bg-[#2dd4a8] hover:bg-[#1fa882] text-white">
              <Send className="w-4 h-4 ml-1.5" />
              {sending ? 'שולח...' : 'שלח מייל'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}
              className="border-gray-600 text-gray-300 hover:bg-[#1a3a47]">
              ביטול
            </Button>
          </div>
          {!toEmail && (
            <p className="text-xs text-amber-400">⚠️ אין כתובת מייל מוגדרת ללקוח — לא ניתן לשלוח</p>
          )}
        </div>
      )}

      {/* Sent Emails List */}
      <div className="space-y-2">
        {sentEmails.length === 0 && (
          <p className="text-center text-gray-500 py-8 text-sm">אין מיילים שנשלחו עדיין</p>
        )}
        {sentEmails.map(email => (
          <EmailItem key={email.id} email={email} />
        ))}
      </div>
    </div>
  );
}

function EmailItem({ email }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-[#142e38] rounded-xl p-3.5 border border-[rgba(45,212,168,0.05)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <Mail className="w-4 h-4 text-[#2dd4a8] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {email.metadata?.subject || 'ללא נושא'}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>{email.actor_name}</span>
              <span>→</span>
              <span>{email.metadata?.to}</span>
              <span>•</span>
              <span>{moment(email.created_date).format('DD/MM/YY HH:mm')}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {expanded && email.metadata?.body && (
        <div className="mt-3 pt-3 border-t border-[rgba(45,212,168,0.05)]">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{email.metadata.body}</p>
        </div>
      )}
    </div>
  );
}