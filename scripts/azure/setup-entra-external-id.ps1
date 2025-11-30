# ============================================================================
# Microsoft Entra External ID Setup Script
# ============================================================================
# This script sets up Microsoft Entra External ID for Options Academy
#
# Prerequisites:
# - Azure CLI installed and logged in (az login)
# - Appropriate permissions to create tenants and app registrations
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("staging", "prod")]
    [string]$Environment = "staging",

    [Parameter(Mandatory=$false)]
    [string]$TenantDisplayName = "Options Academy",

    [Parameter(Mandatory=$false)]
    [string]$AppDisplayName = "Options Academy Web App"
)

$ErrorActionPreference = "Stop"

# Configuration based on environment
$tenantDomainPrefix = if ($Environment -eq "prod") { "optionsacademyprod" } else { "optionsacademystaging" }
$redirectUris = if ($Environment -eq "prod") {
    @(
        "https://thankful-mushroom-07d18b80f.3.azurestaticapps.net",
        "https://thankful-mushroom-07d18b80f.3.azurestaticapps.net/auth/callback",
        "https://optionsacademy.ai",
        "https://optionsacademy.ai/auth/callback",
        "https://www.optionsacademy.ai",
        "https://www.optionsacademy.ai/auth/callback"
    )
} else {
    @(
        "https://nice-stone-06de44d0f.3.azurestaticapps.net",
        "https://nice-stone-06de44d0f.3.azurestaticapps.net/auth/callback",
        "http://localhost:5173",
        "http://localhost:5173/auth/callback"
    )
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Microsoft Entra External ID Setup" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Check Azure CLI login
Write-Host "`n[1/5] Checking Azure CLI authentication..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Please login to Azure first..." -ForegroundColor Red
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green

# Get current subscription
$subscriptionId = $account.id
Write-Host "Subscription: $($account.name) ($subscriptionId)" -ForegroundColor Green

# ============================================================================
# Step 2: Check if we can use existing tenant or need to create new one
# ============================================================================
Write-Host "`n[2/5] Checking for existing Entra tenant..." -ForegroundColor Yellow

# For External ID, we typically use the existing tenant and create an app registration
# with the appropriate configuration for external users

$currentTenant = az account show --query tenantId -o tsv
Write-Host "Current Tenant ID: $currentTenant" -ForegroundColor Green

# ============================================================================
# Step 3: Create App Registration for External Users
# ============================================================================
Write-Host "`n[3/5] Creating App Registration..." -ForegroundColor Yellow

$appName = "$AppDisplayName ($Environment)"

# Check if app already exists
$existingApp = az ad app list --display-name $appName --query "[0].appId" -o tsv 2>$null

if ($existingApp) {
    Write-Host "App registration already exists: $existingApp" -ForegroundColor Yellow
    $appId = $existingApp
} else {
    # Create the app registration
    Write-Host "Creating new app registration: $appName" -ForegroundColor Yellow

    # Build redirect URIs JSON
    $redirectUrisJson = $redirectUris | ConvertTo-Json -Compress

    # Create app with SPA configuration
    $appResult = az ad app create `
        --display-name $appName `
        --sign-in-audience "AzureADandPersonalMicrosoftAccount" `
        --enable-id-token-issuance true `
        --enable-access-token-issuance true `
        --web-redirect-uris $redirectUris `
        --query "{appId: appId, id: id}" `
        -o json | ConvertFrom-Json

    $appId = $appResult.appId
    $objectId = $appResult.id

    Write-Host "App registration created!" -ForegroundColor Green
    Write-Host "  App (Client) ID: $appId" -ForegroundColor Cyan
    Write-Host "  Object ID: $objectId" -ForegroundColor Cyan
}

# ============================================================================
# Step 4: Configure SPA Platform
# ============================================================================
Write-Host "`n[4/5] Configuring SPA platform..." -ForegroundColor Yellow

# Get the app object ID
$objectId = az ad app show --id $appId --query id -o tsv

# Update to add SPA platform (in addition to web)
# Using REST API for more control
$spaConfig = @{
    spa = @{
        redirectUris = $redirectUris
    }
} | ConvertTo-Json -Depth 3

az rest --method PATCH `
    --uri "https://graph.microsoft.com/v1.0/applications/$objectId" `
    --headers "Content-Type=application/json" `
    --body $spaConfig 2>$null

Write-Host "SPA platform configured with redirect URIs" -ForegroundColor Green

# ============================================================================
# Step 5: Create Service Principal (if not exists)
# ============================================================================
Write-Host "`n[5/5] Creating Service Principal..." -ForegroundColor Yellow

$existingSp = az ad sp show --id $appId 2>$null
if (-not $existingSp) {
    az ad sp create --id $appId | Out-Null
    Write-Host "Service Principal created" -ForegroundColor Green
} else {
    Write-Host "Service Principal already exists" -ForegroundColor Yellow
}

# ============================================================================
# Output Configuration
# ============================================================================
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host "`nAdd these to your .env file:" -ForegroundColor Cyan
Write-Host "--------------------------------------------" -ForegroundColor Gray
Write-Host "VITE_AZURE_CLIENT_ID=$appId"
Write-Host "VITE_AZURE_TENANT_ID=$currentTenant"
Write-Host "VITE_AZURE_TENANT_NAME=$tenantDomainPrefix"
Write-Host "--------------------------------------------" -ForegroundColor Gray

Write-Host "`nRedirect URIs configured:" -ForegroundColor Cyan
foreach ($uri in $redirectUris) {
    Write-Host "  - $uri" -ForegroundColor Gray
}

# Save to a file for easy reference
$configFile = ".\azure-auth-config-$Environment.txt"
@"
# Microsoft Entra External ID Configuration
# Environment: $Environment
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

VITE_AZURE_CLIENT_ID=$appId
VITE_AZURE_TENANT_ID=$currentTenant
VITE_AZURE_TENANT_NAME=$tenantDomainPrefix

# App Registration Details
App Name: $appName
Object ID: $objectId
Sign-in Audience: AzureADandPersonalMicrosoftAccount

# Redirect URIs
$($redirectUris -join "`n")
"@ | Out-File $configFile -Encoding UTF8

Write-Host "`nConfiguration saved to: $configFile" -ForegroundColor Green

Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "IMPORTANT: Manual Steps Required" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host @"

1. Go to Azure Portal > Microsoft Entra ID > App registrations
2. Find '$appName'
3. Go to 'Authentication' and verify:
   - SPA redirect URIs are set correctly
   - 'ID tokens' and 'Access tokens' are enabled

4. Go to 'API permissions' and add:
   - Microsoft Graph > User.Read (delegated)

5. If you need external user sign-up, go to:
   - Microsoft Entra ID > External Identities > External collaboration settings
   - Enable 'Guest user access' and 'Guest self-service sign up'

"@ -ForegroundColor Gray
