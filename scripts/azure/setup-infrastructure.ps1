# Azure Infrastructure Setup Script for Options Academy
# Run this script with: .\setup-infrastructure.ps1 -Environment "staging" or "prod"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "prod")]
    [string]$Environment,

    [Parameter(Mandatory=$false)]
    [string]$Location,

    [Parameter(Mandatory=$false)]
    [string]$PostgresAdminPassword
)

# Set default location based on environment
if (-not $Location) {
    $Location = if ($Environment -eq "prod") { "westus2" } else { "eastus" }
}

# Configuration
$AppName = "optionsacademy"
$ResourceGroup = "$AppName-$Environment-rg"
$PostgresServer = "$AppName-$Environment-db"
$StaticWebApp = "$AppName-$Environment-web"
$FunctionApp = "$AppName-$Environment-api"
$KeyVault = "$AppName-$Environment-kv"
$StorageAccount = "${AppName}${Environment}stor"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Azure Infrastructure Setup" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Location: $Location" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if logged in to Azure
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Please login to Azure first..." -ForegroundColor Yellow
    az login
}

Write-Host "`nCurrent Azure Subscription: $($account.name)" -ForegroundColor Green

# Prompt for PostgreSQL admin password if not provided
if (-not $PostgresAdminPassword) {
    $securePassword = Read-Host "Enter PostgreSQL admin password" -AsSecureString
    $PostgresAdminPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    )
}

# Step 1: Create Resource Group
Write-Host "`n[1/7] Creating Resource Group: $ResourceGroup" -ForegroundColor Yellow
az group create `
    --name $ResourceGroup `
    --location $Location `
    --tags Environment=$Environment Project=$AppName

# Step 2: Create Azure Database for PostgreSQL Flexible Server
Write-Host "`n[2/7] Creating PostgreSQL Flexible Server: $PostgresServer" -ForegroundColor Yellow

# Production uses Burstable tier for cost efficiency (can upgrade to GeneralPurpose later)
$tier = "Burstable"
$sku = if ($Environment -eq "prod") { "Standard_B2s" } else { "Standard_B1ms" }
$storageSize = if ($Environment -eq "prod") { 64 } else { 32 }

az postgres flexible-server create `
    --resource-group $ResourceGroup `
    --name $PostgresServer `
    --location $Location `
    --admin-user optionsadmin `
    --admin-password $PostgresAdminPassword `
    --sku-name $sku `
    --tier $tier `
    --storage-size $storageSize `
    --version 15 `
    --high-availability Disabled `
    --tags Environment=$Environment Project=$AppName

# Configure firewall to allow Azure services
Write-Host "Configuring PostgreSQL firewall rules..." -ForegroundColor Yellow
az postgres flexible-server firewall-rule create `
    --resource-group $ResourceGroup `
    --name $PostgresServer `
    --rule-name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0

# Create the application database
Write-Host "Creating application database..." -ForegroundColor Yellow
az postgres flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $PostgresServer `
    --database-name optionsacademy

# Enable required extensions
Write-Host "Enabling PostgreSQL extensions..." -ForegroundColor Yellow
az postgres flexible-server parameter set `
    --resource-group $ResourceGroup `
    --server-name $PostgresServer `
    --name azure.extensions `
    --value "UUID-OSSP,PGCRYPTO"

# Step 3: Create Storage Account for Functions
Write-Host "`n[3/7] Creating Storage Account: $StorageAccount" -ForegroundColor Yellow
az storage account create `
    --name $StorageAccount `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku Standard_LRS `
    --kind StorageV2 `
    --tags Environment=$Environment Project=$AppName

# Step 4: Create Function App
Write-Host "`n[4/7] Creating Function App: $FunctionApp" -ForegroundColor Yellow

# Using Consumption plan (Y1) for cost efficiency - scales automatically
# Can upgrade to Premium (EP1) later for VNet integration and always-warm instances
az functionapp create `
    --resource-group $ResourceGroup `
    --name $FunctionApp `
    --storage-account $StorageAccount `
    --consumption-plan-location $Location `
    --runtime node `
    --runtime-version 20 `
    --functions-version 4 `
    --os-type Linux `
    --tags Environment=$Environment Project=$AppName

# Enable CORS for the function app
Write-Host "Configuring CORS for Function App..." -ForegroundColor Yellow
$corsOrigins = if ($Environment -eq "prod") {
    "https://optionsacademy.ai,https://www.optionsacademy.ai"
} else {
    "https://$StaticWebApp.azurestaticapps.net,http://localhost:5173"
}

az functionapp cors add `
    --resource-group $ResourceGroup `
    --name $FunctionApp `
    --allowed-origins $corsOrigins.Split(",")

