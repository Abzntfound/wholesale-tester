/**
 * Normalised product model — handles missing fields gracefully.
 */
import { IMAGE_CDN } from '../repositories/config.js';

export function skuToImageId(sku) {
  if (!sku) return null;
  const m = String(sku).match(/SKU(\d+)/i);
  return m ? m[1] : null;
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 72);
}

export function normalizeProduct(raw) {
  const p = { ...raw };
  p.id = p.id || p.sku || slugify(p.name || p.title);
  p.sku = p.sku || p.id;
  p.name = p.name || p.title || 'Untitled lot';
  p.title = p.name;
  p.category = p.category || 'General Merchandise';
  p.subcategory = p.subcategory || '';
  p.brand = p.brand || '';
  p.price = num(p.price);
  p.rrp = num(p.rrp);
  p.quantity = num(p.quantity ?? p.units) || 0;
  p.units = p.quantity;
  p.condition = p.condition || 'Mixed';
  p.description = p.description || `${p.name}. Wholesale ${p.type || 'job lot'} from Wholesale Clearance UK.`;
  p.type = p.type || 'Job Lot';
  p.tags = Array.isArray(p.tags) ? p.tags : [];
  p.stockStatus = p.stockStatus || p.stock || 'in_stock';
  p.stock = p.stockStatus;
  p.dateAdded = p.dateAdded || new Date().toISOString().slice(0, 10);
  p.source = p.source || 'development-sample';
  p.legacyUrl = p.legacyUrl || null;

  const imageId = p.imageId || skuToImageId(p.sku);
  if (!p.image && imageId) {
    p.image = IMAGE_CDN.thumb(imageId);
  }
  if (!p.image) {
    p.image = IMAGE_CDN.placeholder;
  }
  p.images = p.images?.length ? p.images : [p.image];
  if (imageId && !p.images.includes(IMAGE_CDN.full(imageId))) {
    p.images.push(IMAGE_CDN.full(imageId));
  }

  if (!p.url || p.url.startsWith('/product/')) {
    p.url = `/product.html?sku=${encodeURIComponent(p.sku)}`;
  }

  return p;
}

export function normalizeProducts(list) {
  return (list || []).map(normalizeProduct);
}

export function calcDiscount(product) {
  const rrp = num(product.rrp);
  const price = num(product.price);
  if (!rrp || rrp <= 0 || !price || price <= 0) return 0;
  return Math.round(((rrp - price) / rrp) * 100);
}

export function formatCurrency(amount) {
  const n = num(amount);
  if (n === null) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(n);
}

export function getStockLabel(stockStatus) {
  const map = {
    in_stock: 'In stock',
    low_stock: 'Low stock',
    sold_out: 'Out of stock',
    pre_order: 'Pre-order'
  };
  return map[stockStatus] || stockStatus || 'Unknown';
}

export function getProductDisplayName(product) {
  return product?.name || product?.title || 'Product';
}

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

export function onImageError(img, product) {
  img.onerror = null;
  img.src = IMAGE_CDN.placeholder;
  img.classList.add('is-placeholder');
  img.alt = `${getProductDisplayName(product)} — image unavailable`;
}
