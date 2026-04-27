import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id, reason } = await req.json();

    // Update AI conversation
    await base44.entities.AIConversation.update(conversation_id, {
      handed_to_agent: true,
      handover_reason: reason || 'לקוח ביקש להעביר לנציג אנושי',
    });

    // Get chat
    const aiConv = await base44.entities.AIConversation.get(conversation_id);
    const chat = await base44.entities.Chat.get(aiConv.chat_id);

    // Update chat to assign to an agent (you can implement agent assignment logic)
    await base44.entities.Chat.update(aiConv.chat_id, {
      unread_agent: (chat.unread_agent || 0) + 1,
      last_message: 'הלקוח ביקש לדבר עם נציג',
      last_message_at: new Date().toISOString(),
    });

    // Send system message
    await base44.entities.Message.create({
      chat_id: aiConv.chat_id,
      sender_email: 'system@gesi-solar.com',
      sender_name: 'מערכת',
      content: '🔔 השיחה הועברה לנציג אנושי. נציג יצור איתך קשר בהקדם.',
      message_type: 'system',
    });

    // Notify agents (all admins/managers)
    const users = await base44.asServiceRole.entities.User.list();
    const agents = users.filter(u => ['admin', 'manager', 'sales_agent'].includes(u.role));

    for (const agent of agents) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: agent.email,
        title: '🔔 שיחה חדשה ממתינה',
        body: `לקוח ביקש לדבר עם נציג - ${chat.customer_name || user.email}`,
        type: 'general',
        deep_link: 'CrmChatCenter',
      });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Handover error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});