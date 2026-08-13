/**
 * Search synonym map for sensible matching.
 * "ladies shoes" → footwear, women, etc.
 */
export const SEARCH_SYNONYMS = {
  shoe: ['shoe', 'shoes', 'footwear', 'trainer', 'trainers', 'boot', 'boots', 'sandal'],
  shoes: ['shoe', 'shoes', 'footwear', 'trainer', 'trainers'],
  ladies: ['ladies', 'women', 'womens', "women's", 'female'],
  women: ['ladies', 'women', 'womens', "women's"],
  mens: ['men', 'mens', "men's", 'male'],
  men: ['men', 'mens', "men's"],
  clothing: ['clothing', 'clothes', 'apparel', 'garment', 'fashion', 'wear'],
  clothes: ['clothing', 'clothes', 'apparel'],
  pallet: ['pallet', 'pallets', 'bulk', 'large lot'],
  pallets: ['pallet', 'pallets'],
  nike: ['nike'],
  adidas: ['adidas'],
  beauty: ['beauty', 'cosmetic', 'cosmetics', 'skincare', 'makeup', 'make-up'],
  makeup: ['makeup', 'make-up', 'cosmetic', 'beauty'],
  footwear: ['footwear', 'shoe', 'shoes', 'trainer', 'trainers', 'boot', 'boots', 'sandal', 'sandals'],
  home: ['home', 'garden', 'household', 'homeware', 'decor', 'kitchen'],
  electronics: ['electronics', 'electronic', 'electrical', 'tech', 'gadget', 'gadgets', 'media'],
  toy: ['toy', 'toys', 'games', 'game'],
  tools: ['tool', 'tools', 'hardware', 'diy'],
  clearance: ['clearance', 'discounted', 'sale', 'surplus'],
  branded: ['branded', 'brand', 'label'],
  joblot: ['joblot', 'job lot', 'job lots', 'lot', 'lots', 'wholesale']
};

export function expandSearchTerms(query) {
  const terms = String(query || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  const expanded = new Set(terms);

  terms.forEach(term => {
    expanded.add(term);
    const syns = SEARCH_SYNONYMS[term];
    if (syns) syns.forEach(s => expanded.add(s));
    // partial brand match
    Object.keys(SEARCH_SYNONYMS).forEach(key => {
      if (key.startsWith(term) || term.startsWith(key)) {
        SEARCH_SYNONYMS[key].forEach(s => expanded.add(s));
      }
    });
  });

  return [...expanded];
}

export default expandSearchTerms;
