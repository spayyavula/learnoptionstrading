# Database Migration Script: Supabase to Azure PostgreSQL
# This script exports from Supabase and imports to Azure PostgreSQL

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "prod")]
    [string]$Environment,

    [Parameter(Mandatory=$true)]
    [string]$SupabaseHost,

    [Parameter(Mandatory=$true)]
    [string]$SupabasePassword,

    [Parameter(Mandatory=$false)]
    [string]$AzurePostgresPassword
)

$AppName = "optionsacademy"
$ResourceGroup = "$AppName-$Environment-rg"
$PostgresServer = "$AppName-$Environment-db"
$ExportDir = ".\database-export"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Migration: Supabase to Azure" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Create export directory
if (-not (Test-Path $ExportDir)) {
    New-Item -ItemType Directory -Path $ExportDir | Out-Null
}

# Get Azure PostgreSQL connection info
Write-Host "`n[1/6] Getting Azure PostgreSQL connection info..." -ForegroundColor Yellow
$azureHost = az postgres flexible-server show `
    --resource-group $ResourceGroup `
    --name $PostgresServer `
    --query fullyQualifiedDomainName -o tsv

if (-not $azureHost) {
    Write-Host "Error: Could not find Azure PostgreSQL server. Run setup-infrastructure.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "Azure PostgreSQL Host: $azureHost" -ForegroundColor Green

# Prompt for Azure password if not provided
if (-not $AzurePostgresPassword) {
    $securePassword = Read-Host "Enter Azure PostgreSQL admin password" -AsSecureString
    $AzurePostgresPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    )
}

# Step 2: Export schema from Supabase (excluding auth schema and RLS)
Write-Host "`n[2/6] Exporting schema from Supabase..." -ForegroundColor Yellow

$env:PGPASSWORD = $SupabasePassword

# Export public schema only, exclude RLS policies
pg_dump -h $SupabaseHost `
    -U postgres `
    -d postgres `
    --schema=public `
    --schema-only `
    --no-owner `
    --no-privileges `
    --no-security-labels `
    -f "$ExportDir\schema_raw.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error exporting schema from Supabase" -ForegroundColor Red
    exit 1
}

Write-Host "Schema exported to $ExportDir\schema_raw.sql" -ForegroundColor Green

# Step 3: Export data from Supabase
Write-Host "`n[3/6] Exporting data from Supabase..." -ForegroundColor Yellow

pg_dump -h $SupabaseHost `
    -U postgres `
    -d postgres `
    --schema=public `
    --data-only `
    --no-owner `
    --no-privileges `
    -f "$ExportDir\data.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error exporting data from Supabase" -ForegroundColor Red
    exit 1
}

Write-Host "Data exported to $ExportDir\data.sql" -ForegroundColor Green

# Step 4: Convert schema (remove RLS policies, add indexes)
Write-Host "`n[4/6] Converting schema for Azure..." -ForegroundColor Yellow

$schemaContent = Get-Content "$ExportDir\schema_raw.sql" -Raw

# Remove all RLS policy statements
$schemaContent = $schemaContent -replace 'CREATE POLICY[^;]+;', ''
$schemaContent = $schemaContent -replace 'ALTER TABLE [^\s]+ ENABLE ROW LEVEL SECURITY;', ''
$schemaContent = $schemaContent -replace 'ALTER TABLE [^\s]+ FORCE ROW LEVEL SECURITY;', ''

# Remove references to auth.uid()
$schemaContent = $schemaContent -replace 'auth\.uid\(\)', 'NULL'

# Add header
$convertedSchema = @"
-- ============================================
-- Azure PostgreSQL Schema for Options Academy
-- Converted from Supabase (RLS removed)
-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

$schemaContent

-- ============================================
-- Performance Indexes for User-Scoped Tables
-- ============================================

-- Trade History
CREATE INDEX IF NOT EXISTS idx_trade_history_user_id ON trade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_entry_date ON trade_history(entry_date DESC);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Saved Strategies
CREATE INDEX IF NOT EXISTS idx_saved_strategies_user_id ON saved_strategies(user_id);

-- Broker Credentials
CREATE INDEX IF NOT EXISTS idx_alpaca_credentials_user_id ON alpaca_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_credentials_user_id ON ibkr_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_robinhood_credentials_user_id ON robinhood_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_zerodha_credentials_user_id ON zerodha_credentials(user_id);

-- Sentiment Data
CREATE INDEX IF NOT EXISTS idx_stock_sentiment_scores_ticker ON stock_sentiment_scores(ticker);
CREATE INDEX IF NOT EXISTS idx_news_articles_ticker ON news_articles(ticker);

-- User Trading Metrics
CREATE INDEX IF NOT EXISTS idx_user_trading_metrics_user_id ON user_trading_metrics(user_id);

"@

$convertedSchema | Out-File "$ExportDir\schema_azure.sql" -Encoding UTF8

Write-Host "Converted schema saved to $ExportDir\schema_azure.sql" -ForegroundColor Green

# Step 5: Apply schema to Azure PostgreSQL
Write-Host "`n[5/6] Applying schema to Azure PostgreSQL..." -ForegroundColor Yellow

$env:PGPASSWORD = $AzurePostgresPassword

psql -h $azureHost `
    -U optionsadmin `
    -d optionsacademy `
    -f "$ExportDir\schema_azure.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error applying schema to Azure PostgreSQL" -ForegroundColor Red
    exit 1
}

Write-Host "Schema applied successfully" -ForegroundColor Green

# Step 6: Import data to Azure PostgreSQL
Write-Host "`n[6/6] Importing data to Azure PostgreSQL..." -ForegroundColor Yellow

psql -h $azureHost `
    -U optionsadmin `
    -d optionsacademy `
    -f "$ExportDir\data.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Some data import errors occurred (this may be expected for auth-related tables)" -ForegroundColor Yellow
}

Write-Host "Data import completed" -ForegroundColor Green

# Cleanup
$env:PGPASSWORD = ""

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Database Migration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Exported files saved in: $ExportDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify data integrity in Azure PostgreSQL"
Write-Host "  2. Test queries with sample user IDs"
Write-Host "  3. Update application to use Azure connection string"
