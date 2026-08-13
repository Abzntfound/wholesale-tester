/**
 * Wholesale Clearance UK – Job Lots Catalogue App
 */
import {
  initProductRepository, getLoadError, getAllProducts,
  getLatestProducts, getBiggestDiscounts, getClearanceDeals, getPalletLots, getTradeFavourites,
  getBrandsWithCounts
} from '../repositories/productRepository.js';
import { getCategoryCounts, getPopularCategories } from '../repositories/categoryRepository.js';
import { FEATURED_SECTIONS } from '../data/featured.js';
import { CATEGORIES, STOCK_TYPES, CONDITIONS, PRICE_RANGES, DISCOUNT_THRESHOLDS, SORT_OPTIONS } from '../data/categories.js';
import { readState, updateState, onPopState, getActiveFilterCount } from './url-state.js';
import { filterProducts, sortProducts, paginateProducts } from './filters.js';
import { PER_PAGE, renderPaginationBar, showLoadingSkeleton } from './pagination.js';
import { renderProductGrid, renderFeaturedSection, renderCategoryGrid } from './products.js';
import { initSearch, bindSearchForms } from './search.js';
import { initLayout, renderPageError } from './layout.js';
import * as Cart from './cart.js';
import * as Wishlist from './wishlist.js';

const SECTION_GETTERS = {
  getLatestProducts,
  getBiggestDiscounts,
  getClearanceDeals,
  getPalletLots,
  getTradeFavourites
};

let currentState = readState();
let mobileFiltersOpen = false;

function init() {
  bindNavigation();
  bindFilters();
  bindSort();
  bindMobileUI();
  initSearchUI();
  renderFeaturedSections();
  renderPopularCategories();
  syncUIFromState(currentState);
  toggleFilteredMode(currentState);
  renderCatalogue();
  updateBadges();
  updateStructuredData();
  onPopState(handleStateChange);
}

function handleStateChange(state) {
  currentState = state;
  syncUIFromState(state);
  renderCatalogue();
}

function syncUIFromState(state) {
  // Search inputs
  document.querySelectorAll('[data-search-input]').forEach(input => {
    if (input.value !== (state.q || '')) input.value = state.q || '';
  });

  // Sort select
  const sortSelect = document.getElementById('sort-select');
  const mobileSort = document.getElementById('mobile-sort-select');
  if (sortSelect && sortSelect.value !== state.sort) sortSelect.value = state.sort;
  if (mobileSort && mobileSort.value !== state.sort) mobileSort.value = state.sort;

  // Filter checkboxes / inputs
  syncFilterUI(state);

  // Breadcrumb
  renderBreadcrumbs(state);

  // Filter count badge
  const count = getActiveFilterCount(state);
  document.querySelectorAll('[data-filter-count]').forEach(el => {
    el.textContent = count;
    el.classList.toggle('has-filters', count > 0);
  });

  // Active category pills
  document.querySelectorAll('.category-card').forEach(card => {
    card.classList.toggle('is-active', card.dataset.category === state.category);
  });
}

function syncFilterUI(state) {
  document.querySelectorAll('[data-filter]').forEach(el => {
    if (el.type !== 'checkbox' && el.type !== 'radio') return;

    const filter = el.dataset.filter;
    const value = el.value ?? '';

    if (filter === 'category') el.checked = value === state.category;
    if (filter === 'type') el.checked = value === state.type;
    if (filter === 'condition') el.checked = value === state.condition;
    if (filter === 'brand') el.checked = value === state.brand;
    if (filter === 'discount') el.checked = value === state.discount;
    if (filter === 'price-range' && value.includes('-')) {
      const [min, max] = value.split('-');
      el.checked = state.min === min && (state.max || '') === (max || '');
    }
  });

  const minInput = document.querySelector('.filters-sidebar .price-min-input, #filters-panel .price-min-input');
  const maxInput = document.querySelector('.filters-sidebar .price-max-input, #filters-panel .price-max-input');
  document.querySelectorAll('.price-min-input').forEach(el => { if (state.min) el.value = state.min; });
  document.querySelectorAll('.price-max-input').forEach(el => { if (state.max) el.value = state.max; });
}

