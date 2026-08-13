# Wholesale Clearance UK — Job Lots Catalogue

Modern HTML/CSS/JavaScript wholesale ecommerce catalogue. Main page: **`joblots.html`**.

## Important: use a local web server

This project uses **ES modules** (`import` / `export`). Browsers block module scripts on `file://` URLs for security (CORS). Opening `joblots.html` directly from your computer will **not** work and you will see errors such as:

```text
Access to script at 'file:///.../js/app.js' has been blocked by CORS policy
```

This is expected browser behaviour — not a bug in the project. **Always run through HTTP.**

## Quick start

### Option 1 — VS Code Live Server (recommended)

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
2. Open this folder in VS Code.
3. Right-click `joblots.html` → **Open with Live Server**.
4. Browse to `http://127.0.0.1:5500/joblots.html`

### Option 2 — Python (Windows)

```powershell
cd C:\Users\adube\Projects\wholesale-clearance-uk
python -m http.server 8080
```

Then open: `http://localhost:8080/joblots.html`

### Option 3 — npx serve

```powershell
npm start
```

Then open: `http://localhost:3000/joblots.html`

## Test search

With the server running, try:

| URL | Expected |
|-----|----------|
| `joblots.html?q=pallets` | Pallet / Pallets products |
| `joblots.html?q=clothing` | Clothing lots |
| `joblots.html?q=shoes` | Footwear products |
| `joblots.html?q=electronics` | Electronics products |
| `joblots.html?q=beauty` | Beauty products |
| `joblots.html?q=pallet` | Same as pallets (partial match) |
| `joblots.html?category=Clothing` | Category filter |

Search is case-insensitive and supports partial matches (e.g. `pallet` → `pallets`).

## Project structure

```text
joblots.html          Main catalogue page
product.html          Product detail (?sku=...)
basket.html           Shopping basket
wishlist.html         Wishlist
account/              Account UI (prototype)
css/style.css         Styles
js/                   Application logic
data/                 Product & category data
repositories/         Data adapter layer (local / remote)
api/README.md         How to connect an authorised product feed
```

## Product data

- **Local adapter** (default): development catalogue (~4,089 products) + live seed from public listings.
- **Remote adapter**: set `DATA_SOURCE: 'remote'` in `repositories/config.js` when an authorised API is available.

See `api/README.md` for connecting a real product feed.

## Pages

| Page | URL |
|------|-----|
| Catalogue | `/joblots.html` |
| Product | `/product.html?sku=SKU59974WC` |
| Basket | `/basket.html` |
| Wishlist | `/wishlist.html` |
| Sign in | `/account/sign-in.html` |

Basket and wishlist persist in `localStorage`. Account sign-in is a **front-end prototype only** — not secure authentication.
