import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, BookOpen, Gift, DollarSign, Calendar } from 'lucide-react';
import { CouponService } from '../services/couponService';
import { getPlanDetails, formatPrice } from '../utils/priceSync';

const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const plan = searchParams.get('plan') || 'monthly';
  const couponCode = searchParams.get('coupon');
  
  // Get plan and coupon details
  const planDetails = getPlanDetails(plan as 'monthly' | 'yearly' | 'enterprise' | 'basic');
  const coupon = couponCode ? CouponService.getCouponByCode(couponCode) : null;
  
  useEffect(() => {
    // Auto-redirect after countdown
    if (countdown > 0) {
      const timer = globalThis.setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => globalThis.clearTimeout(timer);
    } else {
      window.location.href = '/app';
    }
  }, [countdown]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Subscription Activated!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for subscribing to Learn Options Trading Academy! Your account has been activated and you now have access to all premium features.
        </p>
        
        {/* Subscription Details Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-800 mb-4 flex items-center justify-center">
            <Calendar className="h-5 w-5 mr-2" />
            Your Subscription Details
          </h3>
          
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-blue-700">Plan:</span>
              <span className="font-medium text-blue-900">{planDetails.name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-blue-700">Price:</span>
              <span className="font-medium text-blue-900">
                {formatPrice(planDetails.price)}/{planDetails.interval}
              </span>
            </div>
            
            {coupon && (
              <>
                <div className="flex justify-between">
                  <span className="text-blue-700">Coupon Applied:</span>
                  <span className="font-medium text-green-600">{coupon.code}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-blue-700">Discount:</span>
                  <span className="font-medium text-green-600">
                    {coupon.type === 'percentage' 
                      ? `${coupon.value}% OFF`
                      : `$${coupon.value} OFF`
                    }
                  </span>
                </div>
                
                {coupon.type === 'percentage' && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">You Saved:</span>
                    <span className="font-medium text-green-600">
                      ${((planDetails.price * coupon.value) / 100).toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}
            
            <div className="border-t border-blue-200 pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Next Billing:</span>
                <span className="font-medium text-blue-900">
                  {new Date(Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Unlocked */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Gift className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-medium text-green-800">Features Now Available</h3>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                {planDetails.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
                {planDetails.features.length > 4 && (
                  <li className="text-green-600 font-medium">
                    + {planDetails.features.length - 4} more features
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
            <div className="text-left">
              <h3 className="font-medium text-blue-800">Getting Started</h3>
              <p className="text-sm text-blue-700 mt-1">
                We recommend starting with our tutorial section to get the most out of your subscription. You'll learn how to use all the features and start building your trading expertise.
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Redirecting to dashboard in {countdown} seconds...
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/app" 
            className="btn btn-primary flex items-center justify-center"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          
          <Link 
            to="/app/learning" 
            className="btn btn-secondary flex items-center justify-center"
          >
            Begin Learning
            <BookOpen className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;