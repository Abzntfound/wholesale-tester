/**
 * Product filtering and sorting logic.
 */
import { calcDiscount } from '../repositories/productRepository.js';
import { searchProducts } from '../repositories/searchRepository.js';

export function filterProducts(products, state) {
  let result = [...products];

  if (state.q) {
    result = searchProducts(state.q, { products: result });
  }

  if (state.category) {
    const cat = state.category.toLowerCase();
    result = result.filter(p => {
      if (cat === 'clearance') return p.type === 'Clearance' || p.condition === 'Clearance';
      if (cat === 'surplus stock') return p.type === 'Surplus';
      if (cat === 'returns') return p.type === 'Returns' || p.type === 'Customer Returns';
      if (cat === 'job lots') return p.type === 'Job Lot';
      if (cat === 'pallets') return p.type === 'Pallet' || p.category === 'Pallets';
      return p.category.toLowerCase() === cat;
    });
  }

  if (state.brand) {
    result = result.filter(p =>
      p.brand?.toLowerCase() === state.brand.toLowerCase()
    );
  }

  if (state.subcategory) {
    result = result.filter(p =>
      p.subcategory?.toLowerCase() === state.subcategory.toLowerCase()
    );
  }

  if (state.type) {
    result = result.filter(p => p.type.toLowerCase() === state.type.toLowerCase());
  }

  if (state.condition) {
    result = result.filter(p => p.condition.toLowerCase() === state.condition.toLowerCase());
  }

  if (state.min) {
    const min = parseFloat(state.min);
    if (!isNaN(min)) result = result.filter(p => p.price >= min);
  }

  if (state.max) {
    const max = parseFloat(state.max);
    if (!isNaN(max)) result = result.filter(p => p.price <= max);
  }

  if (state.discount) {
    const threshold = parseInt(state.discount, 10);
    if (!isNaN(threshold)) {
      result = result.filter(p => calcDiscount(p) >= threshold);
    }
  }

  return result;
}

export function sortProducts(products, sortKey) {
  const sorted = [...products];

  switch (sortKey) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);
    case 'discount':
      return sorted.sort((a, b) => calcDiscount(b) - calcDiscount(a));
    case 'stock':
      return sorted.sort((a, b) => (b.quantity ?? b.units ?? 0) - (a.quantity ?? a.units ?? 0));
    case 'popular':
      return sorted.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    case 'featured':
    default:
      return sorted.sort((a, b) => {
        if (a.stock === 'sold_out' && b.stock !== 'sold_out') return 1;
        if (b.stock === 'sold_out' && a.stock !== 'sold_out') return -1;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
          new Date(b.dateAdded) - new Date(a.dateAdded);
      });
  }
}

export function paginateProducts(products, page, perPage) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return {
    items: products.slice(0, end),
    total: products.length,
    page,
    perPage,
    hasMore: end < products.length,
    showingFrom: products.length ? start + 1 : 0,
    showingTo: Math.min(end, products.length)
  };
}
