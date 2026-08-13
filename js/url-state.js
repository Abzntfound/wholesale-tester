/**
 * URL state management via URLSearchParams.
 * Syncs filters, search and sort with the browser URL without page reloads.
 */

const DEFAULTS = {
  q: '',
  category: '',
  subcategory: '',
  type: '',
  condition: '',
  min: '',
  max: '',
  discount: '',
  brand: '',
  sort: 'featured',
  page: '1'
};

export function readState() {
  const params = new URLSearchParams(window.location.search);
  const state = { ...DEFAULTS };

  Object.keys(DEFAULTS).forEach(key => {
    const val = params.get(key);
    if (val !== null && val !== '') state[key] = val;
  });

  return state;
}

export function writeState(state, replace = false) {
  const params = new URLSearchParams();

  Object.entries(state).forEach(([key, value]) => {
    if (value && value !== DEFAULTS[key]) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const newUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;

  if (replace) {
    window.history.replaceState(state, '', newUrl);
  } else {
    window.history.pushState(state, '', newUrl);
  }
}

export function updateState(partial, replace = false) {
  const current = readState();
  const next = { ...current, ...partial };

  // Reset page when filters change (unless page itself is being set)
  if (!('page' in partial)) {
    next.page = '1';
  }

  writeState(next, replace);
  return next;
}

export function buildQueryLink(query) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const qs = params.toString();
  return qs ? `/joblots?${qs}` : '/joblots';
}

export function onPopState(callback) {
  window.addEventListener('popstate', () => callback(readState()));
}

export function getActiveFilterCount(state) {
  let count = 0;
  if (state.category) count++;
  if (state.subcategory) count++;
  if (state.type) count++;
  if (state.condition) count++;
  if (state.min) count++;
  if (state.max) count++;
  if (state.discount) count++;
  if (state.brand) count++;
  return count;
}

export { DEFAULTS };
