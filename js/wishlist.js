/**
 * Wishlist — delegates to wishlistRepository.
 */
import * as WishlistRepo from '../repositories/wishlistRepository.js';

const cache = new Set();
let cacheReady = false;

async function refreshCache() {
  const ids = await WishlistRepo.getAll();
  cache.clear();
  ids.forEach(id => cache.add(id));
  cacheReady = true;
}

export async function getAll() {
  await refreshCache();
  return [...cache];
}

export async function getCount() {
  return WishlistRepo.getCount();
}

export function has(productId) {
  if (cacheReady) return cache.has(productId);
  try {
    const ids = JSON.parse(localStorage.getItem('wcuk_wishlist')) || [];
    return ids.includes(productId);
  } catch {
    return false;
  }
}

export async function add(productId) {
  await WishlistRepo.add(productId);
  cache.add(productId);
  return [...cache];
}

export async function remove(productId) {
  await WishlistRepo.remove(productId);
  cache.delete(productId);
}

export async function toggle(productId) {
  if (has(productId)) {
    await remove(productId);
    return false;
  }
  await add(productId);
  return true;
}

export async function clear() {
  await WishlistRepo.clear();
  cache.clear();
}

export async function updateBadge() {
  const count = await getCount();
  document.querySelectorAll('[data-wishlist-count]').forEach(el => {
    el.textContent = count;
    el.classList.toggle('has-items', count > 0);
    el.setAttribute('aria-label', count ? `${count} items in wishlist` : 'Wishlist empty');
  });
}

export async function moveToBasket(productId, addToCart) {
  await WishlistRepo.moveToBasket(productId, addToCart);
  cache.delete(productId);
}

export async function syncAfterLogin() {
  await WishlistRepo.syncLocalToAccount();
  await refreshCache();
}

export async function initWishlist() {
  await refreshCache();
  updateBadge();
  document.addEventListener('wishlist:updated', async () => {
    await refreshCache();
    updateBadge();
  });
}

initWishlist();
