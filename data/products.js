/**
 * Product catalogue data layer.
 *
 * Replace `PRODUCTS` with `fetch('/api/products')` in productRepository.js
 * without redesigning the front end.
 */
import { BRANDS } from './brands.js';

const CATEGORY_CONFIG = {
  'Clothing': {
    subcategories: ["Women's Knitwear", "Men's T-Shirts", "Mixed Dresses", "Coats & Jackets", "Childrenswear", "Ex-Chain Apparel"],
    types: ['Job Lot', 'Clearance', 'End of Line', 'Customer Returns'],
    unitRange: [10, 50],
    priceRange: [99, 450],
    rrpMultiplier: [3.5, 6]
  },
  'Footwear': {
    subcategories: ["Ladies Footwear", "Men's Trainers", "Mixed Footwear", "Children's Shoes"],
    types: ['Job Lot', 'Clearance', 'Surplus'],
    unitRange: [12, 36],
    priceRange: [120, 380],
    rrpMultiplier: [3.8, 5.5]
  },
  'Beauty': {
    subcategories: ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Nail Care'],
    types: ['Job Lot', 'Clearance', 'End of Line'],
    unitRange: [24, 120],
    priceRange: [45, 280],
    rrpMultiplier: [4, 7]
  },
  'Electronics': {
    subcategories: ['Mobile Accessories', 'Audio', 'Cables & Adapters', 'Smart Home', 'Computing'],
    types: ['Job Lot', 'Surplus', 'Returns', 'Bankruptcy Stock'],
    unitRange: [20, 200],
    priceRange: [150, 1200],
    rrpMultiplier: [2.5, 4.5]
  },
  'Home & Garden': {
    subcategories: ['Homeware', 'Kitchen', 'Garden Tools', 'DIY', 'Party Supplies'],
    types: ['Job Lot', 'Pallet', 'Clearance', 'Surplus'],
    unitRange: [15, 500],
    priceRange: [80, 2500],
    rrpMultiplier: [3, 5]
  },
  'Pallets': {
    subcategories: ['Mixed Pallet', 'Single SKU Pallet', 'Retail Returns Pallet', 'Ex-Chain Pallet'],
    types: ['Pallet', 'Bankruptcy Stock', 'Surplus'],
    unitRange: [200, 2400],
    priceRange: [500, 3500],
    rrpMultiplier: [4, 8]
  },
  'Accessories': {
    subcategories: ['Handbags', 'Jewellery', 'Sunglasses', 'Belts & Scarves'],
    types: ['Job Lot', 'Clearance', 'Customer Returns'],
    unitRange: [20, 45],
    priceRange: [150, 350],
    rrpMultiplier: [3.5, 5.5]
  },
  'Toys': {
    subcategories: ['Action Figures', 'Board Games', 'Soft Toys', 'Outdoor Toys'],
    types: ['Job Lot', 'Clearance', 'End of Line'],
    unitRange: [24, 80],
    priceRange: [90, 400],
    rrpMultiplier: [3, 5]
  },
  'Sports & Leisure': {
    subcategories: ['Activewear', 'Fitness Equipment', 'Camping', 'Cycling'],
    types: ['Job Lot', 'Clearance', 'Surplus'],
    unitRange: [15, 60],
    priceRange: [110, 550],
    rrpMultiplier: [3.2, 5]
  },
  'Tools': {
    subcategories: ['Power Tools', 'Hand Tools', 'Trade Consumables', 'Hardware'],
    types: ['Job Lot', 'Pallet', 'Surplus', 'Bankruptcy Stock'],
    unitRange: [30, 300],
    priceRange: [200, 1800],
    rrpMultiplier: [2.8, 4.2]
  },
  'General Merchandise': {
    subcategories: ['Mixed General', 'Stationery', 'Party & Events', 'Seasonal'],
    types: ['Job Lot', 'Clearance', 'Returns', 'Surplus'],
    unitRange: [20, 150],
    priceRange: [60, 600],
    rrpMultiplier: [3, 6]
  },
  'Job Lots': {
    subcategories: ['Mixed Branded', 'Ex-High Street', 'Seasonal Mix', 'General Mixed'],
    types: ['Job Lot', 'Clearance'],
    unitRange: [15, 40],
    priceRange: [80, 350],
    rrpMultiplier: [3.5, 6]
  }
};

