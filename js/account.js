/**
 * Account UI — Supabase Auth via accountRepository.
 */
export {
  isLoggedIn,
  getSession,
  signIn,
  register,
  signOut,
  requestPasswordReset,
  updateProfile,
  requireAuth,
  getAuthModeLabel,
  isAuthConfigured,
  bindAuthListener
} from '../repositories/accountRepository.js';

import { syncAfterLogin as syncBasket } from './cart.js';
import { syncAfterLogin as syncWishlist } from './wishlist.js';
import { bindAuthListener } from '../repositories/accountRepository.js';

bindAuthListener(async (session) => {
  if (session) {
    await syncBasket();
    await syncWishlist();
  }
});

/** Demo orders shown when Supabase orders are unavailable */
export function getDemoOrders() {
  return [
    { id: 'WC-10482', date: '2026-07-18', status: 'Delivered', total: 299.00, items: 2 },
    { id: 'WC-10301', date: '2026-06-02', status: 'Delivered', total: 149.00, items: 1 }
  ];
}
