/**
 * Microsoft Entra External ID Authentication Module
 *
 * This module provides authentication using Microsoft Authentication Library (MSAL)
 * for Microsoft Entra External ID (formerly Azure AD B2C).
 */

import {
  PublicClientApplication,
  Configuration,
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
  SilentRequest,
  RedirectRequest,
  PopupRequest,
} from '@azure/msal-browser';

// Configuration from environment variables
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID || '';
const tenantName = import.meta.env.VITE_AZURE_TENANT_NAME || '';

// Validate configuration
export const isValidConfig = Boolean(
  clientId &&
    clientId !== 'your-client-id' &&
    tenantId &&
    tenantId !== 'your-tenant-id'
);

// Authority URL for Entra External ID
// Format: https://{tenant-name}.ciamlogin.com/{tenant-id}
const authority = tenantName
  ? `https://${tenantName}.ciamlogin.com/${tenantId}`
  : `https://login.microsoftonline.com/${tenantId}`;

// MSAL Configuration
const msalConfig: Configuration = {
  auth: {
    clientId,
    authority,
    knownAuthorities: tenantName ? [`${tenantName}.ciamlogin.com`] : [],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (import.meta.env.DEV) {
          console.log(`[MSAL] ${message}`);
        }
      },
    },
  },
};

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
let msalInitialized = false;

export async function initializeMsal(): Promise<void> {
  if (msalInitialized) return;

  try {
    await msalInstance.initialize();
    msalInitialized = true;

    // Handle redirect response
    const response = await msalInstance.handleRedirectPromise();
    if (response) {
      console.log('Login redirect completed');
    }
  } catch (error) {
    console.error('MSAL initialization failed:', error);
  }
}

// Login scopes
const loginRequest: PopupRequest | RedirectRequest = {
  scopes: ['openid', 'profile', 'email'],
};

// API scopes (if using custom API)
const apiRequest: SilentRequest = {
  scopes: [`https://${tenantName}.onmicrosoft.com/api/access_as_user`],
  account: undefined as any,
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
}

/**
 * Get all logged in accounts
 */
export function getAllAccounts(): AccountInfo[] {
  return msalInstance.getAllAccounts();
}

/**
 * Get the current active account
 */
export function getActiveAccount(): AccountInfo | null {
  const accounts = getAllAccounts();
  if (accounts.length === 0) return null;

  // Return first account (or implement account selection logic)
  return accounts[0];
}

/**
 * Convert MSAL account to our user format
 */
function accountToUser(account: AccountInfo): AzureUser {
  const claims = account.idTokenClaims as any;

  return {
    id: account.localAccountId || account.homeAccountId,
    email: claims?.emails?.[0] || claims?.email || account.username,
    displayName: claims?.name || account.name || 'User',
    firstName: claims?.given_name,
    lastName: claims?.family_name,
  };
}

/**
 * Sign in with popup
 */
export async function signInPopup(): Promise<{ user: AzureUser | null; error: Error | null }> {
  if (!isValidConfig) {
    return {
      user: null,
      error: new Error('Azure AD B2C is not configured. Running in demo mode.'),
    };
  }

  try {
    await initializeMsal();
    const response = await msalInstance.loginPopup(loginRequest);
    const user = accountToUser(response.account!);
    return { user, error: null };
  } catch (error: any) {
    console.error('Sign in failed:', error);

    // Check if user forgot password
    if (error.errorMessage?.includes('AADB2C90118')) {
      // User clicked forgot password, redirect to reset flow
      return signInWithPasswordReset();
    }

    return { user: null, error };
  }
}

/**
 * Sign in with redirect (for mobile/Safari)
 */
export async function signInRedirect(): Promise<void> {
  if (!isValidConfig) {
    console.warn('Azure AD B2C is not configured');
    return;
  }

  await initializeMsal();
  await msalInstance.loginRedirect(loginRequest);
}

/**
 * Handle password reset flow
 * For Entra External ID, this redirects to the self-service password reset
 */
export async function signInWithPasswordReset(): Promise<{ user: AzureUser | null; error: Error | null }> {
  try {
    await initializeMsal();
    // Entra External ID handles password reset through the same authority
    // with a different prompt
    await msalInstance.loginRedirect({
      ...loginRequest,
      prompt: 'login', // Force re-authentication
    });
    return { user: null, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  if (!isValidConfig) return;

  await initializeMsal();
  const account = getActiveAccount();

  if (account) {
    await msalInstance.logoutPopup({
      account,
      postLogoutRedirectUri: window.location.origin,
    });
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
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Token expired or requires interaction
      try {
        const response = await msalInstance.acquireTokenPopup(loginRequest);
        return response.accessToken;
      } catch (popupError) {
        console.error('Failed to acquire token:', popupError);
        return null;
      }
    }
    console.error('Failed to get access token:', error);
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

const authCallbacks: AuthCallback[] = [];

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: AuthCallback): () => void {
  authCallbacks.push(callback);

  // Call immediately with current state
  const user = getCurrentUser();
  callback(user);

  // Return unsubscribe function
  return () => {
    const index = authCallbacks.indexOf(callback);
    if (index > -1) {
      authCallbacks.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners of auth state change
 */
export function notifyAuthChange(): void {
  const user = getCurrentUser();
  authCallbacks.forEach((callback) => callback(user));
}
