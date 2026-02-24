import { User } from '../types';

const TOKEN_COOKIE = 'auth_token';
const TOKEN_SESSION_KEY = 'auth_token';
const USER_SESSION_KEY = 'auth_user';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

let authToken: string | null = null;
let currentUser: User | null = null;

const setCookie = (name: string, value: string, maxAgeSeconds: number) => {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
};

const setSessionToken = (token: string | null) => {
  if (typeof sessionStorage === 'undefined') return;
  if (token) {
    sessionStorage.setItem(TOKEN_SESSION_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
  }
};

const setSessionUser = (user: User | null) => {
  if (typeof sessionStorage === 'undefined') return;
  if (user) {
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(USER_SESSION_KEY);
  }
};

const getSessionToken = (): string | null => {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_SESSION_KEY);
};

const getSessionUser = (): User | null => {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(USER_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    sessionStorage.removeItem(USER_SESSION_KEY);
    return null;
  }
};

export const authStore = {
  setAuth(token: string, user: User) {
    authToken = token;
    currentUser = user;
    setCookie(TOKEN_COOKIE, token, COOKIE_MAX_AGE_SECONDS);
    setSessionToken(token);
    setSessionUser(user);
  },
  setToken(token: string | null) {
    authToken = token;
    if (token) {
      setCookie(TOKEN_COOKIE, token, COOKIE_MAX_AGE_SECONDS);
      setSessionToken(token);
    } else {
      deleteCookie(TOKEN_COOKIE);
      setSessionToken(null);
      setSessionUser(null);
    }
  },
  setUser(user: User | null) {
    currentUser = user;
    setSessionUser(user);
  },
  getToken(): string | null {
    if (authToken) return authToken;
    const sessionToken = getSessionToken();
    if (sessionToken) {
      authToken = sessionToken;
      return authToken;
    }
    const cookieToken = getCookie(TOKEN_COOKIE);
    if (cookieToken) {
      authToken = cookieToken;
      setSessionToken(cookieToken);
    }
    return authToken;
  },
  getUser(): User | null {
    if (currentUser) return currentUser;
    const sessionUser = getSessionUser();
    if (sessionUser) {
      currentUser = sessionUser;
    }
    return currentUser;
  },
  clear() {
    authToken = null;
    currentUser = null;
    deleteCookie(TOKEN_COOKIE);
    setSessionToken(null);
    setSessionUser(null);
  }
};
