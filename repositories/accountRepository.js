/**
 * Account repository — Supabase Auth with localStorage demo fallback.
 */
import { getSupabase, isSupabaseConfigured } from '../js/supabase-client.js';

const SESSION_KEY = 'wcuk_session';
const USERS_KEY = 'wcuk_users';

let authListenerBound = false;

function readLocalSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

function writeLocalSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  document.dispatchEvent(new CustomEvent('auth:changed', { detail: session }));
}

function getLocalUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
}

export function isAuthConfigured() {
  return isSupabaseConfigured();
}

export function bindAuthListener(onChange) {
  const supabase = getSupabase();
  if (!supabase || authListenerBound) return;
  authListenerBound = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    onChange?.(session);
    document.dispatchEvent(new CustomEvent('auth:changed', { detail: session }));
  });
}

export async function getSession() {
  const supabase = getSupabase();
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email
      };
    }
    return null;
  }
  return readLocalSession();
}

export async function isLoggedIn() {
  return !!(await getSession());
}

export async function signIn(email, password) {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.email
    };
  }

  const user = getLocalUsers().find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password');
  const session = { email: user.email, name: user.name, mode: 'local-demo' };
  writeLocalSession(session);
  return session;
}

export async function register({ name, email, password }) {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) throw new Error(error.message);
    if (!data.session) {
      return { message: 'Check your email to confirm your account.', user: data.user };
    }
    return {
      id: data.user.id,
      email: data.user.email,
      name
    };
  }

  const users = getLocalUsers();
  if (users.find(u => u.email === email)) throw new Error('An account with this email already exists');
  users.push({ name, email, password, createdAt: Date.now() });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return signIn(email, password);
}

export async function signOut() {
  const supabase = getSupabase();
  if (supabase) await supabase.auth.signOut();
  writeLocalSession(null);
}

export async function requestPasswordReset(email) {
  const supabase = getSupabase();
  if (supabase) {
    const redirectTo = `${window.location.origin}/account/forgot-password.html`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);
    return { message: 'If an account exists, password reset instructions have been sent.' };
  }

  if (!getLocalUsers().find(u => u.email === email)) {
    throw new Error('No account found with that email');
  }
  return { message: 'Demo mode — no email sent. Configure Supabase Auth for password reset.' };
}

export async function updateProfile({ fullName, phone }) {
  const supabase = getSupabase();
  const session = await getSession();
  if (!session?.id || !supabase) throw new Error('Sign in required');

  const { error } = await supabase.from('profiles').upsert({
    id: session.id,
    full_name: fullName,
    phone
  });
  if (error) throw new Error(error.message);

  await supabase.auth.updateUser({ data: { full_name: fullName } });
}

export async function requireAuth(redirectTo = 'account/sign-in.html') {
  if (!(await isLoggedIn())) {
    window.location.href = `${redirectTo}?return=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return false;
  }
  return true;
}

export function getAuthModeLabel() {
  return isSupabaseConfigured() ? 'Supabase Auth' : 'Local demo (not secure)';
}
