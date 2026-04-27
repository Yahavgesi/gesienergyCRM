import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payment_request_id, success_url, cancel_url } = await req.json();

    // Get payment request
    const paymentRequest = await base44.entities.PaymentRequest.get(payment_request_id);
    
    if (!paymentRequest) {
      return Response.json({ error: 'Payment request not found' }, { status: 404 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: paymentRequest.currency || 'ils',
          product_data: {
            name: paymentRequest.description || 'תשלום GesiEnergy+',
          },
          unit_amount: Math.round(paymentRequest.amount * 100), // Convert to agorot
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/CustomerPayments?success=true`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/CustomerPayments?cancelled=true`,
      customer_email: paymentRequest.customer_email,
      metadata: {
        payment_request_id: payment_request_id,
        project_id: paymentRequest.project_id || '',
        customer_email: paymentRequest.customer_email,
      },
      payment_intent_data: paymentRequest.installments > 1 ? {
        setup_future_usage: 'off_session',
      } : undefined,
    });

    // Update payment request with session details
    await base44.asServiceRole.entities.PaymentRequest.update(payment_request_id, {
      stripe_checkout_url: session.url,
      stripe_session_id: session.id,
      status: 'sent',
    });

    // Create activity log
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'project',
      entity_id: paymentRequest.project_id || payment_request_id,
      action_type: 'payment_requested',
      actor_email: user.email,
      actor_name: user.full_name || user.email,
      description: `בקשת תשלום נשלחה: ₪${paymentRequest.amount}`,
      metadata: { payment_request_id, amount: paymentRequest.amount },
    });

    return Response.json({ 
      checkout_url: session.url,
      session_id: session.id 
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});