const TITLE_TEMPLATES = {
  'Clothing': [
    "Wholesale Job Lot of {units} Women's {brand} Mixed {sub}",
    "Mixed Branded {sub} Clearance Lot",
    "Ex-Chain {brand} {sub} Job Lot",
    "Wholesale {units} pcs {brand} Mixed Apparel"
  ],
  'Footwear': [
    "Ladies {brand} Footwear Clearance – {units} pairs",
    "Mixed Branded Footwear Job Lot – {units} pairs",
    "Wholesale {sub} – {brand} & More"
  ],
  'Beauty': [
    "{units} Units {brand} {sub} Clearance",
    "Beauty Clearance Lot – Mixed {sub}",
    "Wholesale {brand} {sub} Job Lot"
  ],
  'Electronics': [
    "Mixed {sub} Wholesale Lot – {units} units",
    "{brand} {sub} Surplus Stock",
    "Customer Returns {sub} Job Lot"
  ],
  'Home & Garden': [
    "Pallet of {units} {sub} – Mixed Brands",
    "{brand} {sub} Clearance Job Lot",
    "Wholesale {sub} Mixed Lot"
  ],
  'Pallets': [
    "Full Pallet of {sub} – {units}+ units",
    "Wholesale {brand} Pallet – RRP Over £{rrp}k",
    "Mixed Retail Returns Pallet – {sub}"
  ],
  'Accessories': [
    "Mix {units} pcs {sub} – Various Colours",
    "{brand} {sub} Wholesale Job Lot",
    "Mixed {sub} Clearance – {units} pieces"
  ],
  'Toys': [
    "Wholesale {sub} Job Lot – {units} units",
    "Mixed Branded Toys Clearance Pallet",
    "{brand} {sub} Surplus Stock"
  ],
  'Sports & Leisure': [
    "Mixed {sub} Job Lot – {units} pieces",
    "{brand} Activewear Clearance",
    "Wholesale {sub} – Trade Opportunity"
  ],
  'Tools': [
    "Trade {sub} Surplus – {units} units",
    "{brand} {sub} Wholesale Lot",
    "Mixed Hardware & Tools Pallet"
  ],
  'General Merchandise': [
    "Mixed General Merchandise Job Lot",
    "{sub} Clearance – {units} units",
    "Wholesale Mixed Stock – High Street Brands"
  ],
  'Job Lots': [
    "Mixed Branded Job Lot – {units} pieces",
    "Ex-High Street Mixed Stock",
    "General Mixed Wholesale Lot"
  ]
};