# Step 5: Create Key Vault
Write-Host "`n[5/7] Creating Key Vault: $KeyVault" -ForegroundColor Yellow
az keyvault create `
    --name $KeyVault `
    --resource-group $ResourceGroup `
    --location $Location `
    --enable-rbac-authorization true `
    --tags Environment=$Environment Project=$AppName

# Grant Function App access to Key Vault
Write-Host "Configuring Key Vault access for Function App..." -ForegroundColor Yellow
$functionAppIdentity = az functionapp identity assign `
    --resource-group $ResourceGroup `
    --name $FunctionApp `
    --query principalId -o tsv

$keyVaultId = az keyvault show `
    --name $KeyVault `
    --resource-group $ResourceGroup `
    --query id -o tsv

az role assignment create `
    --role "Key Vault Secrets User" `
    --assignee $functionAppIdentity `
    --scope $keyVaultId

# Step 6: Create Static Web App
Write-Host "`n[6/7] Creating Static Web App: $StaticWebApp" -ForegroundColor Yellow

$webSku = if ($Environment -eq "prod") { "Standard" } else { "Free" }

az staticwebapp create `
    --name $StaticWebApp `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku $webSku `
    --tags Environment=$Environment Project=$AppName

# Step 7: Store secrets in Key Vault
Write-Host "`n[7/7] Storing initial secrets in Key Vault..." -ForegroundColor Yellow

# Get PostgreSQL connection string
$pgHost = az postgres flexible-server show `
    --resource-group $ResourceGroup `
    --name $PostgresServer `
    --query fullyQualifiedDomainName -o tsv

$connectionString = "postgresql://optionsadmin:$PostgresAdminPassword@${pgHost}:5432/optionsacademy?sslmode=require"

az keyvault secret set `
    --vault-name $KeyVault `
    --name "postgresql-connection-string" `
    --value $connectionString

# Placeholder secrets (to be updated with real values)
$placeholderSecrets = @(
    @{name="jwt-secret"; value="REPLACE_WITH_SECURE_JWT_SECRET"},
    @{name="stripe-secret-key"; value="REPLACE_WITH_STRIPE_SECRET_KEY"},
    @{name="stripe-webhook-secret"; value="REPLACE_WITH_STRIPE_WEBHOOK_SECRET"},
    @{name="polygon-api-key"; value="REPLACE_WITH_POLYGON_API_KEY"},
    @{name="news-api-key"; value="REPLACE_WITH_NEWS_API_KEY"},
    @{name="finnhub-api-key"; value="REPLACE_WITH_FINNHUB_API_KEY"},
    @{name="huggingface-api-key"; value="REPLACE_WITH_HUGGINGFACE_API_KEY"}
)

foreach ($secret in $placeholderSecrets) {
    az keyvault secret set `
        --vault-name $KeyVault `
        --name $secret.name `
        --value $secret.value
}

# Configure Function App to use Key Vault references
Write-Host "`nConfiguring Function App settings with Key Vault references..." -ForegroundColor Yellow

az functionapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $FunctionApp `
    --settings `
        "AZURE_POSTGRESQL_CONNECTION_STRING=@Microsoft.KeyVault(VaultName=$KeyVault;SecretName=postgresql-connection-string)" `
        "JWT_SECRET=@Microsoft.KeyVault(VaultName=$KeyVault;SecretName=jwt-secret)" `
        "STRIPE_SECRET_KEY=@Microsoft.KeyVault(VaultName=$KeyVault;SecretName=stripe-secret-key)" `
        "STRIPE_WEBHOOK_SECRET=@Microsoft.KeyVault(VaultName=$KeyVault;SecretName=stripe-webhook-secret)" `
        "POLYGON_API_KEY=@Microsoft.KeyVault(VaultName=$KeyVault;SecretName=polygon-api-key)"

# Output summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Infrastructure Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Resources Created:" -ForegroundColor Cyan
Write-Host "  Resource Group:    $ResourceGroup"
Write-Host "  PostgreSQL Server: $PostgresServer"
Write-Host "  PostgreSQL Host:   $pgHost"
Write-Host "  Function App:      $FunctionApp"
Write-Host "  Static Web App:    $StaticWebApp"
Write-Host "  Key Vault:         $KeyVault"
Write-Host "  Storage Account:   $StorageAccount"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update Key Vault secrets with real API keys"
Write-Host "  2. Set up Azure AD B2C tenant"
Write-Host "  3. Run database migration scripts"
Write-Host "  4. Deploy Azure Functions"
Write-Host "  5. Deploy Static Web App"
Write-Host ""
Write-Host "Static Web App URL: https://$StaticWebApp.azurestaticapps.net" -ForegroundColor Cyan
Write-Host "Function App URL:   https://$FunctionApp.azurewebsites.net" -ForegroundColor Cyan
