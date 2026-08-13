/**
 * Search repository — case-insensitive, partial & synonym-aware search.
 */
import { getAllProducts } from './productRepository.js';
import { POPULAR_SEARCHES } from '../data/categories.js';
import { expandSearchTerms } from '../data/search-synonyms.js';

/** Map common search terms to category / type for reliable matching */
const TERM_CATEGORY_MAP = {
  pallets: { categories: ['pallets'], types: ['pallet'] },
  pallet: { categories: ['pallets'], types: ['pallet'] },
  clothing: { categories: ['clothing'], types: [] },
  clothes: { categories: ['clothing'], types: [] },
  apparel: { categories: ['clothing'], types: [] },
  footwear: { categories: ['footwear'], types: [] },
  shoes: { categories: ['footwear'], types: [] },
  shoe: { categories: ['footwear'], types: [] },
  boots: { categories: ['footwear'], types: [] },
  beauty: { categories: ['beauty'], types: [] },
  cosmetics: { categories: ['beauty'], types: [] },
  electronics: { categories: ['electronics'], types: [] },
  electronic: { categories: ['electronics'], types: [] },
  home: { categories: ['home & garden'], types: [] },
  garden: { categories: ['home & garden'], types: [] },
  toys: { categories: ['toys'], types: [] },
  tools: { categories: ['tools'], types: [] },
  clearance: { categories: [], types: ['clearance'] },
  accessories: { categories: ['accessories'], types: [] }
};

function getSearchFields(product) {
  return [
    product.name,
    product.title,
    product.id,
    product.sku,
    product.category,
    product.subcategory,
    product.brand,
    product.type,
    product.condition,
    product.description,
    ...(product.tags || [])
  ].filter(Boolean);
}

/**
 * Flexible partial match — "pallet" matches "pallets" and vice versa.
 */
export function flexibleMatch(text, term) {
  const field = String(text || '').toLowerCase().trim();
  const needle = String(term || '').toLowerCase().trim();
  if (!needle || !field) return false;
  if (field.includes(needle) || needle.includes(field)) return true;

  const stem = (s) => s.replace(/s$/, '').replace(/ies$/, 'y');
  const fStem = stem(field);
  const nStem = stem(needle);
  if (fStem.includes(nStem) || nStem.includes(fStem)) return true;
  if (fStem === nStem) return true;
  return false;
}

function matchesCategoryAlias(product, term) {
  const map = TERM_CATEGORY_MAP[term.toLowerCase()];
  if (!map) return false;

  const cat = (product.category || '').toLowerCase();
  const type = (product.type || '').toLowerCase();

  if (map.categories.some(c => cat === c || cat.includes(c))) return true;
  if (map.types.some(t => type === t || type.includes(t))) return true;
  return false;
}

export function productMatchesQuery(product, query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return true;

  const terms = expandSearchTerms(trimmed);
  const fields = getSearchFields(product);

  return terms.some(term =>
    fields.some(field => flexibleMatch(field, term)) ||
    matchesCategoryAlias(product, term)
  );
}

export function searchProducts(query, options = {}) {
  const { limit = Infinity, products = getAllProducts() } = options;
  const trimmed = String(query || '').trim();
  if (!trimmed) return products;

  const terms = expandSearchTerms(trimmed);
  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = products
    .filter(p => productMatchesQuery(p, trimmed))
    .map(product => {
      const fields = getSearchFields(product);
      let score = 0;

      terms.forEach(term => {
        if (flexibleMatch(product.name, term)) score += 14;
        if (flexibleMatch(product.brand, term)) score += 11;
        if (flexibleMatch(product.category, term)) score += 10;
        if (flexibleMatch(product.type, term)) score += 9;
        if (flexibleMatch(product.sku, term)) score += 9;
        if (flexibleMatch(product.subcategory, term)) score += 6;
        if (matchesCategoryAlias(product, term)) score += 12;
        fields.forEach(f => { if (flexibleMatch(f, term)) score += 2; });
      });

      words.forEach(word => {
        if (flexibleMatch(product.name, word)) score += 4;
        if (flexibleMatch(product.category, word)) score += 3;
      });

      return { product, score };
    });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.product);
}

export function getSearchSuggestions(query, limit = 8) {
  const trimmed = (query || '').trim().toLowerCase();
  const suggestions = [];

  if (!trimmed) {
    POPULAR_SEARCHES.forEach(term => {
      suggestions.push({ type: 'popular', text: term, query: term });
    });
    return suggestions.slice(0, limit);
  }

  const categories = ['Clothing', 'Footwear', 'Beauty', 'Electronics', 'Home & Garden', 'Pallets', 'Toys', 'Tools', 'Nike', 'Adidas'];
  categories.forEach(cat => {
    if (flexibleMatch(cat, trimmed)) {
      suggestions.push({ type: 'category', text: cat, query: cat, category: cat });
    }
  });

  searchProducts(trimmed, { limit: 5 }).forEach(p => {
    suggestions.push({ type: 'product', text: p.name, query: trimmed, productId: p.id, url: p.url });
  });

  const brands = new Set();
  getAllProducts().forEach(p => {
    if (p.brand && flexibleMatch(p.brand, trimmed) && !brands.has(p.brand)) {
      brands.add(p.brand);
      suggestions.push({ type: 'brand', text: p.brand, query: p.brand });
    }
  });

  return suggestions.slice(0, limit);
}

export function getPopularSearches() {
  return POPULAR_SEARCHES;
}
