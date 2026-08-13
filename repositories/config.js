/**
 * Repository configuration — switch data source without UI changes.
 */
export const DATA_SOURCE = 'local'; // 'local' | 'remote' | 'live-seed'

/** Authorised product API — connect when available */
export const REMOTE_PRODUCTS_URL = '/api/products';

/** Existing WCUK checkout (real) — prototype basket redirects here */
export const CHECKOUT_URL = 'https://www.wholesaleclearance.co.uk/cart.php';

/** Legacy site base for external product links */
export const LEGACY_SITE_BASE = 'https://www.wholesaleclearance.co.uk';

/** Image CDN patterns from public WCUK catalogue */
export const IMAGE_CDN = {
  thumb: (id) => `https://www.wholesaleclearance.co.uk/prod_thumb/540x500/${id}.jpg`,
  full: (id) => `https://www.wholesaleclearance.co.uk/uploads/prod/${id}s.jpg`,
  placeholder: 'images/products/placeholder.svg'
};

export const PER_PAGE = 24;
