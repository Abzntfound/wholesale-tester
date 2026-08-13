/**
 * Supabase product adapter — loads catalogue from PostgreSQL.
 */
import { getSupabase } from '../../js/supabase-client.js';
import { normalizeProducts } from '../../js/product-model.js';

export async function loadSupabaseProducts() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in js/env.js');
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (productsError) throw new Error(productsError.message);

  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('product_id, image_url, sort_order, is_primary')
    .order('sort_order', { ascending: true });

  if (imagesError) throw new Error(imagesError.message);

  const imagesByProduct = {};
  (images || []).forEach(row => {
    if (!imagesByProduct[row.product_id]) imagesByProduct[row.product_id] = [];
    imagesByProduct[row.product_id].push(row.image_url);
  });

  const mapped = (products || []).map(row => ({
    id: row.product_id || row.id,
    sku: row.product_id || row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    subcategory: row.subcategory,
    brand: row.brand,
    price: row.price,
    rrp: row.rrp,
    quantity: row.quantity,
    condition: row.condition,
    description: row.description,
    image: row.image_url,
    images: imagesByProduct[row.id] || (row.image_url ? [row.image_url] : []),
    url: row.product_url || `/product.html?slug=${encodeURIComponent(row.slug || row.product_id)}`,
    stockStatus: row.stock_status,
    type: row.product_type,
    tags: row.tags || [],
    featured: row.featured,
    dateAdded: row.created_at?.slice?.(0, 10) || row.created_at,
    source: 'supabase'
  }));

  return normalizeProducts(mapped);
}

export default loadSupabaseProducts;
