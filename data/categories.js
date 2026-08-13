/**
 * Category definitions for Wholesale Clearance UK catalogue.
 * Replace this file or fetch from /api/categories when connecting to a backend.
 */
export const CATEGORIES = [
  {
    id: 'job-lots',
    name: 'Job Lots',
    slug: 'job-lots',
    icon: 'boxes',
    image: 'images/categories/job-lots.svg',
    description: 'Mixed wholesale job lots ready for resale',
    query: { category: 'Job Lots' }
  },
  {
    id: 'pallets',
    name: 'Pallets',
    slug: 'pallets',
    icon: 'pallet',
    image: 'images/categories/pallets.svg',
    description: 'Full pallet loads of clearance and surplus stock',
    query: { category: 'Pallets' }
  },
  {
    id: 'clothing',
    name: 'Clothing',
    slug: 'clothing',
    icon: 'shirt',
    image: 'images/categories/clothing.svg',
    description: 'Branded and ex-chain clothing job lots',
    query: { category: 'Clothing' }
  },
  {
    id: 'footwear',
    name: 'Footwear',
    slug: 'footwear',
    icon: 'shoe',
    image: 'images/categories/footwear.svg',
    description: 'Ladies, mens and childrens footwear clearance',
    query: { category: 'Footwear' }
  },
  {
    id: 'accessories',
    name: 'Accessories',
    slug: 'accessories',
    icon: 'bag',
    image: 'images/categories/accessories.svg',
    description: 'Bags, jewellery and fashion accessories',
    query: { category: 'Accessories' }
  },
  {
    id: 'beauty',
    name: 'Beauty',
    slug: 'beauty',
    icon: 'sparkle',
    image: 'images/categories/beauty.svg',
    description: 'Cosmetics, skincare and beauty clearance',
    query: { category: 'Beauty' }
  },
  {
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    icon: 'chip',
    image: 'images/categories/electronics.svg',
    description: 'Consumer electronics and tech surplus',
    query: { category: 'Electronics' }
  },
  {
    id: 'home-garden',
    name: 'Home & Garden',
    slug: 'home-garden',
    icon: 'home',
    image: 'images/categories/home-garden.svg',
    description: 'Homeware, DIY and garden clearance',
    query: { category: 'Home & Garden' }
  },
  {
    id: 'toys',
    name: 'Toys',
    slug: 'toys',
    icon: 'toy',
    image: 'images/categories/toys.svg',
    description: 'Toy and games wholesale opportunities',
    query: { category: 'Toys' }
  },
  {
    id: 'sports-leisure',
    name: 'Sports & Leisure',
    slug: 'sports-leisure',
    icon: 'sport',
    image: 'images/categories/sports.svg',
    description: 'Sportswear, equipment and leisure stock',
    query: { category: 'Sports & Leisure' }
  },
  {
    id: 'tools',
    name: 'Tools',
    slug: 'tools',
    icon: 'wrench',
    image: 'images/categories/tools.svg',
    description: 'Trade tools and hardware surplus',
    query: { category: 'Tools' }
  },
  {
    id: 'general',
    name: 'General Merchandise',
    slug: 'general-merchandise',
    icon: 'grid',
    image: 'images/categories/general.svg',
    description: 'Mixed general merchandise job lots',
    query: { category: 'General Merchandise' }
  },
  {
    id: 'returns',
    name: 'Returns',
    slug: 'returns',
    icon: 'return',
    image: 'images/categories/returns.svg',
    description: 'Customer returns and graded stock',
    query: { type: 'Customer Returns' }
  },
  {
    id: 'clearance',
    name: 'Clearance',
    slug: 'clearance',
    icon: 'tag',
    image: 'images/categories/clearance.svg',
    description: 'Heavily discounted end-of-line clearance',
    query: { type: 'Clearance' }
  },
  {
    id: 'surplus',
    name: 'Surplus Stock',
    slug: 'surplus',
    icon: 'warehouse',
    image: 'images/categories/surplus.svg',
    description: 'Excess and overstock wholesale deals',
    query: { type: 'Surplus' }
  }
];

export const POPULAR_SEARCHES = [
  'Clothing',
  'Pallets',
  'Footwear',
  'Beauty',
  'Electronics'
];

export const STOCK_TYPES = [
  'Job Lot',
  'Pallet',
  'Clearance',
  'Surplus',
  'Returns',
  'End of Line',
  'Customer Returns',
  'Bankruptcy Stock'
];

export const CONDITIONS = ['New', 'Clearance', 'Returns', 'Mixed'];

export const PRICE_RANGES = [
  { label: 'Under £100', min: 0, max: 100 },
  { label: '£100–£250', min: 100, max: 250 },
  { label: '£250–£500', min: 250, max: 500 },
  { label: '£500–£1,000', min: 500, max: 1000 },
  { label: '£1,000+', min: 1000, max: null }
];

export const DISCOUNT_THRESHOLDS = [20, 40, 60, 70, 80];

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'discount', label: 'Biggest Discount' },
  { value: 'stock', label: 'Most Stock' },
  { value: 'popular', label: 'Most Popular' }
];
