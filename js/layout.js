/**
 * Shared site layout — header, footer, badges.
 */
import * as Cart from './cart.js';
import * as Wishlist from './wishlist.js';

export function initLayout() {
  Cart.updateBadge();
  Wishlist.updateBadge();
  document.addEventListener('cart:updated', () => Cart.updateBadge());
  document.addEventListener('wishlist:updated', () => Wishlist.updateBadge());

  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  menuBtn?.addEventListener('click', () => {
    const open = mobileNav?.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
}

export function setPageLoading(isLoading) {
  document.body.classList.toggle('is-loading', isLoading);
}

export function renderPageError(container, message) {
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state empty-state--error" role="alert">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
      <h3>Unable to load products</h3>
      <p>${message}</p>
      <button type="button" class="btn btn-primary" onclick="location.reload()">Try again</button>
    </div>`;
}
