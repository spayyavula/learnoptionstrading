/**
 * Enhanced error logging utility
 */

/**
 * Log an error with enhanced details to the console
 */
export function logError(error: unknown, context?: string): void {
  console.group(`%c🔴 Error${context ? ` in ${context}` : ''}`, 'color: red; font-weight: bold;');
  
  if (error instanceof Error) {
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Log additional properties if available
    const additionalProps = Object.keys(error).filter(key => 
      !['name', 'message', 'stack'].includes(key)
    );
    
    if (additionalProps.length > 0) {
      console.group('Additional properties:');
      additionalProps.forEach(prop => {
        console.error(`${prop}:`, (error as any)[prop]);
      });
      console.groupEnd();
    }
  } else {
    console.error('Unknown error:', error);
  }
  
  console.groupEnd();
  
  // In development, also show in the UI via a custom event
  if (import.meta.env.DEV) {
    const errorEvent = new CustomEvent('app:error', { 
      detail: { 
        error, 
        context,
        timestamp: new Date().toISOString()
      } 
    });
    window.dispatchEvent(errorEvent);
  }
}

/**
 * Create a global error handler
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'Unhandled Promise Rejection');
    // Prevent the default browser behavior
    event.preventDefault();
  });
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), 'Global Error');
    // Prevent the default browser behavior
    event.preventDefault();
  });
  
  console.log('Global error handlers set up');
}