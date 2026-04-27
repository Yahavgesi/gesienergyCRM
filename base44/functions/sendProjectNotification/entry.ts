import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Allow only admin/manager/office
    if (!user || !['admin', 'manager', 'office'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { project_id, notification_type, title, body, deep_link } = await req.json();

    // Get project
    const project = await base44.entities.Project.get(project_id);
    
    if (!project || !project.customer_email) {
      return Response.json({ error: 'Project or customer not found' }, { status: 404 });
    }

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: project.customer_email,
      title,
      body,
      type: notification_type,
      deep_link: deep_link || 'CustomerHome',
      related_id: project_id,
    });

    // Log activity
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'project',
      entity_id: project_id,
      action_type: 'message_sent',
      actor_email: user.email,
      actor_name: user.full_name || user.email,
      description: `התראה נשלחה ללקוח: ${title}`,
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});