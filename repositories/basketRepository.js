/**
 * Basket repository — Supabase persistence with localStorage fallback.
 */
import { getSupabase } from '../js/supabase-client.js';
import { getSession } from './accountRepository.js';

const STORAGE_KEY = 'wcuk_basket';

function readLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function writeLocal(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  document.dispatchEvent(new CustomEvent('cart:updated'));
}

async function getUserId() {
  const session = await getSession();
  return session?.id || null;
}

export async function getAll() {
  const userId = await getUserId();
  const supabase = getSupabase();

  if (userId && supabase) {
    const { data, error } = await supabase
      .from('basket_items')
      .select('product_id, quantity')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return (data || []).map(row => ({ productId: row.product_id, quantity: row.quantity }));
  }

  return readLocal();
}

export async function getCount() {
  const items = await getAll();
  return items.reduce((sum, i) => sum + (i.quantity || 1), 0);
}

export async function add(productId, quantity = 1) {
  const userId = await getUserId();
  const supabase = getSupabase();

  if (userId && supabase) {
    const { data: existing } = await supabase
      .from('basket_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      await supabase.from('basket_items').update({
        quantity: existing.quantity + quantity
      }).eq('id', existing.id);
    } else {
      await supabase.from('basket_items').insert({
        user_id: userId,
        product_id: productId,
        quantity
      });
    }
    document.dispatchEvent(new CustomEvent('cart:updated'));
    return getAll();
  }

  const items = readLocal();
  const found = items.find(i => i.productId === productId);
  if (found) found.quantity = (found.quantity || 1) + quantity;
  else items.push({ productId, quantity, addedAt: Date.now() });
  writeLocal(items);
  return items;
}

export async function remove(productId) {
  const userId = await getUserId();
  const supabase = getSupabase();

  if (userId && supabase) {
    await supabase.from('basket_items').delete()
      .eq('user_id', userId).eq('product_id', productId);
    document.dispatchEvent(new CustomEvent('cart:updated'));
    return;
  }

  writeLocal(readLocal().filter(i => i.productId !== productId));
}

export async function setQuantity(productId, quantity) {
  if (quantity <= 0) return remove(productId);

  const userId = await getUserId();
  const supabase = getSupabase();

  if (userId && supabase) {
    await supabase.from('basket_items').update({ quantity })
      .eq('user_id', userId).eq('product_id', productId);
    document.dispatchEvent(new CustomEvent('cart:updated'));
    return;
  }

  const items = readLocal();
  const item = items.find(i => i.productId === productId);
  if (item) {
    item.quantity = quantity;
    writeLocal(items);
  }
}

export async function clear() {
  const userId = await getUserId();
  const supabase = getSupabase();

  if (userId && supabase) {
    await supabase.from('basket_items').delete().eq('user_id', userId);
    document.dispatchEvent(new CustomEvent('cart:updated'));
    return;
  }

  writeLocal([]);
}

export async function getSubtotal(products) {
  const items = await getAll();
  return items.reduce((sum, item) => {
    const p = products.find(x => x.id === item.productId);
    return sum + (p?.price || 0) * (item.quantity || 1);
  }, 0);
}

/** Merge local basket into Supabase after login */
export async function syncLocalToAccount() {
  const userId = await getUserId();
  const supabase = getSupabase();
  if (!userId || !supabase) return;

  const localItems = readLocal();
  if (!localItems.length) return;

  for (const item of localItems) {
    await add(item.productId, item.quantity || 1);
  }
  localStorage.removeItem(STORAGE_KEY);
}
