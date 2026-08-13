/**
 * Product repository — unified data access layer.
 * Switch adapter via repositories/config.js (DATA_SOURCE).
 */
import { DATA_SOURCE } from './config.js';
import { loadLocalProducts } from './adapters/localAdapter.js';
import { loadRemoteProducts } from './adapters/remoteAdapter.js';
import { loadSupabaseProducts } from './adapters/supabaseAdapter.js';
import { searchProducts as searchProductsQuery } from './searchRepository.js';
import {
  normalizeProduct,
  calcDiscount,
  formatCurrency,
  getStockLabel,
  getProductDisplayName,
  slugify
} from '../js/product-model.js';

let cache = null;
let loadError = null;
let loading = null;

export async function initProductRepository() {
  if (cache) return cache;
  if (loading) return loading;

  loading = (async () => {
    try {
      if (DATA_SOURCE === 'remote') {
        cache = await loadRemoteProducts();
      } else if (DATA_SOURCE === 'supabase') {
        cache = await loadSupabaseProducts();
      } else {
        cache = loadLocalProducts();
      }
      loadError = null;
    } catch (err) {
      loadError = err;
      console.warn('Remote product load failed, falling back to local:', err.message);
      cache = loadLocalProducts();
    }
    return cache;
  })();

  return loading;
}

export function getLoadError() {
  return loadError;
}

function getCache() {
  if (!cache) throw new Error('Product repository not initialised. Call initProductRepository() first.');
  return cache;
}

export function getAllProducts() {
  return getCache();
}

export function getProductById(id) {
  return getCache().find(p => p.id === id || p.sku === id) ?? null;
}

export function getProductBySku(sku) {
  return getProductById(sku);
}

export function getProductBySlug(slug) {
  if (!slug) return null;
  const normalised = slug.toLowerCase();
  return getCache().find(p =>
    p.slug === normalised ||
    p.slug === slug ||
    slugify(p.name) === normalised
  ) ?? null;
}

export function searchProducts(query, options = {}) {
  return searchProductsQuery(query, options);
}

export function getProductByUrl(url) {
  const path = (url || '').split('?')[0];
  return getCache().find(p => {
    if (p.url === url) return true;
    if (url.includes(p.sku)) return true;
    return p.url && path.endsWith(p.url.replace(/^\//, ''));
  }) ?? null;
}

export function getProductsByCategory(category) {
  const cat = category.toLowerCase();
  return getCache().filter(p => {
    if (cat === 'clearance') return p.type === 'Clearance' || p.condition === 'Clearance';
    if (cat === 'pallets') return p.type === 'Pallet' || p.category === 'Pallets';
    if (cat === 'job lots') return p.type === 'Job Lot';
    return p.category.toLowerCase() === cat;
  });
}

export function getProductsBySubcategory(subcategory) {
  return getCache().filter(p =>
    p.subcategory?.toLowerCase() === subcategory.toLowerCase()
  );
}

export function getProductsByBrand(brand) {
  return getCache().filter(p =>
    p.brand?.toLowerCase() === brand.toLowerCase()
  );
}

export function getFeaturedProducts(limit = 12) {
  return getCache().filter(p => p.featured && p.stockStatus !== 'sold_out').slice(0, limit);
}

export function getLatestProducts(limit = 12) {
  return [...getCache()]
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .slice(0, limit);
}

export function getBiggestDiscounts(limit = 12) {
  return [...getCache()]
    .filter(p => p.stockStatus !== 'sold_out' && calcDiscount(p) > 0)
    .sort((a, b) => calcDiscount(b) - calcDiscount(a))
    .slice(0, limit);
}

export function getClearanceDeals(limit = 12) {
  return getCache()
    .filter(p =>
      p.type === 'Clearance' || p.condition === 'Clearance' || calcDiscount(p) >= 70
    )
    .sort((a, b) => calcDiscount(b) - calcDiscount(a))
    .slice(0, limit);
}

export function getPalletLots(limit = 12) {
  return getCache()
    .filter(p => p.type === 'Pallet' || p.category === 'Pallets')
    .slice(0, limit);
}

export function getTradeFavourites(limit = 12) {
  return getCache()
    .filter(p => p.popular && p.stockStatus !== 'sold_out')
    .slice(0, limit);
}

export function getSaleProducts(limit = 12) {
  return getCache()
    .filter(p => calcDiscount(p) >= 60 && p.stockStatus !== 'sold_out')
    .slice(0, limit);
}

export function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  const all = getCache().filter(p => p.id !== product.id && p.stockStatus !== 'sold_out');
  const scored = all.map(p => {
    let score = 0;
    if (p.category === product.category) score += 5;
    if (p.subcategory === product.subcategory) score += 4;
    if (p.brand && p.brand === product.brand) score += 3;
    if (p.type === product.type) score += 2;
    (product.tags || []).forEach(t => { if ((p.tags || []).includes(t)) score += 1; });
    return { p, score };
  });
  return scored.filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.p);
}

export function getLiveProductCount() {
  return getCache().filter(p => p.source === 'live-public-listing').length;
}

export function getDevelopmentProductCount() {
  return getCache().filter(p => p.source === 'development-sample').length;
}

export function getBrandsWithCounts(limit = 24) {
  const counts = {};
  getCache().forEach(p => {
    if (!p.brand) return;
    counts[p.brand] = (counts[p.brand] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function getBadge(product) {
  if (product.stockStatus === 'sold_out') return null;
  const daysSince = (Date.now() - new Date(product.dateAdded)) / 86400000;
  if (daysSince <= 7) return { text: 'New', class: 'badge-new' };
  if (product.type === 'Clearance' || product.condition === 'Clearance') return { text: 'Clearance', class: 'badge-clearance' };
  if (product.source === 'live-public-listing') return { text: 'Live', class: 'badge-live' };
  if (product.popular) return { text: 'Popular', class: 'badge-popular' };
  if (product.featured) return { text: 'Featured', class: 'badge-featured' };
  return null;
}

export function calcUnitPrice(product) {
  const qty = product.quantity || product.units;
  if (!qty || qty <= 0) return product.price;
  return Math.round((product.price / qty) * 100) / 100;
}

export { calcDiscount, formatCurrency, getStockLabel, getProductDisplayName, normalizeProduct, slugify };
