/**
 * Checkout page logic.
 */
import { initProductRepository, getProductById, formatCurrency } from '../repositories/productRepository.js';
import { initLayout } from './layout.js';
import * as Cart from './cart.js';
import { createOrder, calculateTotals, DEFAULT_DELIVERY } from '../repositories/orderRepository.js';
import { createCheckoutSession, isPaymentConfigured } from './payment.js';
import { getSession, requireAuth } from './account.js';
import { clear as clearBasket } from './cart.js';

const DELIVERY_OPTIONS = [
  { id: 'standard', label: 'Standard UK delivery', price: 0 },
  { id: 'collection', label: 'Collection from Poole warehouse', price: 0 }
];

async function bootstrap() {
  initLayout();
  const main = document.getElementById('checkout-content');
  main.innerHTML = '<div class="loading-state">Loading checkout…</div>';

  await initProductRepository();
  const items = await Cart.getItems();

  if (!items.length) {
    main.innerHTML = `<div class="empty-state"><h1>Your basket is empty</h1><p>Add products before checkout.</p><a href="joblots.html" class="btn btn-primary">Browse stock</a></div>`;
    return;
  }

  const session = await getSession();
  const paymentReady = isPaymentConfigured();

  main.innerHTML = renderCheckoutForm(items, session, paymentReady);
  bindCheckoutForm(items, paymentReady);
}

function renderCheckoutForm(cartItems, session, paymentReady) {
  const rows = cartItems.map(item => {
    const p = getProductById(item.productId);
    if (!p) return '';
    const line = (p.price || 0) * (item.quantity || 1);
    return `<li class="checkout-line"><span>${escapeHtml(p.name)} × ${item.quantity || 1}</span><strong>${formatCurrency(line)}</strong></li>`;
  }).join('');

  const products = cartItems.map(i => getProductById(i.productId)).filter(Boolean);
  const subtotal = products.reduce((sum, p, idx) => sum + (p.price || 0) * (cartItems[idx].quantity || 1), 0);
  const totals = calculateTotals(subtotal, DEFAULT_DELIVERY);

  return `
    <h1>Checkout</h1>
    ${!session ? `<div class="checkout-notice" role="status"><p><a href="account/sign-in.html?return=checkout.html">Sign in</a> to save your order history, or continue as guest below.</p></div>` : ''}
    <form id="checkout-form" class="checkout-layout">
      <section class="checkout-panel" aria-labelledby="details-heading">
        <h2 id="details-heading">Customer details</h2>
        <div class="form-grid">
          <label>Full name <input type="text" name="fullName" required value="${escapeAttr(session?.name || '')}" autocomplete="name"></label>
          <label>Email <input type="email" name="email" required value="${escapeAttr(session?.email || '')}" autocomplete="email"></label>
          <label>Phone <input type="tel" name="phone" autocomplete="tel"></label>
        </div>
        <h2>Delivery address</h2>
        <div class="form-grid">
          <label class="full-width">Address line 1 <input type="text" name="line1" required autocomplete="address-line1"></label>
          <label class="full-width">Address line 2 <input type="text" name="line2" autocomplete="address-line2"></label>
          <label>Town / city <input type="text" name="city" required autocomplete="address-level2"></label>
          <label>County <input type="text" name="county" autocomplete="address-level1"></label>
          <label>Postcode <input type="text" name="postcode" required autocomplete="postal-code"></label>
        </div>
        <fieldset class="delivery-options">
          <legend>Delivery</legend>
          ${DELIVERY_OPTIONS.map(opt => `
            <label class="radio-option">
              <input type="radio" name="deliveryOption" value="${opt.id}" ${opt.id === 'standard' ? 'checked' : ''}>
              ${opt.label}${opt.price ? ` — ${formatCurrency(opt.price)}` : ' — Free'}
            </label>
          `).join('')}
        </fieldset>
      </section>
      <aside class="checkout-summary" aria-labelledby="summary-heading">
        <h2 id="summary-heading">Order summary</h2>
        <ul class="checkout-lines">${rows}</ul>
        <dl class="checkout-totals">
          <div><dt>Subtotal</dt><dd>${formatCurrency(totals.subtotal)}</dd></div>
          <div><dt>VAT (20%)</dt><dd>${formatCurrency(totals.vat)}</dd></div>
          <div><dt>Delivery</dt><dd>${formatCurrency(totals.delivery)}</dd></div>
          <div class="checkout-total-row"><dt>Total</dt><dd>${formatCurrency(totals.total)}</dd></div>
        </dl>
        <section class="payment-section" aria-labelledby="payment-heading">
          <h2 id="payment-heading">Payment</h2>
          ${paymentReady
            ? `<p class="payment-note">You will be redirected to our secure payment provider to complete your order. Card details are never stored on this website.</p>
               <button type="submit" class="btn btn-primary btn-lg btn-block">Pay securely</button>`
            : `<div class="payment-not-configured" role="status">
                 <p><strong>Payment integration not yet connected.</strong></p>
                 <p>Deploy the Supabase edge function and configure your payment provider secrets. See <code>supabase/README.md</code>.</p>
                 <button type="submit" class="btn btn-secondary btn-block" disabled>Payment unavailable</button>
               </div>`
          }
        </section>
        <a href="basket.html" class="btn btn-ghost btn-block">Back to basket</a>
      </aside>
    </form>
    <p id="checkout-error" class="auth-error" role="alert" hidden></p>`;
}

function bindCheckoutForm(cartItems, paymentReady) {
  const form = document.getElementById('checkout-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('checkout-error');
    errEl.hidden = true;

    if (!paymentReady) {
      errEl.hidden = false;
      errEl.textContent = 'Payment provider is not configured. Orders cannot be completed until integration is set up.';
      return;
    }

    const loggedIn = await requireAuth('account/sign-in.html');
    if (!loggedIn) return;

    const fd = new FormData(form);
    const shippingAddress = {
      fullName: fd.get('fullName'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      line1: fd.get('line1'),
      line2: fd.get('line2'),
      city: fd.get('city'),
      county: fd.get('county'),
      postcode: fd.get('postcode'),
      country: 'GB'
    };

    const orderItems = cartItems.map(item => {
      const p = getProductById(item.productId);
      return {
        productId: item.productId,
        productName: p?.name || item.productId,
        quantity: item.quantity || 1,
        unitPrice: p?.price || 0
      };
    }).filter(i => i.unitPrice > 0);

    try {
      const order = await createOrder({ items: orderItems, shippingAddress });
      const session = await createCheckoutSession({
        orderId: order.id,
        successUrl: `${window.location.origin}/account/orders.html?paid=${order.id}`,
        cancelUrl: `${window.location.origin}/checkout.html`
      });

      if (!session.configured) {
        errEl.hidden = false;
        errEl.textContent = session.message;
        return;
      }

      if (session.checkoutUrl) {
        await clearBasket();
        window.location.href = session.checkoutUrl;
      } else {
        errEl.hidden = false;
        errEl.textContent = 'Payment session could not be started. Check edge function logs.';
      }
    } catch (err) {
      errEl.hidden = false;
      errEl.textContent = err.message || 'Checkout failed. Please try again.';
    }
  });
}

function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
