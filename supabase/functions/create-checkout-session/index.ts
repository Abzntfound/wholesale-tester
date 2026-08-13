// Supabase Edge Function — create checkout session
// Secrets: STRIPE_SECRET_KEY, SITE_URL, ALLOWED_ORIGINS, PAYMENT_PROVIDER
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = (origin, allowed) => {
  const origins = (allowed || '').split(',').map(s => s.trim());
  const allowOrigin = origins.includes(origin) ? origin : origins[0] || '';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
};

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const allowed = Deno.env.get('ALLOWED_ORIGINS') || '';
  const headers = corsHeaders(origin, allowed);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const provider = Deno.env.get('PAYMENT_PROVIDER') || 'stripe';

    if (!stripeKey) {
      return new Response(JSON.stringify({
        configured: false,
        error: 'Payment provider not configured. Set STRIPE_SECRET_KEY in Supabase secrets.'
      }), { status 503, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    const { orderId, successUrl, cancelUrl } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId required' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    if (provider === 'stripe') {
      const params = new URLSearchParams();
      params.set('mode', 'payment');
      params.set('success_url', successUrl || `${Deno.env.get('SITE_URL')}/account/orders.html?paid=${orderId}`);
      params.set('cancel_url', cancelUrl || `${Deno.env.get('SITE_URL')}/checkout.html`);
      params.set('client_reference_id', orderId);
      params.set('metadata[order_id]', orderId);

      (order.order_items || []).forEach((item, i) => {
        params.set(`line_items[${i}][price_data][currency]`, 'gbp');
        params.set(`line_items[${i}][price_data][product_data][name]`, item.product_name);
        params.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(item.unit_price * 100)));
        params.set(`line_items[${i}][quantity]`, String(item.quantity));
      });

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const session = await stripeRes.json();
      if (!stripeRes.ok) {
        return new Response(JSON.stringify({ error: session.error?.message || 'Stripe error' }), { status: 502, headers: { ...headers, 'Content-Type': 'application/json' } });
      }

      await supabase.from('orders').update({ payment_reference: session.id }).eq('id', orderId);

      return new Response(JSON.stringify({
        configured: true,
        checkoutUrl: session.url,
        sessionId: session.id
      }), { headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), { status: 501, headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});