/** Hand-crafted flagship products mirroring real WCUK stock */
const FLAGSHIP_PRODUCTS = [
  {
    id: 'SKU54113WC',
    title: 'Pallet of Biodegradable Balloons, Party Plates & Invitations',
    category: 'Home & Garden',
    subcategory: 'Party Supplies',
    type: 'Pallet',
    price: 500,
    rrp: 14000,
    units: 2200,
    condition: 'New',
    stockStatus: 'in_stock',
    stock: 'in_stock',
    brand: 'Mixed Branded',
    tags: ['pallet', 'party', 'clearance', 'high-discount'],
    featured: true,
    popular: true,
    url: '/product/pallet-biodegradable-party-supplies',
    description: 'Full pallet of party supplies including biodegradable balloons, plates and invitations. Massive RRP value.',
    dateAdded: '2026-08-13'
  },
  {
    id: 'SKU599843P',
    title: 'A4 Eeveelutions Pokemon Art Prints',
    category: 'General Merchandise',
    subcategory: 'Stationery',
    type: 'Job Lot',
    price: 23.34,
    rrp: 100,
    units: 10,
    condition: 'New',
    stockStatus: 'in_stock',
    stock: 'in_stock',
    brand: 'Mixed Branded',
    tags: ['pokemon', 'prints', 'stationery'],
    featured: true,
    url: '/product/pokemon-art-prints',
    description: 'Wholesale lot of A4 Eeveelutions Pokemon art prints.',
    dateAdded: '2026-08-12'
  },
  {
    id: 'SKU59983WC',
    title: 'Pallet of 1,200 Qlime Bicycle Inner Tubes (26")',
    category: 'Sports & Leisure',
    subcategory: 'Cycling',
    type: 'Pallet',
    price: 700,
    rrp: 3600,
    units: 1200,
    condition: 'New',
    stockStatus: 'in_stock',
    stock: 'in_stock',
    brand: 'Qlime',
    tags: ['cycling', 'pallet', 'inner tubes'],
    featured: true,
    popular: true,
    url: '/product/qlime-bicycle-inner-tubes-pallet',
    description: 'Presta and Schrader valve bicycle inner tubes on full pallet.',
    dateAdded: '2026-08-12'
  },
  {
    id: 'SKU599823P',
    title: '48 Bottles Maybelline Green Edition Superdrop Tinted Oil',
    category: 'Beauty',
    subcategory: 'Makeup',
    type: 'Job Lot',
    price: 52,
    rrp: 480,
    units: 48,
    condition: 'New',
    stockStatus: 'in_stock',
    stock: 'in_stock',
    brand: 'Maybelline',
    tags: ['beauty', 'maybelline', 'makeup', 'clearance'],
    featured: true,
    popular: true,
    url: '/product/maybelline-green-edition-lot',
    description: 'Shade 30 Maybelline Green Edition Superdrop Tinted Oil wholesale lot.',
    dateAdded: '2026-08-11'
  },
  {
    id: 'SKU59974WC',
    title: "Wholesale Job Lot of 20 Women's Brakeburn Cream Honesty Jumpers",
    category: 'Clothing',
    subcategory: "Women's Knitwear",
    type: 'Job Lot',
    price: 300,
    rrp: 1300,
    units: 20,
    condition: 'New',
    stockStatus: 'in_stock',
    stock: 'in_stock',
    brand: 'Brakeburn',
    tags: ['clothing', 'brakeburn', 'knitwear', 'branded'],
    featured: true,
    popular: true,
    url: '/product/brakeburn-honesty-jumpers',
    description: "Twenty Brakeburn cream honesty jumpers – excellent branded clothing lot.",
    dateAdded: '2026-08-11'
  },
  {
    id: 'SKU57886WC',
    title: "Wholesale Job Lot of 10 Women's Brakeburn Mixed Knitwear",
    category: 'Clothing',
    subcategory: "Women's Knitwear",
    type: 'Job Lot',
    price: 99,
    rrp: 495,
    units: 10,
    condition: 'New',
    stockStatus: 'in_stock',
    stock: 'in_stock',
    brand: 'Brakeburn',
    tags: ['clothing', 'brakeburn', 'knitwear'],
    url: '/product/brakeburn-mixed-knitwear',
    description: 'Great variety mixed knitwear from Brakeburn.',
    dateAdded: '2026-08-10'
  },
  {
    id: 'SKU59972WC',
    title: 'Pallet of 2,000 Little Explorers Premium Buggy Clips',
    category: 'General Merchandise',
    subcategory: 'Mixed General',
    type: 'Pallet',
    price: 2500,
    rrp: 10000,
    units: 2000,
    condition: 'New',
    stockStatus: 'in_stock',
    stock: 'in_stock',
    brand: 'Little Explorers',
    tags: ['pallet', 'baby', 'accessories'],
    featured: true,
    url: '/product/little-explorers-buggy-clips-pallet',
    description: '2-pack universal buggy hooks on full pallet.',
    dateAdded: '2026-08-10'
  },
  {
    id: 'SKU599813P',
    title: 'Mix 30 pcs Soft PU Medium/Large Hobo Shoulder Bags',
    category: 'Accessories',
    subcategory: 'Handbags',
    type: 'Job Lot',
    price: 208,
    rrp: 1092,
    units: 30,
    condition: 'Mixed',
    stockStatus: 'in_stock',
    stock: 'in_stock',
    brand: 'Ex-Branded',
    tags: ['handbags', 'accessories', 'mixed'],
    url: '/product/soft-pu-hobo-shoulder-bags',
    description: 'Multicolour tassel hobo shoulder bags in mixed colours.',
    dateAdded: '2026-08-09'
  },
  {
    id: 'SKU57260WC',
    title: "Wholesale Job Lot of 25 Men's Brakeburn Mixed T-Shirts",
    category: 'Clothing',
    subcategory: "Men's T-Shirts",
    type: 'Job Lot',
    price: 149,
    rrp: 745,
    units: 25,
    condition: 'New',
    stockStatus: 'in_stock',
    stock: 'in_stock',
    brand: 'Brakeburn',
    tags: ['clothing', 'brakeburn', 'mens'],
    popular: true,
    url: '/product/brakeburn-mens-tshirts',
    description: 'Twenty-five mixed Brakeburn t-shirts with great variety.',
    dateAdded: '2026-08-09'
  },
  {
    id: 'SKU52474WC',
    title: 'Wholesale Joblot of 10 Unisex Brakeburn Mixed Chinook Changing Robes',
    category: 'Clothing',
    subcategory: 'Mixed Branded',
    type: 'Job Lot',
    price: 229,
    rrp: 1430,
    units: 10,
    condition: 'New',
    stockStatus: 'low_stock',
    stock: 'low_stock',
    brand: 'Brakeburn',
    tags: ['clothing', 'brakeburn', 'robes'],
    url: '/product/brakeburn-changing-robes',
    description: 'Premium unisex changing robes from Brakeburn.',
    dateAdded: '2026-08-08'
  }
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

function randBetween(min, max, seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return min + (x - Math.floor(x)) * (max - min);
}

function roundPrice(n) {
  if (n >= 1000) return Math.round(n / 10) * 10;
  if (n >= 100) return Math.round(n);
  return Math.round(n * 100) / 100;
}

function generateProduct(index) {
  const categories = Object.keys(CATEGORY_CONFIG);
  const category = pick(categories, index * 7 + 3);
  const config = CATEGORY_CONFIG[category];
  const subcategory = pick(config.subcategories, index);
  const type = pick(config.types, index * 11);
  const brand = pick(BRANDS, index * 13);
  const units = Math.round(randBetween(config.unitRange[0], config.unitRange[1], index));
  const price = roundPrice(randBetween(config.priceRange[0], config.priceRange[1], index * 17));
  const rrpMult = randBetween(config.rrpMultiplier[0], config.rrpMultiplier[1], index * 19);
  const rrp = roundPrice(price * rrpMult);
  const template = pick(TITLE_TEMPLATES[category] || TITLE_TEMPLATES['General Merchandise'], index);
  const title = template
    .replace('{units}', units)
    .replace('{brand}', brand)
    .replace('{sub}', subcategory)
    .replace('{rrp}', Math.round(rrp / 1000));

  const conditions = type === 'Customer Returns' || type === 'Returns' ? ['Returns', 'Mixed'] : ['New', 'Clearance', 'Mixed'];
  const condition = pick(conditions, index);
  const stockRoll = index % 17;
  const stock = stockRoll === 0 ? 'sold_out' : stockRoll <= 2 ? 'low_stock' : 'in_stock';
  const daysAgo = index % 90;
  const date = new Date('2026-08-13');
  date.setDate(date.getDate() - daysAgo);

  const id = `SKU${(60000 + index).toString().slice(0, 5)}${index % 3 === 0 ? 'WC' : 'P'}`;
  const slug = slugify(title) + '-' + index;
  const imageId = id.match(/SKU(\d+)/i)?.[1];

  return {
    id,
    sku: id,
    title,
    name: title,
    category,
    subcategory,
    type,
    price,
    rrp,
    units,
    condition,
    stock,
    brand,
    imageId,
    image: imageId ? `https://www.wholesaleclearance.co.uk/prod_thumb/540x500/${imageId}.jpg` : `images/products/${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`,
    tags: [category.toLowerCase(), type.toLowerCase().replace(/\s+/g, '-'), brand.toLowerCase().replace(/\s+/g, '-')],
    featured: index % 47 === 0,
    popular: index % 31 === 0,
    url: `/product.html?sku=${encodeURIComponent(id)}`,
    description: `${title}. Wholesale ${type.toLowerCase()} from Wholesale Clearance UK. ${units} units, ${condition} condition.`,
    dateAdded: date.toISOString().split('T')[0],
    source: 'development-sample',
    quantity: units,
    stockStatus: stock
  };
}

/** Total catalogue size – matches existing site scale */
export const TOTAL_CATALOGUE_SIZE = 4089;

const generatedCount = TOTAL_CATALOGUE_SIZE - FLAGSHIP_PRODUCTS.length;
const GENERATED_PRODUCTS = Array.from({ length: generatedCount }, (_, i) => generateProduct(i + 1));

FLAGSHIP_PRODUCTS.forEach(p => {
  if (!p.image) {
    p.image = `images/products/${p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
  }
});

/**
 * Full product catalogue.
 * Swap this export for an API response in productRepository.js.
 */
export const PRODUCTS = [...FLAGSHIP_PRODUCTS, ...GENERATED_PRODUCTS];

export default PRODUCTS;
