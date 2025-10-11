# Configuration Management System

## Overview

The application now includes a **centralized configuration management system** that stores all environment variables in Supabase database tables with:

- ✅ Secure storage with Row Level Security (RLS)
- ✅ Complete audit trail of all changes
- ✅ Admin-only access controls
- ✅ Import/Export functionality
- ✅ Sync with local .env files
- ✅ Configuration validation
- ✅ Priority-based organization
- ✅ Category grouping

---

## Database Schema

### Tables Created

#### 1. `app_config` - Main Configuration Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `key` | text | Config key name (e.g., VITE_POLYGON_API_KEY) |
| `value` | text | Config value (nullable) |
| `description` | text | Human-readable description |
| `category` | text | Category (database, market_data, sentiment, etc.) |
| `priority` | text | Priority level (critical, high, medium, low) |
| `is_required` | boolean | Whether required for app functionality |
| `is_active` | boolean | Whether currently active |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |
| `created_by` | uuid | User who created (FK to auth.users) |

**Indexes:**
- `idx_app_config_key` - Fast lookups by key
- `idx_app_config_category` - Filter by category
- `idx_app_config_priority` - Filter by priority
- `idx_app_config_is_active` - Filter active configs

#### 2. `config_audit_log` - Audit Trail

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `config_id` | uuid | FK to app_config |
| `action` | text | Action (created, updated, deleted, accessed) |
| `old_value` | text | Previous value |
| `new_value` | text | New value |
| `changed_by` | uuid | User who made change (FK to auth.users) |
| `changed_at` | timestamptz | When change occurred |
| `ip_address` | text | IP address of requester |
| `user_agent` | text | User agent string |

**Indexes:**
- `idx_config_audit_config_id` - Fast lookups by config
- `idx_config_audit_changed_at` - Sort by date
- `idx_config_audit_action` - Filter by action type

#### 3. `config_summary` - Read-Only View

Provides safe summary information without exposing sensitive values:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Config ID |
| `key` | text | Config key |
| `description` | text | Description |
| `category` | text | Category |
| `priority` | text | Priority |
| `is_required` | boolean | Required flag |
| `is_active` | boolean | Active flag |
| `is_configured` | boolean | Whether value is set |
| `created_at` | timestamptz | Creation date |
| `updated_at` | timestamptz | Update date |

---

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with strict policies:

**app_config policies:**
- Only users with `role = 'admin'` in `auth.users.raw_user_meta_data` can:
  - SELECT (view configurations)
  - INSERT (create new configs)
  - UPDATE (modify configs)
  - DELETE (remove configs)

**config_audit_log policies:**
- Only admins can SELECT (view audit logs)
- System can INSERT (automatic logging)

### Admin Check Function

