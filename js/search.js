/**
 * Search UI – suggestions dropdown and search handling.
 */
import { getSearchSuggestions } from '../repositories/searchRepository.js';

let debounceTimer = null;

export function initSearch(options) {
  const {
    input,
    suggestionsEl,
    onSearch,
    onSuggestionSelect
  } = options;

  if (!input) return;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderSuggestions(input.value, suggestionsEl, onSuggestionSelect);
    }, 180);
  });

  input.addEventListener('focus', () => {
    renderSuggestions(input.value, suggestionsEl, onSuggestionSelect);
    suggestionsEl?.classList.add('is-open');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      suggestionsEl?.classList.remove('is-open');
      onSearch(input.value.trim());
    }
    if (e.key === 'Escape') {
      suggestionsEl?.classList.remove('is-open');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      suggestionsEl?.classList.remove('is-open');
    }
  });
}

function renderSuggestions(query, container, onSelect) {
  if (!container) return;

  const suggestions = getSearchSuggestions(query, 8);

  if (!suggestions.length) {
    container.innerHTML = '<div class="search-suggestion empty">No suggestions found</div>';
    container.classList.add('is-open');
    return;
  }

  const heading = !query.trim()
    ? '<div class="search-suggestion-heading">Popular searches</div>'
    : '';

  container.innerHTML = heading + suggestions.map((s, i) => {
    const icon = s.type === 'product' ? '🔍' : s.type === 'category' ? '📁' : s.type === 'brand' ? '🏷️' : '⭐';
    return `
      <button type="button" class="search-suggestion" data-index="${i}" role="option">
        <span class="suggestion-icon" aria-hidden="true">${icon}</span>
        <span class="suggestion-text">${escapeHtml(s.text)}</span>
        ${s.type !== 'popular' ? `<span class="suggestion-type">${s.type}</span>` : ''}
      </button>
    `;
  }).join('');

  container.classList.add('is-open');

  container.querySelectorAll('.search-suggestion[data-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const suggestion = suggestions[idx];
      container.classList.remove('is-open');
      onSelect(suggestion);
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function bindSearchForms(onSearch) {
  document.querySelectorAll('[data-search-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="search"], input[name="q"]');
      if (input) onSearch(input.value.trim());
    });
  });
}
