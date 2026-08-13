/**
 * Basket — localStorage persistence (front-end prototype).
 * Checkout connects to real WCUK cart when configured.
 */
import { CHECKOUT_URL } from '../repositories/config.js';

const STORAGE_KEY = 'wcuk_basket';

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  document.dispatchEvent(new CustomEvent('cart:updated'));
}

export function getAll() {
  return read();
}

export function getCount() {
  return read().reduce((sum, i) => sum + (i.quantity || 1), 0);
}

export function getItems() {
  return read();
}

export function add(productId, quantity = 1) {
  const items = read();
  const existing = items.find(i => i.productId === productId);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + quantity;
  } else {
    items.push({ productId, quantity, addedAt: Date.now() });
  }
  write(items);
  return items;
}

export function remove(productId) {
  write(read().filter(i => i.productId !== productId));
}

export function setQuantity(productId, quantity) {
  const items = read();
  const item = items.find(i => i.productId === productId);
  if (!item) return;
  if (quantity <= 0) {
    remove(productId);
    return;
  }
  item.quantity = quantity;
  write(items);
}

export function clear() {
  write([]);
}

export function getSubtotal(products) {
  const items = read();
  return items.reduce((sum, item) => {
    const p = products.find(x => x.id === item.productId);
    return sum + (p?.price || 0) * (item.quantity || 1);
  }, 0);
}

export function updateBadge() {
  const count = getCount();
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    el.textContent = count;
    el.classList.toggle('has-items', count > 0);
    el.setAttribute('aria-label', count ? `${count} items in basket` : 'Basket empty');
  });
}

export function getCheckoutUrl() {
  return CHECKOUT_URL;
}

export function proceedToCheckout() {
  window.location.href = CHECKOUT_URL;
}
