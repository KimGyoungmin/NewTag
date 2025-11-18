import type { AuthUser } from '../types';

type Listener = () => void;

let accessToken: string | null = null;
let currentUser: AuthUser | null = null;
const listeners = new Set<Listener>();

const notify = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-change'));
  }
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('[tokenManager] listener error', error);
    }
  });
};

export const tokenManager = {
  getAccessToken: () => accessToken,
  getCurrentUser: () => currentUser,
  setSession: (token: string | null, user?: AuthUser | null) => {
    accessToken = token;
    if (typeof user !== 'undefined') {
      currentUser = user;
    }
    notify();
  },
  clearSession: () => {
    accessToken = null;
    currentUser = null;
    notify();
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export type TokenManager = typeof tokenManager;
