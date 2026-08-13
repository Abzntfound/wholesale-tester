/**
 * Account UI — front-end prototype only. NOT secure authentication.
 * Connect repositories/accountRepository.js to a real backend when ready.
 */
const SESSION_KEY = 'wcuk_session';
const USERS_KEY = 'wcuk_users';

export function isLoggedIn() {
  return !!localStorage.getItem(SESSION_KEY);
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function signIn(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password');
  const session = { email: user.email, name: user.name, signedInAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function register({ name, email, password }) {
  const users = getUsers();
  if (users.find(u => u.email === email)) throw new Error('An account with this email already exists');
  users.push({ name, email, password, createdAt: Date.now() });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return signIn(email, password);
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function requestPasswordReset(email) {
  const users = getUsers();
  if (!users.find(u => u.email === email)) throw new Error('No account found with that email');
  return { message: 'If an account exists, reset instructions would be sent. (Prototype — no email sent.)' };
}

export function getDemoOrders() {
  return [
    { id: 'WC-10482', date: '2026-07-18', status: 'Delivered', total: 299.00, items: 2 },
    { id: 'WC-10301', date: '2026-06-02', status: 'Delivered', total: 149.00, items: 1 }
  ];
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}

export function requireAuth(redirectTo = 'account/sign-in.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectTo + '?return=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}
