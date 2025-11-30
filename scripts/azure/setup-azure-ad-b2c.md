# Azure AD B2C Setup Guide

This guide walks through setting up Azure AD B2C for Options Academy authentication.

## Prerequisites

- Azure subscription with Owner or Contributor access
- Custom domain (optionsacademy.ai) for production

---

## Step 1: Create Azure AD B2C Tenant

### Via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Azure AD B2C" in the top search bar
3. Click **Create a resource** > **Azure Active Directory B2C**
4. Select **Create a new Azure AD B2C Tenant**

### Tenant Configuration

**For Staging:**
- Organization name: `Options Academy Staging`
- Initial domain name: `optionsacademystaging`
- Country/Region: `United States`
- Subscription: Your Azure subscription
- Resource group: `optionsacademy-staging-rg`

**For Production:**
- Organization name: `Options Academy`
- Initial domain name: `optionsacademyprod`
- Country/Region: `United States`
- Subscription: Your Azure subscription
- Resource group: `optionsacademy-prod-rg`

---

## Step 2: Register Application

1. Switch to your new B2C tenant (click your profile > Switch directory)
2. Go to **Azure AD B2C** > **App registrations** > **New registration**

### Application Settings

| Field | Staging Value | Production Value |
|-------|---------------|------------------|
| Name | `optionsacademy-staging-app` | `optionsacademy-prod-app` |
| Supported account types | Accounts in any identity provider or organizational directory |
| Redirect URI (SPA) | `https://optionsacademy-staging-web.azurestaticapps.net` | `https://optionsacademy.ai` |

### Additional Redirect URIs

Add these redirect URIs after creation:

**Staging:**
```
https://optionsacademy-staging-web.azurestaticapps.net
https://optionsacademy-staging-web.azurestaticapps.net/auth/callback
http://localhost:5173
http://localhost:5173/auth/callback
```

**Production:**
```
https://optionsacademy.ai
https://optionsacademy.ai/auth/callback
https://www.optionsacademy.ai
https://www.optionsacademy.ai/auth/callback
```

---

## Step 3: Configure Authentication

1. Go to **Authentication** in your app registration
2. Under **Implicit grant and hybrid flows**, enable:
   - [x] Access tokens
   - [x] ID tokens
3. Under **Advanced settings**:
   - Allow public client flows: **No**

---

## Step 4: Create User Flows

Go to **Azure AD B2C** > **User flows** > **New user flow**

### 4.1 Sign Up and Sign In Flow

1. Select **Sign up and sign in** > **Recommended**
2. Name: `B2C_1_signupsignin`
3. Identity providers: **Email signup**
4. Multifactor authentication:
   - Staging: **Disabled** (for easier testing)
   - Production: **Email** (recommended)
5. User attributes to collect:
   - [x] Email Address
   - [x] Display Name
   - [x] Given Name
   - [x] Surname
6. Application claims to return:
   - [x] Email Addresses
   - [x] Display Name
   - [x] Given Name
   - [x] Surname
   - [x] Identity Provider
   - [x] User's Object ID

### 4.2 Password Reset Flow

1. Select **Password reset** > **Recommended**
2. Name: `B2C_1_passwordreset`
3. Identity providers: **Reset password using email address**

### 4.3 Profile Editing Flow (Optional)

1. Select **Profile editing** > **Recommended**
2. Name: `B2C_1_profileedit`
3. User attributes to collect/return:
   - [x] Display Name
   - [x] Given Name
   - [x] Surname

---

## Step 5: Customize Branding (Optional but Recommended)

1. Go to **Azure AD B2C** > **Company branding** > **Configure**
2. Upload:
   - Banner logo (280x60 px)
   - Square logo (240x240 px)
   - Background image (1920x1080 px)
3. Set colors:
   - Primary: `#2563EB` (blue-600)
   - Background: `#F8FAFC` (slate-50)

---

## Step 6: Get Configuration Values

After setup, collect these values for your application:

### From App Registration

1. Go to **App registrations** > Your app
2. Copy:
   - **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### From B2C Tenant

1. Go to **Azure AD B2C** > **Overview**
2. Copy:
   - **Tenant name**: `optionsacademystaging.onmicrosoft.com`
   - **Tenant ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### User Flow Endpoints

The authority URL format:
```
https://{tenant-name}.b2clogin.com/{tenant-name}.onmicrosoft.com/{policy-name}
```

**Examples:**

Staging Sign In:
```
https://optionsacademystaging.b2clogin.com/optionsacademystaging.onmicrosoft.com/B2C_1_signupsignin
```

Production Sign In:
```
https://optionsacademyprod.b2clogin.com/optionsacademyprod.onmicrosoft.com/B2C_1_signupsignin
```

---

## Step 7: Environment Variables

Update your `.env` files:

### Staging (.env.staging)

```env
VITE_AZURE_CLIENT_ID=your-staging-client-id
VITE_AZURE_B2C_TENANT=optionsacademystaging
VITE_AZURE_B2C_POLICY_SIGNIN=B2C_1_signupsignin
VITE_AZURE_B2C_POLICY_RESET=B2C_1_passwordreset
VITE_API_BASE_URL=https://optionsacademy-staging-api.azurewebsites.net/api
```

### Production (.env.production)

```env
VITE_AZURE_CLIENT_ID=your-prod-client-id
VITE_AZURE_B2C_TENANT=optionsacademyprod
VITE_AZURE_B2C_POLICY_SIGNIN=B2C_1_signupsignin
VITE_AZURE_B2C_POLICY_RESET=B2C_1_passwordreset
VITE_API_BASE_URL=https://optionsacademy-prod-api.azurewebsites.net/api
```

---

## Step 8: Token Configuration

To include custom claims in the token:

1. Go to **App registrations** > Your app > **Token configuration**
2. Add optional claims:
   - **ID Token**: email, given_name, family_name
   - **Access Token**: email

---

## Step 9: API Permissions (For Azure Functions)

If your Azure Functions need to validate tokens:

1. Go to **App registrations** > Your app > **Expose an API**
2. Set Application ID URI: `api://optionsacademy-{environment}`
3. Add a scope:
   - Scope name: `access_as_user`
   - Admin consent display name: `Access Options Academy API`
   - Admin consent description: `Allows the app to access the Options Academy API on behalf of the signed-in user`

---

## Verification Checklist

- [ ] B2C tenant created
- [ ] Application registered with correct redirect URIs
- [ ] Sign up/sign in user flow created and tested
- [ ] Password reset flow created and tested
- [ ] Collected Client ID and Tenant name
- [ ] Environment variables configured
- [ ] Test login works from localhost

---

## Troubleshooting

### "AADB2C90068: The provided application with ID 'xxx' is not valid"
- Verify the Client ID in your .env matches the App Registration
- Check that redirect URIs are exactly correct (no trailing slashes)

### "AADB2C90117: The redirect_uri 'xxx' is not registered"
- Add the exact URL (including protocol) to your App Registration's redirect URIs

### Token validation fails in Azure Functions
- Ensure the issuer matches: `https://{tenant}.b2clogin.com/{tenant-id}/v2.0/`
- Verify the audience matches your Client ID

---

## User Migration Note

Since we chose **Force Password Reset**, after B2C setup:

1. Export user emails from Supabase:
   ```sql
   SELECT email FROM auth.users WHERE email_confirmed_at IS NOT NULL;
   ```

2. For each user, trigger password reset flow or send welcome email with reset link

3. Users will set new passwords on first login to Azure AD B2C
