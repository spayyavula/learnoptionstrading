/**
 * Simple JWT Authentication Service
 *
 * Handles user registration, login, and token management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  roles?: { key: string; name: string }[];
  subscription?: {
    plan: string;
    status: string;
    expiresAt: string | null;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface AuthError {
  error: string;
}

/**
 * Register a new user
 */
export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { user: null, error: data.error || 'Registration failed' };
    }

    const authData = data as AuthResponse;

    // Store tokens
    localStorage.setItem(ACCESS_TOKEN_KEY, authData.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);

    // Store user
    const user: User = {
      id: authData.user.id,
      email: authData.user.email,
      displayName: authData.user.displayName,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { user, error: null };
  } catch (error) {
    console.error('Registration error:', error);
    return { user: null, error: 'Network error. Please try again.' };
  }
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { user: null, error: data.error || 'Login failed' };
    }

    const authData = data as AuthResponse;

    // Store tokens
    localStorage.setItem(ACCESS_TOKEN_KEY, authData.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);

    // Store user
    const user: User = {
      id: authData.user.id,
      email: authData.user.email,
      displayName: authData.user.displayName,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { user, error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { user: null, error: 'Network error. Please try again.' };
  }
}

/**
 * Logout the current user
 */
export function logout(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Get the current user from storage
 */
export function getCurrentUser(): User | null {
  try {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

/**
 * Get the access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get the refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;

  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() < exp;
  } catch {
    return false;
  }
}

/**
 * Refresh the access token
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      logout();
      return false;
    }

    const data = await response.json() as AuthResponse;

    // Update tokens
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);

    // Update user
    const user: User = {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return true;
  } catch {
    logout();
    return false;
  }
}

/**
 * Fetch current user details from API
 */
export async function fetchCurrentUser(): Promise<User | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return fetchCurrentUser();
        }
        logout();
      }
      return null;
    }

    const user = await response.json() as User;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}

/**
 * Make authenticated API request
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getAccessToken();

  // Check if token needs refresh
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      // Refresh if token expires in less than 5 minutes
      if (Date.now() > exp - 5 * 60 * 1000) {
        await refreshAccessToken();
        token = getAccessToken();
      }
    } catch {
      // Invalid token, try to refresh
      await refreshAccessToken();
      token = getAccessToken();
    }
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// Auth state change callback
type AuthCallback = (user: User | null) => void;
const authCallbacks: Set<AuthCallback> = new Set();

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: AuthCallback): () => void {
  authCallbacks.add(callback);

  // Call immediately with current state
  callback(getCurrentUser());

  return () => {
    authCallbacks.delete(callback);
  };
}

/**
 * Notify all listeners of auth state change
 */
export function notifyAuthChange(): void {
  const user = getCurrentUser();
  authCallbacks.forEach((callback) => callback(user));
}