```sql
CREATE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Automatic Audit Logging

Every change is automatically logged via database triggers:
- **INSERT** → Logs 'created' action with new value
- **UPDATE** → Logs 'updated' action with old and new values
- **DELETE** → Logs 'deleted' action with old value
- **ACCESS** → Logs 'accessed' action when values are read

---

## Configuration Categories

### 1. **database** (Critical)
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

### 2. **market_data** (Critical/Medium)
- VITE_POLYGON_API_KEY
- VITE_POLYGON_BASE_URL
- VITE_FINNHUB_API_KEY
- VITE_FINANCIAL_MODELING_PREP_API_KEY

### 3. **sentiment** (High)
- VITE_NEWS_API_KEY
- VITE_HUGGINGFACE_API_KEY
- VITE_ALPHA_VANTAGE_API_KEY

### 4. **payments** (Medium/Low)
- VITE_STRIPE_PUBLISHABLE_KEY
- VITE_STRIPE_MONTHLY_PAYMENT_LINK
- VITE_STRIPE_YEARLY_PAYMENT_LINK
- VITE_STRIPE_PRO_PAYMENT_LINK
- VITE_STRIPE_ENTERPRISE_PAYMENT_LINK

### 5. **trading** (Low)
- VITE_ZERODHA_API_KEY
- VITE_ZERODHA_API_SECRET
- VITE_ZERODHA_ACCESS_TOKEN

### 6. **community** (Low)
- VITE_SLACK_WEBHOOK_URL
- VITE_DISCORD_WEBHOOK_URL
- VITE_TELEGRAM_BOT_TOKEN
- VITE_TELEGRAM_CHAT_ID
- VITE_TELEGRAM_CHANNEL
- VITE_WHATSAPP_GROUP_INVITE
- VITE_FACEBOOK_GROUP_ID

### 7. **marketing** (Low)
- VITE_CONSTANT_CONTACT_API_KEY
- VITE_CONSTANT_CONTACT_ACCESS_TOKEN
- VITE_CONSTANT_CONTACT_LIST_ID

### 8. **feature_flags** (High/Medium/Low)
- VITE_ENABLE_REAL_TIME_DATA
- VITE_ENABLE_MOCK_DATA
- VITE_ENABLE_DATA_PERSISTENCE
- VITE_HISTORICAL_DATA_RETENTION_DAYS
- VITE_OPTIONS_UPDATE_INTERVAL
- VITE_MAX_HISTORICAL_DAYS
- VITE_AUTO_START_SENTIMENT_SYNC
- VITE_SENTIMENT_SYNC_INTERVAL_MINUTES

### 9. **general** (Low)
- VITE_DEFAULT_MARKET

---

## Using the Config Manager UI

### Access

Navigate to: `/app/config` (Admin access required)

### Features

#### 1. **Dashboard Overview**
- **Total Configs**: All configuration keys
- **Configured**: Keys with values set
- **Missing**: Keys without values
- **Status**: Valid/Invalid based on required configs

#### 2. **Category Filtering**
- Click category tabs to filter
- "All" shows all configurations
- Count shown for each category

#### 3. **Configuration Cards**

Each config displays:
- **Key name** (e.g., VITE_POLYGON_API_KEY)
- **Priority badge** (CRITICAL, HIGH, MEDIUM, LOW)
- **Required badge** (if mandatory)
- **Status icon** (✓ configured, ⚠ missing)
- **Description** (what it's for)
- **Value field** (hidden by default, click eye icon to show)
- **Edit button** (switches to edit mode)

#### 4. **Editing Values**

To update a configuration:
1. Click **Edit** button on any config card
2. Enter or modify the value
3. Click **Save** (✓) to commit
4. Click **Cancel** (✗) to discard changes

#### 5. **Bulk Operations**

**Sync from .env**:
- Reads local `.env` file
- Updates database with any changed values
- Only syncs existing keys (doesn't create new ones)

**Import**:
- Upload `.env` file
- Parses and updates all matching keys
- Shows count of imported configs

**Export**:
- Downloads current configuration as `.env` file
- Includes comments and category grouping
- Filename: `.env.backup-YYYY-MM-DD`

---

## Using the ConfigService API

### Import

```typescript
import { ConfigService } from '../services/configService'
```

### Methods

#### Get All Configs

```typescript
const configs = await ConfigService.getAllConfigs()
// Returns: ConfigKey[]
```

#### Get Config Summary

```typescript
const summary = await ConfigService.getConfigSummary()
// Returns: ConfigSummary[] (safe for non-admins)
```

#### Get Configs by Category

```typescript
const sentimentConfigs = await ConfigService.getConfigsByCategory('sentiment')
// Returns: ConfigKey[]
```

#### Get Single Value

```typescript
const apiKey = await ConfigService.getConfigValue('VITE_POLYGON_API_KEY')
// Returns: string | null
// Logs access in audit trail
```

#### Set Value

```typescript
await ConfigService.setConfigValue('VITE_POLYGON_API_KEY', 'new_key_value')
// Logs change in audit trail
```

#### Create New Config

```typescript
await ConfigService.createConfig({
  key: 'VITE_NEW_API_KEY',
  value: 'initial_value',
  description: 'Description of new key',
  category: 'market_data',
  priority: 'medium',
  is_required: false
})
```

#### Update Config

```typescript
await ConfigService.updateConfig('VITE_POLYGON_API_KEY', {
  description: 'Updated description',
  priority: 'critical'
})
```

#### Delete Config

```typescript
await ConfigService.deleteConfig('VITE_OLD_KEY')
```

#### Bulk Set

```typescript
await ConfigService.bulkSetConfigs([
  { key: 'VITE_KEY1', value: 'value1' },
  { key: 'VITE_KEY2', value: 'value2' }
])
```

#### Import from .env Content

```typescript
const envContent = `
VITE_API_KEY=abc123
VITE_OTHER_KEY=xyz789
`
const imported = await ConfigService.importFromEnv(envContent)
// Returns: number (count of imported configs)
```

#### Export to .env Format

```typescript
const envContent = await ConfigService.exportToEnv()
// Returns: string (formatted .env file content)
```

#### Get Configuration Status

```typescript
const status = await ConfigService.getConfigurationStatus()
// Returns: {
//   total: number
//   configured: number
//   missing: number
//   criticalMissing: string[]
//   highPriorityMissing: string[]
// }
```

#### Sync from Local Environment

```typescript
const result = await ConfigService.syncFromLocalEnv()
// Returns: {
//   synced: number
//   errors: string[]
// }
```

#### Validate Configuration

```typescript
const validation = await ConfigService.validateConfiguration()
// Returns: {
//   valid: boolean
//   errors: string[]
//   warnings: string[]
// }
```

#### Get Audit Log

```typescript
// All audit logs (last 50)
const logs = await ConfigService.getAuditLog()

