/**
 * Category repository – category counts and lookups.
 */
import { CATEGORIES } from '../data/categories.js';
import { getAllProducts } from './productRepository.js';

export function getAllCategories() {
  return CATEGORIES;
}

export function getCategoryBySlug(slug) {
  return CATEGORIES.find(c => c.slug === slug) ?? null;
}

export function getCategoryByName(name) {
  return CATEGORIES.find(c => c.name.toLowerCase() === name.toLowerCase()) ?? null;
}

export function getCategoryCounts() {
  const products = getAllProducts();
  const counts = {};

  products.forEach(p => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  // Map special categories
  products.forEach(p => {
    if (p.type === 'Clearance') counts['Clearance'] = (counts['Clearance'] || 0) + 1;
    if (p.type === 'Surplus') counts['Surplus Stock'] = (counts['Surplus Stock'] || 0) + 1;
    if (p.type === 'Customer Returns' || p.type === 'Returns') {
      counts['Returns'] = (counts['Returns'] || 0) + 1;
    }
    if (p.type === 'Pallet') counts['Pallets'] = (counts['Pallets'] || 0) + 1;
    if (p.type === 'Job Lot') counts['Job Lots'] = (counts['Job Lots'] || 0) + 1;
  });

  return CATEGORIES.map(cat => ({
    ...cat,
    count: counts[cat.name] || 0
  }));
}

export function getPopularCategories(limit = 8) {
  return getCategoryCounts()
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
