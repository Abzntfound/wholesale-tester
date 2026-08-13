/**
 * Basket page renderer.
 */
import { initProductRepository, getProductById, formatCurrency } from '../repositories/productRepository.js';
import { initLayout } from './layout.js';
import * as Cart from './cart.js';

async function bootstrap() {
  initLayout();
  await initProductRepository();
  await render();
}

async function render() {
  const el = document.getElementById('basket-content');
  const items = await Cart.getItems();

  if (!items.length) {
    el.innerHTML = `<div class="empty-state"><h1>Your basket is empty</h1><p>Browse our wholesale job lots and add products to your basket.</p><a href="joblots.html" class="btn btn-primary">Browse stock</a></div>`;
    return;
  }

  const rows = items.map(item => {
    const p = getProductById(item.productId);
    if (!p) return '';
    const lineTotal = (p.price || 0) * (item.quantity || 1);
    return `<article class="basket-item" data-id="${p.id}">
      <a href="${p.url}" class="basket-item-image"><img src="${p.image}" alt="" loading="lazy" width="96" height="96" /></a>
      <div class="basket-item-info"><h2><a href="${p.url}">${escapeHtml(p.name)}</a></h2><p>${escapeHtml(p.category)} • SKU ${escapeHtml(p.sku)}</p></div>
      <div class="basket-item-qty"><label>Qty <input type="number" min="1" value="${item.quantity || 1}" data-qty="${p.id}" /></label></div>
      <div class="basket-item-price">${formatCurrency(lineTotal)}</div>
      <button type="button" class="basket-item-remove" data-remove="${p.id}" aria-label="Remove">×</button>
    </article>`;
  }).join('');

  const products = items.map(i => getProductById(i.productId)).filter(Boolean);
  const subtotal = await Cart.getSubtotal(products);

  el.innerHTML = `<h1>Basket</h1><div class="basket-items">${rows}</div>
    <aside class="basket-summary"><h2>Order summary</h2>
      <p>Subtotal: <strong>${formatCurrency(subtotal)}</strong></p>
      <p class="basket-summary-note">Delivery and VAT calculated at checkout.</p>
      <p>Total: <strong class="basket-total">${formatCurrency(subtotal)}</strong> <span class="basket-summary-note">(ex. VAT)</span></p>
      <a href="checkout.html" class="btn btn-primary btn-lg btn-block" id="checkout-btn">Proceed to checkout</a>
      <a href="joblots.html" class="btn btn-ghost btn-block">Continue shopping</a>
    </aside>`;

  el.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', async () => {
    await Cart.remove(btn.dataset.remove);
    await render();
  }));
  el.querySelectorAll('[data-qty]').forEach(input => input.addEventListener('change', async () => {
    await Cart.setQuantity(input.dataset.qty, parseInt(input.value, 10));
    await render();
  }));
}

function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
