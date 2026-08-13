/**
 * Local/static product adapter — development catalogue + live seed merge.
 */
import { PRODUCTS } from '../../data/products.js';
import { LIVE_SEED_PRODUCTS } from '../../data/live-seed.js';
import { normalizeProducts } from '../../js/product-model.js';

export function loadLocalProducts() {
  const dev = normalizeProducts(PRODUCTS);
  const live = normalizeProducts(LIVE_SEED_PRODUCTS);

  // Live public listings override matching SKUs in dev data
  const liveIds = new Set(live.map(p => p.id));
  const merged = [
    ...live,
    ...dev.filter(p => !liveIds.has(p.id))
  ];

  return merged;
}

export default loadLocalProducts;
