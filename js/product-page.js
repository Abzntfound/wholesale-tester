/**
 * Product detail page.
 */
import { initProductRepository, getProductBySku, getRelatedProducts, calcDiscount, formatCurrency, getStockLabel } from '../repositories/productRepository.js';
import { renderProductGrid } from './products.js';
import { initLayout } from './layout.js';
import * as Cart from './cart.js';
import * as Wishlist from './wishlist.js';

async function bootstrap() {
  initLayout();
  const main = document.getElementById('product-main');
  main.innerHTML = '<div class="product-skeleton"><div class="skeleton skeleton-image"></div><div class="skeleton skeleton-text"></div></div>';

  await initProductRepository();

  const params = new URLSearchParams(window.location.search);
  const sku = params.get('sku') || params.get('id');
  const product = getProductBySku(sku);

  if (!product) {
    main.innerHTML = `<div class="empty-state" role="alert"><h1>Product not found</h1><p>We couldn't find a product matching <strong>${sku || 'that reference'}</strong>.</p><a href="joblots.html" class="btn btn-primary">Browse catalogue</a></div>`;
    return;
  }

  document.title = `${product.name} | Wholesale Clearance UK`;
  renderProduct(product);
  renderRelated(product);
  bindActions(product);
}

function renderProduct(p) {
  const discount = calcDiscount(p);
  const main = document.getElementById('product-main');
  const isWishlisted = Wishlist.has(p.id);
  const soldOut = p.stockStatus === 'sold_out';

  main.innerHTML = `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href="joblots.html">Job Lots</a></li>
        <li><a href="joblots.html?category=${encodeURIComponent(p.category)}">${escapeHtml(p.category)}</a></li>
        <li aria-current="page">${escapeHtml(p.name.slice(0, 40))}${p.name.length > 40 ? '…' : ''}</li>
      </ol>
    </nav>
    <div class="product-detail">
      <div class="product-detail-gallery">
        <div class="product-detail-main-image">
          <img id="main-product-image" src="${p.images[0] || p.image}" alt="${escapeAttr(p.name)}" width="600" height="600" loading="eager" />
        </div>
        ${p.images.length > 1 ? `<div class="product-detail-thumbs">${p.images.map((img, i) => `<button type="button" class="product-thumb${i === 0 ? ' is-active' : ''}" data-image="${img}"><img src="${img}" alt="" loading="lazy" /></button>`).join('')}</div>` : ''}
        ${p.source === 'live-public-listing' ? '<p class="product-source-note">Live catalogue listing with public product imagery.</p>' : ''}
      </div>
      <div class="product-detail-info">
        <p class="product-detail-category">${escapeHtml(p.category)}${p.subcategory ? ` • ${escapeHtml(p.subcategory)}` : ''}</p>
        <h1>${escapeHtml(p.name)}</h1>
        <p class="product-detail-sku">SKU: <strong>${escapeHtml(p.sku)}</strong></p>
        ${p.brand ? `<p class="product-detail-brand">Brand: ${escapeHtml(p.brand)}</p>` : ''}
        <div class="product-detail-pricing">
          ${p.rrp ? `<span class="product-rrp">RRP ${formatCurrency(p.rrp)}</span>` : ''}
          ${p.price ? `<span class="product-price product-price--lg">${formatCurrency(p.price)}</span>` : ''}
          ${discount > 0 ? `<span class="product-discount">${discount}% below RRP</span>` : ''}
        </div>
        <ul class="product-detail-meta">
          <li><span class="stock-status stock-${p.stockStatus}">${getStockLabel(p.stockStatus)}</span></li>
          ${p.quantity ? `<li><strong>${p.quantity.toLocaleString()}</strong> units in lot</li>` : ''}
          ${p.condition ? `<li>Condition: ${escapeHtml(p.condition)}</li>` : ''}
          ${p.type ? `<li>Type: ${escapeHtml(p.type)}</li>` : ''}
        </ul>
        <p class="product-detail-desc">${escapeHtml(p.description)}</p>
        <div class="product-detail-actions">
          ${!soldOut ? `<button type="button" class="btn btn-primary btn-lg" id="add-to-basket">Add to basket</button>` : ''}
          <button type="button" class="btn btn-secondary btn-lg${isWishlisted ? ' is-active' : ''}" id="toggle-wishlist" aria-pressed="${isWishlisted}">${isWishlisted ? '♥ In wishlist' : '♡ Add to wishlist'}</button>
          <button type="button" class="btn btn-ghost" id="share-product">Share</button>
        </div>
        ${p.legacyUrl ? `<p class="product-legacy-link"><a href="${p.legacyUrl}" target="_blank" rel="noopener">View on current WCUK site</a></p>` : ''}
      </div>
    </div>`;

  document.getElementById('main-product-image')?.addEventListener('error', (e) => {
    e.target.src = 'images/products/placeholder.svg';
  });

  main.querySelectorAll('.product-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('main-product-image').src = btn.dataset.image;
      main.querySelectorAll('.product-thumb').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  // Product structured data
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: p.name, sku: p.sku, category: p.category,
    image: p.images, description: p.description,
    offers: { '@type': 'Offer', price: p.price, priceCurrency: 'GBP',
      availability: soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' }
  };
  let script = document.getElementById('product-ld');
  if (!script) { script = document.createElement('script'); script.id = 'product-ld'; script.type = 'application/ld+json'; document.head.appendChild(script); }
  script.textContent = JSON.stringify(ld);
}

function renderRelated(product) {
  const related = getRelatedProducts(product, 4);
  const el = document.getElementById('related-products');
  if (!el || !related.length) return;
  el.innerHTML = `<h2>You may also like</h2><div class="product-grid" id="related-grid"></div>`;
  renderProductGrid(document.getElementById('related-grid'), related);
}

function bindActions(product) {
  document.getElementById('add-to-basket')?.addEventListener('click', () => {
    Cart.add(product.id);
    const btn = document.getElementById('add-to-basket');
    btn.textContent = 'Added to basket';
    setTimeout(() => { btn.textContent = 'Add to basket'; }, 2000);
  });
  document.getElementById('toggle-wishlist')?.addEventListener('click', () => {
    Wishlist.toggle(product.id);
    const btn = document.getElementById('toggle-wishlist');
    const on = Wishlist.has(product.id);
    btn.textContent = on ? '♥ In wishlist' : '♡ Add to wishlist';
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', on);
  });
  document.getElementById('share-product')?.addEventListener('click', async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: product.name, url });
    else { await navigator.clipboard.writeText(url); alert('Link copied to clipboard'); }
  });
}

function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