function renderCatalogue() {
  const grid = document.getElementById('product-grid');
  const paginationEl = document.getElementById('pagination');
  if (!grid) return;

  const allProducts = getAllProducts();
  const filtered = filterProducts(allProducts, currentState);
  const sorted = sortProducts(filtered, currentState.sort);
  const page = parseInt(currentState.page, 10) || 1;
  const pagination = paginateProducts(sorted, page, PER_PAGE);

  renderProductGrid(grid, pagination.items);
  renderPaginationBar(paginationEl, pagination, () => {
    const nextPage = page + 1;
    currentState = updateState({ page: String(nextPage) }, true);
    renderCatalogue();
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const heading = document.getElementById('results-count');
  if (heading) {
    heading.textContent = `${pagination.total.toLocaleString()} lot${pagination.total !== 1 ? 's' : ''}`;
  }

  renderActiveSearch(currentState, pagination.total);
  toggleFilteredMode(currentState);
  updateStructuredData();
}

function renderActiveSearch(state, total) {
  const el = document.getElementById('active-search');
  if (!el) return;

  const parts = [];
  if (state.q) {
    parts.push(`<span class="search-chip">Search: <strong>${escapeHtml(state.q)}</strong> <button type="button" class="search-chip-clear" data-clear="q" aria-label="Clear search">×</button></span>`);
  }
  if (state.category) {
    parts.push(`<span class="search-chip">Category: <strong>${escapeHtml(state.category)}</strong> <button type="button" class="search-chip-clear" data-clear="category" aria-label="Clear category">×</button></span>`);
  }
  if (state.brand) {
    parts.push(`<span class="search-chip">Brand: <strong>${escapeHtml(state.brand)}</strong> <button type="button" class="search-chip-clear" data-clear="brand" aria-label="Clear brand">×</button></span>`);
  }

  if (!parts.length) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }

  el.hidden = false;
  el.innerHTML = `
    <div class="active-search-inner">
      <p class="active-search-label">Showing ${total.toLocaleString()} result${total !== 1 ? 's' : ''} for:</p>
      <div class="active-search-chips">${parts.join('')}</div>
      <button type="button" class="btn btn-ghost btn-sm" id="clear-all-search">Clear all</button>
    </div>`;

  el.querySelector('#clear-all-search')?.addEventListener('click', () => {
    currentState = updateState({
      q: '', category: '', subcategory: '', type: '', condition: '', brand: '',
      min: '', max: '', discount: '', page: '1'
    });
    syncUIFromState(currentState);
    renderCatalogue();
  });

  el.querySelectorAll('.search-chip-clear').forEach(btn => {
    btn.addEventListener('click', () => {
      applyFilter({ [btn.dataset.clear]: '', page: '1' });
    });
  });
}

function toggleFilteredMode(state) {
  const isFiltered = !!(state.q || state.category || state.brand || state.type || state.condition || state.min || state.max || state.discount);
  document.body.classList.toggle('is-catalogue-filtered', isFiltered);
}

function renderFeaturedSections() {
  FEATURED_SECTIONS.forEach(section => {
    const el = document.getElementById(`featured-${section.id}`);
    if (!el) return;
    const getter = SECTION_GETTERS[section.getter];
    if (getter) {
      renderFeaturedSection(el, getter(section.limit), section);
    }
  });
}

function renderPopularCategories() {
  const container = document.getElementById('category-grid');
  if (!container) return;
  renderCategoryGrid(container, getCategoryCounts(), (category) => {
    applyFilter({ category, q: '' });
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function renderBreadcrumbs(state) {
  const el = document.getElementById('breadcrumbs');
  if (!el) return;

  const crumbs = [{ label: 'Home', href: 'joblots.html' }, { label: 'Job Lots', href: 'joblots.html' }];

  if (state.category) {
    crumbs.push({ label: state.category, href: `joblots.html?category=${encodeURIComponent(state.category)}` });
  }
  if (state.q) {
    crumbs.push({ label: `Search: "${state.q}"`, href: null });
  }

  el.innerHTML = crumbs.map((c, i) => {
    const isLast = i === crumbs.length - 1;
    if (isLast || !c.href) {
      return `<li aria-current="page">${escapeHtml(c.label)}</li>`;
    }
    return `<li><a href="${c.href}">${escapeHtml(c.label)}</a></li>`;
  }).join('');
}

function applyFilter(partial) {
  currentState = updateState(partial);
  syncUIFromState(currentState);
  renderCatalogue();
}

function applySearch(query) {
  applyFilter({ q: query, page: '1', category: '' });
  document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initSearchUI() {
  document.querySelectorAll('.search-wrapper').forEach(wrapper => {
    const input = wrapper.querySelector('[data-search-input]');
    const suggestions = wrapper.querySelector('.search-suggestions');

    initSearch({
      input,
      suggestionsEl: suggestions,
      onSearch: applySearch,
      onSuggestionSelect: (suggestion) => {
        if (input) input.value = suggestion.text;
        if (suggestion.category) {
          applyFilter({ category: suggestion.category, q: '' });
        } else if (suggestion.url) {
          window.location.href = suggestion.url;
        } else {
          applySearch(suggestion.query || suggestion.text);
        }
      }
    });
  });

  bindSearchForms(applySearch);
}

function bindNavigation() {
  // Header category links
  document.querySelectorAll('[data-nav-category]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href') || '';
      if (href.includes('?')) {
        const params = new URLSearchParams(href.split('?').pop());
        const partial = { q: '', page: '1' };
        params.forEach((value, key) => { partial[key] = value; });
        applyFilter(partial);
      } else {
        applyFilter({ category: link.dataset.navCategory || '', q: '' });
      }
      document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hero CTAs
  document.getElementById('hero-browse')?.addEventListener('click', () => {
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('hero-latest')?.addEventListener('click', () => {
    applyFilter({ sort: 'newest', category: '', q: '' });
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Clear filters
  document.addEventListener('click', (e) => {
    if (e.target.closest('.clear-filters-btn') || e.target.id === 'clear-filters') {
      currentState = updateState({
        q: '', category: '', subcategory: '', type: '', condition: '', brand: '',
        min: '', max: '', discount: '', sort: 'featured', page: '1'
      });
      syncUIFromState(currentState);
      renderCatalogue();
    }
  });

  // Mobile menu
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  menuBtn?.addEventListener('click', () => {
    const open = mobileNav?.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', open);
  });
}

function bindFilters() {
  document.querySelectorAll('[data-filter]').forEach(el => {
    el.addEventListener('change', () => {
      const { filter } = el.dataset;

      // Single-select behaviour per filter group
      if (el.checked) {
        document.querySelectorAll(`[data-filter="${filter}"]`).forEach(other => {
          if (other !== el) other.checked = false;
        });
      }

      const partial = {};

      if (filter === 'category') {
        partial.category = el.checked ? el.value : '';
      } else if (filter === 'type') {
        partial.type = el.checked ? el.value : '';
      } else if (filter === 'condition') {
        partial.condition = el.checked ? el.value : '';
      } else if (filter === 'brand') {
        partial.brand = el.checked ? el.value : '';
      } else if (filter === 'discount') {
        partial.discount = el.checked ? el.value : '';
      } else if (filter === 'price-range') {
        if (el.checked) {
          const [min, max] = el.value.split('-');
          partial.min = min;
          partial.max = max || '';
        } else {
          partial.min = '';
          partial.max = '';
        }
      }

      applyFilter(partial);
    });
  });

  // Price min/max
  let priceTimer;

  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('price-min-input') || e.target.classList.contains('price-max-input')) {
      clearTimeout(priceTimer);
      priceTimer = setTimeout(() => {
        const panel = e.target.closest('#filters-panel, #filters-panel-mobile, .filters-sidebar');
        const minEl = panel?.querySelector('.price-min-input') || document.querySelector('.price-min-input');
        const maxEl = panel?.querySelector('.price-max-input') || document.querySelector('.price-max-input');
        applyFilter({ min: minEl?.value || '', max: maxEl?.value || '' });
      }, 400);
    }
  });
}

function bindSort() {
  const sortSelect = document.getElementById('sort-select');
  sortSelect?.addEventListener('change', () => {
    applyFilter({ sort: sortSelect.value });
  });

  const mobileSort = document.getElementById('mobile-sort-select');
  mobileSort?.addEventListener('change', () => {
    applyFilter({ sort: mobileSort.value });
    sortSelect.value = mobileSort.value;
  });
}

function bindMobileUI() {
  const filterBtn = document.getElementById('mobile-filter-btn');
  const filterDrawer = document.getElementById('filter-drawer');
  const filterOverlay = document.getElementById('filter-overlay');
  const filterClose = document.getElementById('filter-close');

  function openFilters() {
    filterDrawer?.classList.add('is-open');
    filterOverlay?.classList.add('is-open');
    document.body.classList.add('filter-open');
    mobileFiltersOpen = true;
  }

  function closeFilters() {
    filterDrawer?.classList.remove('is-open');
    filterOverlay?.classList.remove('is-open');
    document.body.classList.remove('filter-open');
    mobileFiltersOpen = false;
  }

  filterBtn?.addEventListener('click', openFilters);
  filterClose?.addEventListener('click', closeFilters);
  filterOverlay?.addEventListener('click', closeFilters);

  // Category scroll
  const catScroll = document.getElementById('header-categories');
  if (catScroll) {
    let isDown = false, startX, scrollLeft;
    catScroll.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - catScroll.offsetLeft;
      scrollLeft = catScroll.scrollLeft;
    });
    catScroll.addEventListener('mouseleave', () => { isDown = false; });
    catScroll.addEventListener('mouseup', () => { isDown = false; });
    catScroll.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      catScroll.scrollLeft = scrollLeft - (e.pageX - catScroll.offsetLeft - startX) * 1.5;
    });
  }
}

function updateBadges() {
  Cart.updateBadge();
  Wishlist.updateBadge();
}

function updateStructuredData() {
  const products = filterProducts(getAllProducts(), currentState);
  const sorted = sortProducts(products, currentState.sort).slice(0, 12);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Wholesale Job Lots',
    numberOfItems: products.length,
    itemListElement: sorted.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.wholesaleclearance.co.uk${p.url}`,
      item: {
        '@type': 'Product',
        name: p.title,
        category: p.category,
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: 'GBP',
          availability: p.stock === 'sold_out'
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock'
        }
      }
    }))
  };

  let el = document.getElementById('product-structured-data');
  if (!el) {
    el = document.createElement('script');
    el.id = 'product-structured-data';
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderFilterPanel() {
  const panel = document.getElementById('filters-panel');
  const mobilePanel = document.getElementById('filters-panel-mobile');
  if (!panel || panel.dataset.rendered) return;

  const filterHTML = buildFilterHTML();

  panel.innerHTML = filterHTML;
  if (mobilePanel) mobilePanel.innerHTML = filterHTML;

  panel.dataset.rendered = 'true';
  bindFilters();
  syncFilterUI(currentState);
}

function buildFilterHTML() {
  const categories = getCategoryCounts().filter(c => c.count > 0);
  const brands = getBrandsWithCounts(20);

  return `
    <div class="filter-group">
      <h3 class="filter-title">Category</h3>
      <ul class="filter-list">
        ${categories.map(c => `
          <li>
            <label class="filter-checkbox">
              <input type="checkbox" data-filter="category" value="${escapeAttr(c.name)}" />
              <span>${escapeHtml(c.name)}</span>
              <span class="filter-count">${c.count.toLocaleString()}</span>
            </label>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="filter-group">
      <h3 class="filter-title">Brand</h3>
      <ul class="filter-list filter-list--scroll">
        ${brands.map(b => `
          <li>
            <label class="filter-checkbox">
              <input type="checkbox" data-filter="brand" value="${escapeAttr(b.name)}" />
              <span>${escapeHtml(b.name)}</span>
              <span class="filter-count">${b.count.toLocaleString()}</span>
            </label>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="filter-group">
      <h3 class="filter-title">Price</h3>
      <ul class="filter-list">
        ${PRICE_RANGES.map(r => `
          <li>
            <label class="filter-checkbox">
              <input type="checkbox" data-filter="price-range" value="${r.min}-${r.max ?? ''}" />
              <span>${r.label}</span>
            </label>
          </li>
        `).join('')}
      </ul>
      <div class="price-inputs">
        <label>Min £<input type="number" class="price-min-input" min="0" placeholder="0" /></label>
        <span>–</span>
        <label>Max £<input type="number" class="price-max-input" min="0" placeholder="Any" /></label>
      </div>
    </div>

    <div class="filter-group">
      <h3 class="filter-title">Stock Type</h3>
      <ul class="filter-list">
        ${STOCK_TYPES.map(t => `
          <li>
            <label class="filter-checkbox">
              <input type="checkbox" data-filter="type" value="${escapeAttr(t)}" />
              <span>${escapeHtml(t)}</span>
            </label>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="filter-group">
      <h3 class="filter-title">Condition</h3>
      <ul class="filter-list">
        ${CONDITIONS.map(c => `
          <li>
            <label class="filter-checkbox">
              <input type="checkbox" data-filter="condition" value="${escapeAttr(c)}" />
              <span>${escapeHtml(c)}</span>
            </label>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="filter-group">
      <h3 class="filter-title">Discount</h3>
      <ul class="filter-list">
        ${DISCOUNT_THRESHOLDS.map(d => `
          <li>
            <label class="filter-checkbox">
              <input type="checkbox" data-filter="discount" value="${d}" />
              <span>${d}%+</span>
            </label>
          </li>
        `).join('')}
      </ul>
    </div>

    <button type="button" class="btn btn-ghost btn-block clear-filters-btn">Clear all filters</button>
  `;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;');
}

async function bootstrap() {
  initLayout();
  const grid = document.getElementById('product-grid');
  if (grid) showLoadingSkeleton(grid, 8);

  try {
    await initProductRepository();
    if (getLoadError()) {
      console.warn('Using local fallback data:', getLoadError().message);
    }
    renderFilterPanel();
    init();
    if (currentState.q || currentState.category) {
      requestAnimationFrame(() => {
        document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  } catch (err) {
    console.error('Catalogue bootstrap failed:', err);
    renderPageError(grid, err.message);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