// Specific config's history
const configLogs = await ConfigService.getAuditLog(configId, 100)
```

---

## Database Functions

### get_config_value(key)

Securely retrieves a configuration value.

```sql
SELECT get_config_value('VITE_POLYGON_API_KEY');
```

**Security:**
- Admin-only access
- Logs access in audit trail
- Returns NULL if key not found

### set_config_value(key, value)

Securely updates a configuration value.

```sql
SELECT set_config_value('VITE_POLYGON_API_KEY', 'new_value');
```

**Security:**
- Admin-only access
- Automatically logs change
- Raises exception if key doesn't exist

### get_configs_by_category(category)

Gets all configs for a category.

```sql
SELECT * FROM get_configs_by_category('sentiment');
```

**Returns:**
- key
- value
- description
- priority
- is_required
- is_configured

---

## Setup Instructions

### 1. Make User an Admin

To grant admin access, update the user's metadata:

```sql
-- Via Supabase Dashboard SQL Editor
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'your-admin@email.com';
```

Or via Supabase Dashboard:
1. Go to Authentication > Users
2. Click on user
3. Scroll to "User Metadata"
4. Add: `{ "role": "admin" }`
5. Save

### 2. Initial Configuration

**Option A: Via UI** (Recommended)
1. Log in as admin
2. Navigate to `/app/config`
3. Click "Sync from .env" to load current values
4. Or manually enter each value in the UI

**Option B: Via SQL**

```sql
-- Update specific key
UPDATE app_config
SET value = 'your_polygon_api_key_here'
WHERE key = 'VITE_POLYGON_API_KEY';

-- Bulk update
UPDATE app_config SET value = 'https://mophlgpfygxinlnwdfyy.supabase.co' WHERE key = 'VITE_SUPABASE_URL';
UPDATE app_config SET value = 'eyJhbGc...' WHERE key = 'VITE_SUPABASE_ANON_KEY';
UPDATE app_config SET value = 'your_key' WHERE key = 'VITE_POLYGON_API_KEY';
```

**Option C: Via Import**
1. Navigate to `/app/config`
2. Click "Import"
3. Select your `.env` file
4. Confirm import

### 3. Enable Config Loading in App

To use database configs instead of .env:

```typescript
// At app startup
import { ConfigService } from './services/configService'

