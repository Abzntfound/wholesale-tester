/**
 * Wishlist page renderer.
 */
import { initProductRepository, getProductById, formatCurrency, calcDiscount } from '../repositories/productRepository.js';
import { initLayout } from './layout.js';
import * as Wishlist from './wishlist.js';
import * as Cart from './cart.js';

async function bootstrap() {
  initLayout();
  await initProductRepository();
  await render();
}

async function render() {
  const el = document.getElementById('wishlist-content');
  const ids = await Wishlist.getAll();

  if (!ids.length) {
    el.innerHTML = `<div class="empty-state"><h1>Your wishlist is empty</h1><p>Save products you're interested in and come back later.</p><a href="joblots.html" class="btn btn-primary">Browse stock</a></div>`;
    return;
  }

  el.innerHTML = `<h1>Wishlist</h1><div class="wishlist-grid">${ids.map(id => {
    const p = getProductById(id);
    if (!p) return '';
    const disc = calcDiscount(p);
    return `<article class="wishlist-item"><a href="${p.url}"><img src="${p.image}" alt="" loading="lazy" /></a>
      <div><h2><a href="${p.url}">${escapeHtml(p.name)}</a></h2><p>${formatCurrency(p.price)}${disc ? ` • ${disc}% off RRP` : ''}</p>
      <div class="wishlist-item-actions">
        <button type="button" class="btn btn-primary btn-sm" data-move="${p.id}">Move to basket</button>
        <button type="button" class="btn btn-ghost btn-sm" data-remove="${p.id}">Remove</button>
      </div></div></article>`;
  }).join('')}</div>`;

  el.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', async () => {
    await Wishlist.remove(btn.dataset.remove);
    await render();
  }));
  el.querySelectorAll('[data-move]').forEach(btn => btn.addEventListener('click', async () => {
    await Cart.add(btn.dataset.move);
    await Wishlist.remove(btn.dataset.move);
    await render();
  }));
}

function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
