/**
 * Payment provider abstraction.
 * Secrets live only in Supabase Edge Function environment variables.
 */
import { ENV } from './env.js';
import { getSupabase } from './supabase-client.js';

export function isPaymentConfigured() {
  return Boolean(ENV.PAYMENT_ENABLED && ENV.SUPABASE_URL);
}

export async function createCheckoutSession({ orderId, successUrl, cancelUrl }) {
  if (!isPaymentConfigured()) {
    return {
      configured: false,
      message: 'Payment provider is not configured yet. Deploy the create-checkout-session edge function and set PAYMENT_ENABLED in js/env.js.'
    };
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client unavailable');

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { orderId, successUrl, cancelUrl }
  });

  if (error) throw new Error(error.message || 'Payment session could not be created');
  return { configured: true, ...data };
}

export async function getPaymentStatus(orderId) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('orders')
    .select('payment_status, payment_reference, status')
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
