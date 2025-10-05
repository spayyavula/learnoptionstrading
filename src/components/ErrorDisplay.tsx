import React, { useState, useEffect } from 'react';

interface ErrorDisplayProps {
  className?: string;
}

interface ErrorLog {
  id: string;
  error: unknown;
  context?: string;
  timestamp: string;
  message: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ className = '' }) => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleError = (event: CustomEvent<{ error: unknown; context?: string; timestamp: string }>) => {
      const { error, context, timestamp } = event.detail;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setErrors(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          error,
          context,
          timestamp,
          message: errorMessage
        }
      ]);
      
      // Auto-show the error display when a new error occurs
      setIsVisible(true);
    };

    // Add event listener
    window.addEventListener('app:error', handleError as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('app:error', handleError as EventListener);
    };
  }, []);

  // If no errors or not visible, don't render
  if (errors.length === 0 || !isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-96 max-w-full ${className}`}>
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center">
          <h3 className="font-bold">Error Log ({errors.length})</h3>
          <div className="space-x-2">
            <button 
              onClick={() => setErrors([])} 
              className="text-white hover:text-red-200 text-sm"
            >
              Clear
            </button>
            <button 
              onClick={() => setIsVisible(false)} 
              className="text-white hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {errors.map((error) => (
            <div key={error.id} className="p-4 border-b border-red-200">
              <div className="flex justify-between">
                <span className="font-medium text-red-700">{error.context || 'Error'}</span>
                <span className="text-xs text-gray-500">
                  {new Date(error.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-red-600">{error.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;