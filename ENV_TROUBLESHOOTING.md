# Environment Variables Troubleshooting Guide

This guide helps you diagnose and fix environment variable loading issues.

## Quick Diagnostics

When the application starts, it will automatically run environment validation. Check your browser console for:

```
🚀 Application Starting...
==================================================
🔍 Environment Diagnostics
Environment mode: development
Environment Variables Status: ✅ Variables Loaded
==================================================
```

## Common Issues and Solutions

### 1. Environment Variables Not Loading

**Symptoms:**
- Console shows "No VITE_ environment variables detected"
- Supabase client shows "Missing" or "Invalid"
- Application features don't work

**Solutions:**
1. Verify `.env` file exists in project root (not in `src/`)
2. Restart the dev server completely (Ctrl+C, then `npm run dev`)
3. Check that all variables are prefixed with `VITE_`
4. Verify no syntax errors in `.env` (no spaces around `=`)

### 2. Wrong .env File Being Read

**Symptoms:**
- Old values appear even after updating `.env`
- Different values than what's in `.env`

**Solutions:**
1. Clear browser cache and restart dev server
2. Check for multiple `.env` files in different locations
3. Verify no `.env.local` or `.env.production` overriding values
4. Check Netlify UI for environment variables (production only)

### 3. Variables Missing in Production

**Symptoms:**
- Works locally but fails on Netlify
- Console shows missing environment variables in production

**Solutions:**
1. Add environment variables in Netlify UI:
   - Go to Site Settings > Environment Variables
   - Add each `VITE_` prefixed variable
   - Trigger a new deploy
2. Verify `.env` is in `.gitignore` (it should be)
3. Check build logs for environment variable errors

### 4. Invalid Variable Values

**Symptoms:**
- Console shows "Invalid value for: VITE_SUPABASE_URL"
- Validation fails on startup

**Solutions:**
1. Check value format:
   - `VITE_SUPABASE_URL` must start with `https://` and contain `.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` must be at least 50 characters and start with `eyJ`
2. Remove quotes around values in `.env`
3. No trailing spaces or newlines

## Using the Debug Tools

### In Development

1. **Console Diagnostics** - Automatic on startup
2. **EnvDebug Component** - Click "🔍 Check Environment" button (bottom-right)
3. **Manual Validation** - Open console and run validation checks

### What to Check

Look for these indicators in the console:
- ✅ = Variable loaded and valid
- ❌ = Variable missing or failed validation
- ⚠️ = Variable has issues but may work
- ℹ️ = Optional variable not set (usually OK)

## File Locations

```
project-root/
├── .env                    # Main environment file (git-ignored)
├── .env.example           # Template file (committed to git)
├── .env.local             # Local overrides (optional, git-ignored)
├── .env.production        # Production values (optional, git-ignored)
└── vite.config.ts         # Vite configuration
```

## Required Variables

These MUST be set for the application to work:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-key
```

## Environment Variable Priority

1. `.env.local` (highest priority, not checked into git)
2. `.env.[mode]` (e.g., `.env.production`)
3. `.env` (default)
4. Netlify UI Variables (production only)

## Restart Checklist

When you change `.env` values:

1. ✅ Stop the dev server (Ctrl+C)
2. ✅ Clear browser cache (or hard refresh with Ctrl+Shift+R)
3. ✅ Restart dev server (`npm run dev`)
4. ✅ Check console for validation results
5. ✅ Click "🔍 Check Environment" if needed

## Validation Rules

The application validates:
- **VITE_SUPABASE_URL**: Must be valid Supabase URL
- **VITE_SUPABASE_ANON_KEY**: Must be valid JWT token
- **VITE_POLYGON_API_KEY**: Must be at least 10 characters

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Use the EnvDebug component to see exactly what's loaded
3. Compare your `.env` with `.env.example`
4. Verify file permissions (should be readable)
5. Try creating a fresh `.env` from `.env.example`

## Production Deployment

For Netlify production:

1. Never commit `.env` to git (it's already in `.gitignore`)
2. Add all `VITE_` variables in Netlify UI
3. Trigger a new deploy after adding variables
4. Check deploy logs for environment validation
5. Variables are injected during build time (not runtime)

## Testing Your Setup

Run these commands to verify your configuration:

```bash
# Verify .env file exists
ls -la .env

# Check .env file contents (be careful not to expose sensitive data)
cat .env | grep VITE_SUPABASE_URL

# Run build to test
npm run build

# Check for validation errors in console
```

## Contact & Support

If environment variables are still not loading after following this guide:

1. Check GitHub issues for similar problems
2. Review Vite documentation on environment variables
3. Verify Node.js version (should be 20+)
4. Check for conflicts with other `.env` files or tools
