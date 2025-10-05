import React, { useState } from 'react';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { StripeService } from '../services/stripeService';

interface PricingCardProps {
  title: string;
  price: number;
  interval: 'month' | 'year';
  plan: 'monthly' | 'yearly' | 'pro' | 'enterprise';
  features: string[];
  popular?: boolean;
  savings?: string;
  className?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  interval,
  plan,
  features,
  popular = false,
  savings,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (loading) return;

    setLoading(true);
    
    try {
      console.log('🛒 Starting checkout for plan:', plan);
      
      // Use StripeService to redirect to checkout
      await StripeService.redirectToCheckout(plan);
      
    } catch (error) {
      console.error('❌ Checkout failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
      alert(`Checkout Error\n\n${errorMessage}\n\nPlease try again or contact support.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`
      bg-white rounded-2xl shadow-lg p-8 relative
      ${popular ? 'border-2 border-blue-500 scale-105' : 'border border-gray-200'}
      ${className}
    `}>
      {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      {/* Savings Badge */}
      {savings && (
        <div className="absolute -top-4 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {savings}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-5xl font-bold text-gray-900">${price}</span>
          <span className="text-gray-600 text-lg">/{interval}</span>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`
          w-full flex items-center justify-center
          py-4 px-6 rounded-lg font-semibold text-lg
          transition-colors duration-200
          ${popular 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-900 hover:bg-gray-800 text-white'
          }
          disabled:bg-gray-400 disabled:cursor-not-allowed
        `}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Get Started
          </>
        )}
      </button>

      {/* Additional Info */}
      <p className="text-center text-gray-500 text-sm mt-4">
        Cancel anytime. No setup fees.
      </p>
    </div>
  );
};

export default PricingCard;