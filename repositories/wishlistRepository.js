/**
 * Wishlist repository — Supabase persistence with localStorage fallback.
 */
import { getSupabase } from '../js/supabase-client.js';
import { getSession } from './accountRepository.js';

const STORAGE_KEY = 'wcuk_wishlist';

function readLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function writeLocal(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  document.dispatchEvent(new CustomEvent('wishlist:updated'));
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
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(row => row.product_id);
  }

  return readLocal();
}

export async function getCount() {
  return (await getAll()).length;
}

export async function has(productId) {
  return (await getAll()).includes(productId);
}

export async function add(productId) {
  const userId = await getUserId();
  const supabase = getSupabase();

  if (userId && supabase) {
    await supabase.from('wishlist_items').upsert({
      user_id: userId,
      product_id: productId
    }, { onConflict: 'user_id,product_id' });
    document.dispatchEvent(new CustomEvent('wishlist:updated'));
    return getAll();
  }

  const items = readLocal();
  if (!items.includes(productId)) items.push(productId);
  writeLocal(items);
  return items;
}

export async function remove(productId) {
  const userId = await getUserId();
  const supabase = getSupabase();

  if (userId && supabase) {
    await supabase.from('wishlist_items').delete()
      .eq('user_id', userId).eq('product_id', productId);
    document.dispatchEvent(new CustomEvent('wishlist:updated'));
    return;
  }

  writeLocal(readLocal().filter(id => id !== productId));
}

export async function toggle(productId) {
  if (await has(productId)) {
    await remove(productId);
    return false;
  }
  await add(productId);
  return true;
}

export async function clear() {
  const userId = await getUserId();
  const supabase = getSupabase();

  if (userId && supabase) {
    await supabase.from('wishlist_items').delete().eq('user_id', userId);
    document.dispatchEvent(new CustomEvent('wishlist:updated'));
    return;
  }

  writeLocal([]);
}

export async function moveToBasket(productId, addToBasket) {
  if (!(await has(productId))) return;
  await addToBasket(productId);
  await remove(productId);
}

export async function syncLocalToAccount() {
  const userId = await getUserId();
  const supabase = getSupabase();
  if (!userId || !supabase) return;

  const localIds = readLocal();
  if (!localIds.length) return;

  for (const productId of localIds) {
    await add(productId);
  }
  localStorage.removeItem(STORAGE_KEY);
}
