# Supabase Migrations

## Security Notice

This directory contains database migration files. **Never commit API keys, tokens, or credentials to these files.**

## Configuring Cron Jobs

After running the migration `20251002171220_enable_pg_cron_and_schedule_data_load.sql`, you need to configure the cron job credentials:

### Option 1: Via Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following query:

```sql
UPDATE cron_config
SET
  supabase_url = 'YOUR_SUPABASE_PROJECT_URL',
  supabase_anon_key = 'YOUR_SUPABASE_ANON_KEY'
WHERE id = 1;
```

### Option 2: Via Environment Variables (Recommended)

Store credentials in Supabase Vault or as database secrets:

```sql
-- Use Supabase Vault to store sensitive values
SELECT vault.create_secret('supabase_url', 'YOUR_SUPABASE_PROJECT_URL');
SELECT vault.create_secret('supabase_anon_key', 'YOUR_SUPABASE_ANON_KEY');
```

## Finding Your Supabase Credentials

1. **Supabase URL**: Found in your project dashboard under Settings > API
   - Format: `https://your-project.supabase.co`

2. **Anon Key**: Found in your project dashboard under Settings > API > Project API keys
   - Use the `anon` key (public key), NOT the service_role key
   - Format: JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Security Best Practices

- ✅ Use environment variables for all secrets
- ✅ Rotate keys if they are ever exposed in git history
- ✅ Use Supabase Vault for storing sensitive data
- ✅ Never commit `.env` files to git
- ❌ Never hardcode credentials in migration files
- ❌ Never commit production keys to version control

## Verifying Cron Job Setup

Check if the cron job is running:

```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details
ORDER BY end_time DESC
LIMIT 10;
```
