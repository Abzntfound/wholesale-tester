/**
 * Pagination – load-more without full page refresh.
 */
export const PER_PAGE = 24;

export function createPaginationController(options) {
  const { onLoad, perPage = PER_PAGE } = options;
  let currentPage = 1;

  return {
    reset() {
      currentPage = 1;
    },

    getPage() {
      return currentPage;
    },

    setPage(page) {
      currentPage = page;
    },

    loadMore() {
      currentPage += 1;
      onLoad(currentPage);
    },

    getPerPage() {
      return perPage;
    }
  };
}

export function renderPaginationBar(container, pagination, onLoadMore) {
  if (!container) return;

  const { total, showingFrom, showingTo, hasMore } = pagination;

  container.innerHTML = `
    <div class="pagination-bar">
      <p class="pagination-count" aria-live="polite">
        Showing <strong>${showingFrom.toLocaleString()}–${showingTo.toLocaleString()}</strong>
        of <strong>${total.toLocaleString()}</strong> lots
      </p>
      ${hasMore ? `
        <button type="button" class="btn btn-secondary btn-load-more" id="load-more-btn">
          Load More Lots
        </button>
      ` : `
        <p class="pagination-end">You've viewed all matching lots</p>
      `}
    </div>
  `;

  const btn = container.querySelector('#load-more-btn');
  if (btn) {
    btn.addEventListener('click', onLoadMore);
  }
}

export function showLoadingSkeleton(container, count = 8) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count }, () => `
    <article class="product-card skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-price"></div>
    </article>
  `).join('');
}
