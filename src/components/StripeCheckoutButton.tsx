import React, { useState } from 'react';

interface StripeCheckoutButtonProps {
  plan: 'monthly' | 'yearly' | 'pro' | 'enterprise';
  buttonText?: string;
  className?: string;
}

const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  plan,
  buttonText = 'Subscribe Now',
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const { StripeService } = await import('../services/stripeService');
      await StripeService.redirectToCheckout(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`stripe-checkout-btn ${className}`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Processing...' : buttonText}
      {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
    </button>
  );
};

export default StripeCheckoutButton;
