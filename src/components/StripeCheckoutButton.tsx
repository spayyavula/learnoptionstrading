import React, { useState } from 'react';

interface StripeCheckoutButtonProps {
  plan: 'monthly' | 'yearly' | 'pro' | 'enterprise';
  buttonText?: string;
  className?: string;
  requireTerms?: boolean;
}

const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  plan,
  buttonText = 'Subscribe Now',
  className = '',
  requireTerms = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (requireTerms) {
      const termsAccepted = window.confirm(
        `Terms & Agreement\n\nBy proceeding, you agree to our Terms of Service, Privacy Policy, and Subscription terms. Continue with ${plan} plan checkout?`
      );
      if (!termsAccepted) return;
    }
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
