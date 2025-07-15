import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface SubscriptionBannerProps {
  className?: string;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ className = '' }) => {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-center">
        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
        <span className="font-medium text-green-800">All features are free forever!</span>
      </div>
    </div>
  );
};

export default SubscriptionBanner;