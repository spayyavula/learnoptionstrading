/**
 * Microsoft Entra External ID (CIAM) Authentication Module
 *
 * This module provides authentication using Microsoft Authentication Library (MSAL)
 * for Microsoft Entra External ID (Consumer Identity and Access Management).
 */

import {
  PublicClientApplication,
  Configuration,
  AccountInfo,
  InteractionRequiredAuthError,
  RedirectRequest,
  PopupRequest,
  BrowserCacheLocation,
} from '@azure/msal-browser';

// Configuration from environment variables
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID || '';
const tenantSubdomain = import.meta.env.VITE_AZURE_TENANT_SUBDOMAIN || '';

// Validate configuration
export const isValidConfig = Boolean(
  clientId &&
    clientId !== 'your-client-id' &&
    tenantId &&
    tenantId !== 'your-tenant-id'
);

// Entra External ID Authority URL
// Format: https://{tenant-subdomain}.ciamlogin.com/{tenant-id}
// If no subdomain is provided, fall back to standard Entra ID
const authority = tenantSubdomain
  ? `https://${tenantSubdomain}.ciamlogin.com/${tenantId}`
  : `https://login.microsoftonline.com/${tenantId}`;

// Known authorities for CIAM
const knownAuthorities = tenantSubdomain ? [`${tenantSubdomain}.ciamlogin.com`] : [];

// MSAL Configuration
const msalConfig: Configuration = {
  auth: {
    clientId,
    authority,
    knownAuthorities,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (import.meta.env.DEV) {
          console.log(`[MSAL CIAM] ${message}`);
        }
      },
    },
  },
};

// Create MSAL instance
let msalInstance: PublicClientApplication | null = null;

function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}

// Initialize MSAL
let msalInitialized = false;
let initializationPromise: Promise<void> | null = null;

export async function initializeMsal(): Promise<void> {
  if (msalInitialized) return;

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const instance = getMsalInstance();
      await instance.initialize();
      msalInitialized = true;

      // Handle redirect response
      const response = await instance.handleRedirectPromise();
      if (response) {
        console.log('🔐 Login redirect completed');
        notifyAuthChange();
      }
    } catch (error) {
      console.error('🔐 MSAL initialization failed:', error);
      throw error;
    }
  })();

  return initializationPromise;
}

// Login scopes
const loginRequest: PopupRequest | RedirectRequest = {
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

/**
 * User interface matching our app's user structure
 */
export interface AzureUser {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  user_metadata?: {
    full_name?: string;
  };
}

/**
 * Get all logged in accounts
 */
export function getAllAccounts(): AccountInfo[] {
  try {
    const instance = getMsalInstance();
    return instance.getAllAccounts();
  } catch {
    return [];
  }
}

/**
 * Get the current active account
 */
export function getActiveAccount(): AccountInfo | null {
  const accounts = getAllAccounts();
  if (accounts.length === 0) return null;
  return accounts[0];
}

/**
 * Convert MSAL account to our user format
 */
function accountToUser(account: AccountInfo): AzureUser {
  const claims = account.idTokenClaims as Record<string, any> || {};

  const email = claims?.emails?.[0] || claims?.email || claims?.preferred_username || account.username || '';
  const displayName = claims?.name || account.name || email.split('@')[0] || 'User';
  const firstName = claims?.given_name;
  const lastName = claims?.family_name;

  return {
    id: account.localAccountId || account.homeAccountId,
    email,
    displayName,
    firstName,
    lastName,
    user_metadata: {
      full_name: displayName,
    },
  };
}

/**
 * Sign in using popup
 */
export async function signIn(): Promise<{ user: AzureUser | null; error: Error | null }> {
  if (!isValidConfig) {
    return {
      user: null,
      error: new Error('Microsoft Entra External ID is not configured. Please check environment variables.'),
    };
  }

  try {
    await initializeMsal();
    const instance = getMsalInstance();

    // Use popup for better UX
    const response = await instance.loginPopup(loginRequest);

    if (response && response.account) {
      const user = accountToUser(response.account);
      notifyAuthChange();
      return { user, error: null };
    }

    return { user: null, error: new Error('No account returned from login') };
  } catch (error: any) {
    console.error('🔐 Sign in failed:', error);

    // User cancelled
    if (error.errorCode === 'user_cancelled' || error.name === 'BrowserAuthError') {
      return { user: null, error: new Error('Sign in was cancelled') };
    }

    return {
      user: null,
      error: new Error(error.message || 'Sign in failed. Please try again.')
    };
  }
}

/**
 * Sign in with redirect (alternative to popup)
 */
export async function signInRedirect(): Promise<void> {
  if (!isValidConfig) {
    console.warn('🔐 Microsoft Entra External ID is not configured');
    return;
  }

  await initializeMsal();
  const instance = getMsalInstance();
  await instance.loginRedirect(loginRequest);
}

/**
 * Sign up - Entra External ID handles this on the same flow
 */
export async function signUp(): Promise<{ user: AzureUser | null; error: Error | null }> {
  // Entra External ID sign-up is handled by the same login flow
  return signIn();
}

/**
 * Handle password reset flow
 * Note: Entra External ID handles this through the login flow with SSPR enabled
 */
export async function resetPassword(): Promise<{ user: AzureUser | null; error: Error | null }> {
  if (!isValidConfig) {
    return {
      user: null,
      error: new Error('Microsoft Entra External ID is not configured'),
    };
  }

  try {
    await initializeMsal();
    const instance = getMsalInstance();

    // For Entra External ID, password reset is handled through the same authority
    // Users click "Forgot password" on the Microsoft login page
    await instance.loginRedirect({
      ...loginRequest,
      prompt: 'login',
    });

    return { user: null, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: new Error(error.message || 'Password reset failed')
    };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ error: Error | null }> {
  if (!isValidConfig) {
    return { error: null };
  }

  try {
    await initializeMsal();
    const instance = getMsalInstance();
    const account = getActiveAccount();

    if (account) {
      await instance.logoutPopup({
        account,
        postLogoutRedirectUri: window.location.origin,
      });
    }

    notifyAuthChange();
    return { error: null };
  } catch (error: any) {
    return { error: new Error(error.message || 'Sign out failed') };
  }
}

/**
 * Get access token for API calls
 */
export async function getAccessToken(): Promise<string | null> {
  if (!isValidConfig) return null;

  const account = getActiveAccount();
  if (!account) return null;

  try {
    await initializeMsal();
    const instance = getMsalInstance();

    const response = await instance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      try {
        const instance = getMsalInstance();
        const response = await instance.acquireTokenPopup(loginRequest);
        return response.accessToken;
      } catch (popupError) {
        console.error('🔐 Failed to acquire token:', popupError);
        return null;
      }
    }
    console.error('🔐 Failed to get access token:', error);
    return null;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): AzureUser | null {
  if (!isValidConfig) return null;

  const account = getActiveAccount();
  if (!account) return null;

  return accountToUser(account);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (!isValidConfig) return false;
  return getAllAccounts().length > 0;
}

/**
 * Auth state change callback type
 */
type AuthCallback = (user: AzureUser | null) => void;

const authCallbacks: Set<AuthCallback> = new Set();

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: AuthCallback): () => void {
  authCallbacks.add(callback);

  // Call immediately with current state (after MSAL is initialized)
  initializeMsal().then(() => {
    const user = getCurrentUser();
    callback(user);
  }).catch(() => {
    callback(null);
  });

  // Return unsubscribe function
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

// Export MSAL instance for advanced use cases
export { getMsalInstance as msalInstance };
