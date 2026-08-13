/**
 * Basket — delegates to basketRepository.
 */
import * as BasketRepo from '../repositories/basketRepository.js';
import { CHECKOUT_URL } from '../repositories/config.js';

export async function getAll() {
  return BasketRepo.getAll();
}

export async function getCount() {
  return BasketRepo.getCount();
}

export async function getItems() {
  return BasketRepo.getAll();
}

export async function add(productId, quantity = 1) {
  return BasketRepo.add(productId, quantity);
}

export async function remove(productId) {
  return BasketRepo.remove(productId);
}

export async function setQuantity(productId, quantity) {
  return BasketRepo.setQuantity(productId, quantity);
}

export async function clear() {
  return BasketRepo.clear();
}

export async function getSubtotal(products) {
  return BasketRepo.getSubtotal(products);
}

export async function updateBadge() {
  const count = await getCount();
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

export async function syncAfterLogin() {
  return BasketRepo.syncLocalToAccount();
}

/** Sync badge on load — call from layout */
export function initCart() {
  updateBadge();
  document.addEventListener('cart:updated', () => updateBadge());
}

initCart();
