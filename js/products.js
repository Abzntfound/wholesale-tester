/**
 * Product card rendering and catalogue UI.
 */
import {
  calcDiscount,
  formatCurrency,
  getBadge,
  getStockLabel
} from '../repositories/productRepository.js';
import { onImageError } from './product-model.js';
import * as Wishlist from './wishlist.js';
import * as Cart from './cart.js';

export function renderProductCard(product) {
  const discount = calcDiscount(product);
  const badge = getBadge(product);
  const isWishlisted = Wishlist.has(product.id);
  const soldOut = product.stockStatus === 'sold_out';
  const name = product.name || product.title;
  const qty = product.quantity ?? product.units;
  const showRrp = product.rrp > 0;
  const showPrice = product.price > 0;

  return `
    <article class="product-card${soldOut ? ' is-sold-out' : ''}" data-product-id="${product.id}" role="listitem">
      <div class="product-card-media">
        <a href="${product.url}" class="product-image-link" aria-label="View ${escapeAttr(name)}">
          <img
            src="${product.image}"
            alt="${escapeAttr(name)}"
            class="product-image"
            loading="lazy"
            decoding="async"
            width="320"
            height="320"
            data-product-img="${product.id}"
          />
        </a>
        ${badge ? `<span class="product-badge ${badge.class}">${badge.text}</span>` : ''}
        <button type="button" class="wishlist-btn${isWishlisted ? ' is-active' : ''}" data-wishlist-id="${product.id}" aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}" aria-pressed="${isWishlisted}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
      </div>
      <div class="product-card-body">
        <p class="product-category">${escapeHtml(product.category)}${qty ? ` • ${qty.toLocaleString()} units` : ''}</p>
        <h3 class="product-title"><a href="${product.url}">${escapeHtml(name)}</a></h3>
        <div class="product-pricing">
          ${showRrp ? `<span class="product-rrp">RRP ${formatCurrency(product.rrp)}</span>` : ''}
          ${showPrice ? `<span class="product-price">${formatCurrency(product.price)}</span>` : '<span class="product-price">Price on request</span>'}
          ${discount > 0 ? `<span class="product-discount">${discount}% below RRP</span>` : ''}
        </div>
        <div class="product-meta">
          <span class="stock-status stock-${product.stockStatus}">${getStockLabel(product.stockStatus)}</span>
          ${product.condition ? `<span class="product-condition">${escapeHtml(product.condition)}</span>` : ''}
        </div>
        <div class="product-card-actions">
          <a href="${product.url}" class="btn btn-primary product-cta">${soldOut ? 'View product' : 'View product'}</a>
          ${!soldOut ? `<button type="button" class="btn btn-secondary btn-add-cart" data-add-cart="${product.id}">Add to basket</button>` : ''}
        </div>
      </div>
    </article>
  `;
}

export function renderProductGrid(container, products) {
  if (!container) return;
  if (!products.length) {
    container.innerHTML = `<div class="empty-state" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z"/></svg><h3>No products found</h3><p>Try adjusting your search or filters.</p><a href="joblots.html" class="btn btn-primary">Browse all stock</a></div>`;
    return;
  }
  container.innerHTML = products.map(renderProductCard).join('');
  bindProductInteractions(container);
}

export function renderFeaturedSection(container, products, section) {
  if (!container || !products.length) return;
  container.innerHTML = `
    <div class="section-header"><div><h2 class="section-title">${escapeHtml(section.title)}</h2><p class="section-subtitle">${escapeHtml(section.subtitle)}</p></div><a href="${buildSectionLink(section)}" class="section-link">View all</a></div>
    <div class="product-scroll-track">${products.map(p => `<div class="product-scroll-item">${renderProductCard(p)}</div>`).join('')}</div>`;
  bindProductInteractions(container);
}

export function renderCategoryGrid(container, categories, onCategoryClick) {
  if (!container) return;
  container.innerHTML = categories.map(cat => `
    <button type="button" class="category-card" data-category="${escapeAttr(cat.name)}">
      <span class="category-icon"><img src="${cat.image}" alt="" width="48" height="48" loading="lazy" decoding="async" /></span>
      <span class="category-name">${escapeHtml(cat.name)}</span>
      <span class="category-count">${cat.count.toLocaleString()} lots</span>
    </button>`).join('');
  container.querySelectorAll('.category-card').forEach(btn => {
    btn.addEventListener('click', () => onCategoryClick(btn.dataset.category));
  });
}

export function bindProductInteractions(container) {
  container.querySelectorAll('[data-wishlist-id]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      await Wishlist.toggle(btn.dataset.wishlistId);
      btn.classList.toggle('is-active', Wishlist.has(btn.dataset.wishlistId));
      btn.setAttribute('aria-pressed', Wishlist.has(btn.dataset.wishlistId));
    });
  });
  container.querySelectorAll('[data-add-cart]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await Cart.add(btn.dataset.addCart);
      btn.textContent = 'Added';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = 'Add to basket'; btn.disabled = false; }, 1500);
    });
  });
  container.querySelectorAll('[data-product-img]').forEach(img => {
    img.addEventListener('error', () => {
      img.onerror = null;
      img.src = 'images/products/placeholder.svg';
      img.classList.add('is-placeholder');
    }, { once: true });
  });
}

function buildSectionLink(section) {
  const params = new URLSearchParams(section.viewAllQuery || {});
  return `joblots.html?${params}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function escapeAttr(str) { return escapeHtml(str).replace(/"/g, '&quot;'); }
