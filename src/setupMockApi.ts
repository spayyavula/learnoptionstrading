import { runSubscriptionTests, runE2ETests } from './api/testRunner';

/**
 * Sets up mock API endpoints for development mode
 */
export function setupMockApi() {
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Mock API setup - NO STRIPE CHECKOUT INTERCEPTS
  window.fetch = async (url: string | Request, init?: RequestInit): Promise<Response> => {
    const urlString = typeof url === 'string' ? url : url.url;
    
    console.log('🌐 Fetch intercepted:', urlString)
    
    // Test runner endpoints (keep these)
    if (urlString === '/api/run-subscription-tests' && init?.method === 'POST') {
      try {
        const results = await runSubscriptionTests();
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Test execution failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (urlString === '/api/run-e2e-tests' && init?.method === 'POST') {
      try {
        const results = await runE2ETests();
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'E2E test execution failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 🚨 BLOCK ALL OTHER API CALLS - No Stripe checkout sessions allowed
    if (urlString.includes('/api/')) {
      console.error('❌ Blocked API call to:', urlString)
      console.error('❌ Use Payment Links instead of API calls!')
      
      return new Response(JSON.stringify({ 
        error: 'API calls disabled - Use Payment Links only',
        redirectTo: '/pricing'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For all other requests, use original fetch
    return originalFetch(url, init);
  }

  console.log('🔧 Mock API setup complete - Stripe API calls blocked');
}