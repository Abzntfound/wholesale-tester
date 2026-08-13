/**
 * Remote product adapter — connect authorised WCUK API/feed here.
 */
import { REMOTE_PRODUCTS_URL } from '../config.js';
import { normalizeProducts } from '../../js/product-model.js';

export async function loadRemoteProducts() {
  const res = await fetch(REMOTE_PRODUCTS_URL, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin'
  });

  if (!res.ok) {
    throw new Error(`Product API returned ${res.status}`);
  }

  const data = await res.json();
  const list = Array.isArray(data) ? data : data.products || [];
  return normalizeProducts(list);
}

export default loadRemoteProducts;
