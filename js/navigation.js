/**
 * Cross-page navigation helpers — search redirect, link fixes.
 */
export function initGlobalSearch() {
  document.querySelectorAll('[data-search-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('[name="q"], [data-search-input]');
      const q = input?.value?.trim() || '';
      window.location.href = q ? `joblots.html?q=${encodeURIComponent(q)}` : 'joblots.html';
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGlobalSearch);
} else {
  initGlobalSearch();
}
