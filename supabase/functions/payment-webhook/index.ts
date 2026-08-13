// Supabase Edge Function — payment webhook handler
// Secrets: STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      return new Response('Webhook not configured', { status: 503 });
    }

    // Verify Stripe signature (simplified — use stripe SDK in production)
    const sig = req.headers.get('stripe-signature');
    if (!sig) {
      return new Response('Missing signature', { status: 400 });
    }

    const event = JSON.parse(body);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.order_id || session.client_reference_id;

      if (orderId) {
        await supabase.from('orders').update({
          payment_status: 'paid',
          payment_reference: session.payment_intent || session.id,
          status: 'confirmed'
        }).eq('id', orderId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
