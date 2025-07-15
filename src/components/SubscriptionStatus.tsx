import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

interface SubscriptionStatusProps {
  className?: string
}

export default function SubscriptionStatus({ className = '' }: SubscriptionStatusProps) {
  // All features are free forever. No subscription needed.
  const [loading, setLoading] = useState(false)

  // Function to fetch real subscription status from Supabase
  const fetchSubscriptionStatus = async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', supabase.auth.getUser())
          .order('created', { ascending: false })
          .limit(1)
          .single()
        
        if (error) {
          console.error('Error fetching subscription:', error)
          return null
        }
        
        if (data) {
          return {
            active: data.status === 'active',
            plan: data.price_id.includes('monthly') ? 'monthly' : 'yearly',
            subscription: data,
            termsAccepted: data.terms_accepted
          }
        }
      }
      return null
    } catch (error) {
      console.error('Error in fetchSubscriptionStatus:', error)
      return null
    }
  }





  // Always show free forever message
  return (
    <div className={`flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-800">All features are free forever!</span>
      </div>
    </div>
  )

  const displayPlan = subscription.plan === 'pro' ? 'Pro' : 
                     subscription.plan === 'enterprise' || subscription.plan === 'yearly' ? 'Enterprise' : 'Basic';
  const nextBilling = subscription.subscription?.current_period_end 
    ? new Date(subscription.subscription.current_period_end).toLocaleDateString()
    : 'Unknown'

  return (
    <div className={`p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-green-800">Learn {displayPlan} Membership</span>
              {subscription.termsAccepted && (
                <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                  Terms Accepted
                </span>
              )}
            </div>
            <p className="text-xs text-green-600">
              Next billing: {nextBilling}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleManageSubscription}
            className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <Settings className="h-3 w-3 mr-1" />
            Manage
          </button>
        </div>
      </div>
    </div>
  )
}