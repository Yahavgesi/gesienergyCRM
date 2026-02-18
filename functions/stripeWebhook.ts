import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return Response.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    const base44 = createClientFromRequest(req);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const paymentRequestId = session.metadata.payment_request_id;

        if (paymentRequestId) {
          // Update payment request
          await base44.asServiceRole.entities.PaymentRequest.update(paymentRequestId, {
            status: 'paid',
            stripe_payment_intent_id: session.payment_intent,
            paid_date: new Date().toISOString(),
          });

          // Create Payment record
          const paymentRequest = await base44.asServiceRole.entities.PaymentRequest.get(paymentRequestId);
          await base44.asServiceRole.entities.Payment.create({
            project_id: paymentRequest.project_id,
            customer_email: paymentRequest.customer_email,
            amount: paymentRequest.amount,
            currency: paymentRequest.currency,
            type: paymentRequest.type,
            method: 'credit_card',
            status: 'completed',
            description: paymentRequest.description,
          });

          // Activity log
          await base44.asServiceRole.entities.ActivityLog.create({
            entity_type: 'project',
            entity_id: paymentRequest.project_id || paymentRequestId,
            action_type: 'payment_paid',
            actor_email: paymentRequest.customer_email,
            actor_name: paymentRequest.customer_email,
            description: `תשלום בוצע בהצלחה: ₪${paymentRequest.amount}`,
            metadata: { payment_request_id: paymentRequestId, amount: paymentRequest.amount },
          });

          // Send notification
          await base44.asServiceRole.entities.Notification.create({
            user_email: paymentRequest.customer_email,
            title: '✅ התשלום בוצע בהצלחה',
            body: `התשלום בסך ₪${paymentRequest.amount} אושר`,
            type: 'payment_confirmation',
            deep_link: 'CustomerPayments',
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const session = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1,
        });

        if (session.data.length > 0) {
          const paymentRequestId = session.data[0].metadata.payment_request_id;
          
          if (paymentRequestId) {
            await base44.asServiceRole.entities.PaymentRequest.update(paymentRequestId, {
              status: 'failed',
            });

            const paymentRequest = await base44.asServiceRole.entities.PaymentRequest.get(paymentRequestId);

            // Notification
            await base44.asServiceRole.entities.Notification.create({
              user_email: paymentRequest.customer_email,
              title: '❌ התשלום נכשל',
              body: 'אנא נסה שוב או צור קשר עם התמיכה',
              type: 'payment_request',
              deep_link: 'CustomerPayments',
            });
          }
        }
        break;
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});