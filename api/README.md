# Wholesale Clearance UK — Product Data API

## Data source investigation (August 2026)

The live site at `wholesaleclearance.co.uk` was inspected for authorised product data sources.

### What exists publicly

| Source | Available | Notes |
|--------|-----------|-------|
| Public HTML product listing (`/joblots.php`) | Yes | Paginated PHP catalogue (~4,089 products). Visible to all visitors. |
| Public HTML product detail pages (`/*.htm`) | Yes | Individual product pages with images, SKU, pricing, description. |
| Product thumbnail CDN (`/prod_thumb/540x500/{id}.jpg`) | Yes | Public image URLs on listing pages. |
| Full product images (`/uploads/prod/{id}s.jpg`) | Yes | Referenced on detail pages. |
| Sitemap (`/sitemap.xml.gz`) | Listed in robots.txt | Server returned 500 during inspection. |
| JSON / REST API | **No** | No public API endpoints found. |
| XML / CSV product feed | **No** | No public feed discovered. |
| Structured data (JSON-LD) on products | **No** | Not present on sampled pages. |

### robots.txt restrictions

- `/joblots.php?srch=*` — search URLs disallowed for crawlers
- `/search.php?*` — disallowed
- No blanket disallow on `/joblots.php` pagination

### Recommended integration path

1. **Authorised backend export** — WCUK exports catalogue to JSON/CSV from their database (preferred).
2. **Connect `RemoteProductAdapter`** — point at `/api/products` once a feed is available.
3. **Import script** — `scripts/import-catalogue.js` accepts an authorised JSON/CSV export.

### Adapter configuration

Set the data source in `repositories/config.js`:

```js
export const DATA_SOURCE = 'local'; // 'local' | 'remote' | 'live-seed'
export const REMOTE_PRODUCTS_URL = '/api/products';
```

### Checkout integration

When a real checkout exists, set in `repositories/config.js`:

```js
export const CHECKOUT_URL = 'https://www.wholesaleclearance.co.uk/cart.php';
```

### Important

- Do **not** scrape the live site at scale without explicit authorisation.
- Development sample products are labelled `source: 'development-sample'`.
- Live seed products (first listing page) are labelled `source: 'live-public-listing'`.
