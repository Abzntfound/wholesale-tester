/**
 * Order repository — creates orders in Supabase.
 */
import { getSupabase } from '../js/supabase-client.js';
import { getSession } from './accountRepository.js';

const VAT_RATE = 0.20;
const DEFAULT_DELIVERY = 0;

export function calculateTotals(subtotal, delivery = DEFAULT_DELIVERY) {
  const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
  const total = Math.round((subtotal + vat + delivery) * 100) / 100;
  return { subtotal, vat, delivery, total };
}

export async function createOrder({ items, shippingAddress, delivery = DEFAULT_DELIVERY }) {
  const session = await getSession();
  const supabase = getSupabase();

  if (!session?.id || !supabase) {
    throw new Error('Sign in and configure Supabase to create orders.');
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totals = calculateTotals(subtotal, delivery);
  const orderNumber = `WC-${Date.now().toString().slice(-8)}`;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: session.id,
      order_number: orderNumber,
      status: 'pending',
      payment_status: 'unpaid',
      subtotal: totals.subtotal,
      vat: totals.vat,
      delivery: totals.delivery,
      total: totals.total,
      shipping_address: shippingAddress
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  const lineItems = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total: item.unitPrice * item.quantity
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(lineItems);
  if (itemsError) throw new Error(itemsError.message);

  return order;
}

export async function getOrders() {
  const session = await getSession();
  const supabase = getSupabase();
  if (!session?.id || !supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', session.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getOrderById(orderId) {
  const session = await getSession();
  const supabase = getSupabase();
  if (!session?.id || !supabase) return null;

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', session.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!order) return null;

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  return { ...order, items: items || [] };
}

export async function updatePaymentStatus(orderId, paymentStatus, paymentReference) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.from('orders').update({
    payment_status: paymentStatus,
    payment_reference: paymentReference,
    status: paymentStatus === 'paid' ? 'confirmed' : 'pending'
  }).eq('id', orderId);

  if (error) throw new Error(error.message);
}

export { VAT_RATE, DEFAULT_DELIVERY };
