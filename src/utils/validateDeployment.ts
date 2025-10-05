// 🔍 Pre-deployment validation script
// Run this before deploying to ensure everything is configured correctly

const validateEnvironment = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_STRIPE_MONTHLY_PRICE_ID',
    'VITE_STRIPE_YEARLY_PRICE_ID',
    'VITE_STRIPE_PRICE_ID_PRO',
    'VITE_STRIPE_PRICE_ID_ENTERPRISE',
    'VITE_STRIPE_COFFEE_PRICE_ID'
  ];

  const missing = [];
  const testValues = [];

  requiredEnvVars.forEach(key => {
    const value = import.meta.env[key];
    if (!value) {
      missing.push(key);
    } else if (value.includes('YOUR_') || value.includes('_HERE')) {
      testValues.push(key);
    }
  });

  console.log('🔍 Environment Validation Results:');
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    return false;
  }

  if (testValues.length > 0) {
    console.error('❌ Placeholder values found:', testValues);
    console.error('Please update these with your actual values');
    return false;
  }

  // Check if using live keys
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const isLive = stripeKey.startsWith('pk_live_');
  const isTest = stripeKey.startsWith('pk_test_');

  console.log(`🔑 Stripe Mode: ${isLive ? 'LIVE' : isTest ? 'TEST' : 'UNKNOWN'}`);
  
  if (isLive) {
    console.log('🚀 Ready for production deployment!');
  } else if (isTest) {
    console.log('🧪 Using test keys - good for staging');
  } else {
    console.error('❌ Invalid Stripe key format');
    return false;
  }

  console.log('✅ All environment variables configured correctly');
  return true;
};

// Run validation
export const runValidation = () => {
  console.log('🔍 Starting pre-deployment validation...');
  const isValid = validateEnvironment();
  
  if (isValid) {
    console.log('✅ Validation passed! Ready to deploy.');
  } else {
    console.log('❌ Validation failed. Please fix issues before deploying.');
  }
  
  return isValid;
};

// Auto-run if this file is executed directly
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  runValidation();
}