// Load all configs
const configs = await ConfigService.getAllConfigs()

// Override import.meta.env with database values
configs.forEach(config => {
  if (config.value) {
    // Dynamically inject into environment
    // Note: This requires build-time configuration
  }
})
```

---

## Security Best Practices

### 1. Encryption

For sensitive values, consider encrypting before storage:

```typescript
// Example with Web Crypto API
async function encryptValue(value: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
    key,
    data
  )
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)))
}
```

### 2. Access Control

- Only grant admin role to trusted users
- Regularly review admin users
- Monitor audit logs for suspicious activity

### 3. Audit Trail

The audit log captures:
- Who accessed/changed what
- When changes occurred
- Old and new values
- IP address and user agent

Review regularly:

```sql
SELECT
  ac.key,
  cal.action,
  cal.changed_at,
  au.email,
  cal.ip_address
FROM config_audit_log cal
JOIN app_config ac ON ac.id = cal.config_id
LEFT JOIN auth.users au ON au.id = cal.changed_by
ORDER BY cal.changed_at DESC
LIMIT 100;
```

### 4. Backup

Regular backups via Export:
1. Navigate to `/app/config`
2. Click "Export"
3. Store in secure location
4. Encrypt backup file if it contains sensitive data

---

## Migration from .env

### Steps

1. **Keep .env for now** - Don't delete your .env file
2. **Sync to database** - Use "Sync from .env" in UI
3. **Verify all values** - Check each config is correct
4. **Test thoroughly** - Ensure app works with database configs
5. **Backup .env** - Save a copy somewhere safe
6. **Update deployment** - Configure production to use database
7. **Optional: Remove .env** - Once confident, can remove file

### Hybrid Approach

You can use both:
- Critical configs in database (shared across deployments)
- Development overrides in local .env
- Production uses database exclusively

```typescript
// Fallback pattern
const getConfigValue = async (key: string): Promise<string> => {
  // Try database first
  const dbValue = await ConfigService.getConfigValue(key)
  if (dbValue) return dbValue

  // Fallback to .env
  return import.meta.env[key] || ''
}
```

---

## Troubleshooting

### "Access denied: admin role required"

**Cause**: User doesn't have admin role

**Solution**:
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
```

### "Configuration key not found"

**Cause**: Key doesn't exist in app_config table

**Solution**:
```sql
INSERT INTO app_config (key, description, category, priority, is_required)
VALUES ('VITE_NEW_KEY', 'Description', 'general', 'low', false);
```

### Values not taking effect

**Cause**: App still reading from .env instead of database

**Solution**: Implement config loading service at app startup

### Sync from .env not working

**Cause**: Keys in .env don't match keys in database

**Solution**: Ensure .env keys exactly match app_config.key values (including VITE_ prefix)

---

## Future Enhancements

Potential improvements:

1. **End-to-end encryption** for sensitive values
2. **Version control** for config changes
3. **Rollback** to previous versions
4. **Approval workflow** for production changes
5. **Environment-specific** configs (dev, staging, prod)
6. **Config validation** rules per key
7. **Notifications** for config changes
8. **API rate limit tracking** per key
9. **Cost monitoring** for paid APIs
10. **Auto-refresh** when configs change

---

## Summary

The configuration management system provides:

✅ **Centralized** storage of all environment variables
✅ **Secure** with RLS and admin-only access
✅ **Auditable** with complete change history
✅ **User-friendly** web UI for management
✅ **Importable/Exportable** .env format support
✅ **Validated** to ensure required configs are set
✅ **Organized** by category and priority
✅ **Flexible** sync with local development environments

This system makes it easy to manage API keys and configuration across multiple environments while maintaining security and traceability.
