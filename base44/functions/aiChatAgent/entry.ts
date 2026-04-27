import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chat_id, message, conversation_id } = await req.json();

    // Get or create AI conversation
    let aiConv;
    if (conversation_id) {
      aiConv = await base44.entities.AIConversation.get(conversation_id);
    } else {
      // Create new AI conversation
      aiConv = await base44.entities.AIConversation.create({
        chat_id,
        customer_email: user.email,
        messages: [],
        handed_to_agent: false,
      });
    }

    // Get customer's project for context
    const projects = await base44.entities.Project.filter({ customer_email: user.email });
    const activeProject = projects.find(p => p.status === 'active') || projects[0];

    // Build context for AI
    let contextPrompt = `אתה סוכן AI של GesiEnergy+, חברה מובילה להתקנת מערכות סולאריות בישראל.

תפקידך: לענות על שאלות לקוחות בצורה מקצועית, ידידותית ועוזרת בעברית.

אם הלקוח יש לו פרויקט פעיל, הנה הפרטים:`;

    if (activeProject) {
      contextPrompt += `
- שם הפרויקט: ${activeProject.title}
- סטטוס: ${activeProject.status === 'active' ? 'פעיל' : activeProject.status}
- שלב נוכחי: ${activeProject.current_step || 'טרם הוגדר'}
- גודל מערכת: ${activeProject.kwp || '—'} kWp
- כתובת התקנה: ${activeProject.address || '—'}`;

      // Get project steps
      const steps = await base44.entities.ProjectStep.filter({ project_id: activeProject.id }, 'step_index');
      if (steps.length > 0) {
        const currentStep = steps.find(s => s.status === 'in_progress' || s.status === 'waiting_customer');
        if (currentStep) {
          contextPrompt += `\n- השלב הנוכחי: ${currentStep.name} - ${currentStep.status === 'waiting_customer' ? 'ממתין לפעולה מהלקוח' : 'בביצוע'}`;
          if (currentStep.customer_action_description) {
            contextPrompt += `\n- פעולה נדרשת מהלקוח: ${currentStep.customer_action_description}`;
          }
        }
      }
    } else {
      contextPrompt += `\n(ללקוח אין עדיין פרויקט פעיל)`;
    }

    contextPrompt += `

חוקים חשובים:
1. ענה תמיד בעברית תקנית וברורה
2. אם שאלה דורשת פעולה של נציג (כמו שינוי במערכת, בעיה טכנית, ביטול חוזה) - המלץ ללקוח לעבור לנציג אנושי
3. אם אתה לא בטוח בתשובה - תגיד זאת ישירות והמלץ לפנות לנציג
4. אם לקוח שואל על סטטוס התקדמות - תן תשובה על סמך הנתונים שיש לך
5. תהיה חיובי ותומך, הלקוח הוא השותף שלנו

שאלת הלקוח: ${message}`;

    // Call LLM
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: contextPrompt,
    });

    // Update conversation
    const updatedMessages = [
      ...(aiConv.messages || []),
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
    ];

    await base44.entities.AIConversation.update(aiConv.id, {
      messages: updatedMessages,
    });

    // Save message to Chat entity
    await base44.entities.Message.create({
      chat_id,
      sender_email: 'ai@gesi-solar.com',
      sender_name: 'סוכן AI',
      content: aiResponse,
      message_type: 'text',
    });

    // Check if we should suggest human handover
    const shouldHandover = aiResponse.includes('נציג') || 
                          aiResponse.includes('לא בטוח') || 
                          aiResponse.includes('פנה לתמיכה') ||
                          message.toLowerCase().includes('בעיה') ||
                          message.toLowerCase().includes('תלונה');

    return Response.json({ 
      response: aiResponse,
      conversation_id: aiConv.id,
      suggest_handover: shouldHandover,
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});