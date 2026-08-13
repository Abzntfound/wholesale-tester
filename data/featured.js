/**
 * Featured section configuration.
 * Sections are populated dynamically from the product repository.
 */
export const FEATURED_SECTIONS = [
  {
    id: 'latest',
    title: 'Latest Stock',
    subtitle: 'Fresh job lots added daily',
    getter: 'getLatestProducts',
    limit: 8,
    viewAllQuery: { sort: 'newest' }
  },
  {
    id: 'biggest-discounts',
    title: 'Biggest Discounts',
    subtitle: 'Maximum margin opportunities',
    getter: 'getBiggestDiscounts',
    limit: 8,
    viewAllQuery: { sort: 'discount' }
  },
  {
    id: 'clearance-deals',
    title: 'Clearance Deals',
    subtitle: 'End-of-line and surplus bargains',
    getter: 'getClearanceDeals',
    limit: 8,
    viewAllQuery: { type: 'Clearance' }
  },
  {
    id: 'pallets',
    title: 'Pallets & Large Lots',
    subtitle: 'Bulk wholesale opportunities',
    getter: 'getPalletLots',
    limit: 6,
    viewAllQuery: { category: 'Pallets' }
  },
  {
    id: 'trade-favourites',
    title: 'Trade Favourites',
    subtitle: 'Popular picks with resellers',
    getter: 'getTradeFavourites',
    limit: 8,
    viewAllQuery: { sort: 'popular' }
  }
];

export default FEATURED_SECTIONS;
