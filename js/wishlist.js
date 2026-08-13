/**
 * Wishlist — localStorage persistence.
 */
const STORAGE_KEY = 'wcuk_wishlist';

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  document.dispatchEvent(new CustomEvent('wishlist:updated'));
}

export function getAll() {
  return read();
}

export function getCount() {
  return read().length;
}

export function has(productId) {
  return read().includes(productId);
}

export function add(productId) {
  const items = read();
  if (!items.includes(productId)) {
    items.push(productId);
    write(items);
  }
  return items;
}

export function remove(productId) {
  write(read().filter(id => id !== productId));
}

export function toggle(productId) {
  return has(productId) ? remove(productId) : add(productId);
}

export function clear() {
  write([]);
}

export function updateBadge() {
  const count = getCount();
  document.querySelectorAll('[data-wishlist-count]').forEach(el => {
    el.textContent = count;
    el.classList.toggle('has-items', count > 0);
    el.setAttribute('aria-label', count ? `${count} items in wishlist` : 'Wishlist empty');
  });
}

export function moveToBasket(productId, addToCart) {
  if (!has(productId)) return;
  addToCart(productId);
  remove(productId);
}
