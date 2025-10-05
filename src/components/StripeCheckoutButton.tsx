import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = async () => {
    if (requireTerms && !termsAccepted) {
      setShowTermsModal(true);
      return;
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

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowSuccess(true);
    localStorage.setItem('termsAccepted', 'true');
    setTimeout(() => {
      setShowTermsModal(false);
      setShowSuccess(false);
      handleClick();
    }, 1500);
  };

  return (
    <>
      <button
        className={`stripe-checkout-btn ${className}`}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? 'Processing...' : buttonText}
        {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
      </button>
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
            {!showSuccess ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Terms & Agreement</h2>
                <div className="prose max-w-none text-gray-800 text-sm mb-4" style={{maxHeight:'50vh',overflowY:'auto'}}>
                  <h3>1. Account Agreement</h3>
                  <p>By proceeding, you agree to open a simulated trading account with Learn Options Trading Academy. You confirm that all information provided is accurate and complete.</p>
                  <h3>2. No Investment Advice</h3>
                  <p>Nothing on this platform constitutes investment, tax, or legal advice. You are solely responsible for your investment decisions. Consult a qualified advisor before trading.</p>
                  <h3>3. Risks of Options Trading</h3>
                  <p>Options trading is highly speculative and involves significant risk of loss. You may lose the entire value of your simulated investment. Past performance is not indicative of future results.</p>
                  <h3>4. Simulated Trading Only</h3>
                  <p>All trades are simulated. No real money is traded or invested. No actual trades are executed on any financial exchange.</p>
                  <h3>5. Market Data</h3>
                  <p>Market data is provided for educational purposes only and may be delayed or inaccurate. We do not guarantee the accuracy or timeliness of any data.</p>
                  <h3>6. User Conduct</h3>
                  <p>You agree to use this platform lawfully and respectfully. Any misuse may result in termination of access.</p>
                  <h3>7. Privacy</h3>
                  <p>See our <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Privacy Policy</a> for details on how your data is handled.</p>
                  <h3>8. Disclaimer</h3>
                  <p>Learn Options Trading Academy is an educational platform. We make no guarantees regarding the accuracy, completeness, or reliability of any information. Use at your own risk.</p>
                  <h3>9. Electronic Communications</h3>
                  <p>By using this platform, you consent to receive communications electronically.</p>
                  <h3>10. Changes to Terms</h3>
                  <p>We may update these terms at any time. Continued use of the platform constitutes acceptance of the new terms.</p>
                  <h3>11. Acknowledgement</h3>
                  <p>By clicking "I Agree & Continue", you acknowledge that you have read, understood, and agree to all terms, disclaimers, and policies above.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold"
                    onClick={() => setShowTermsModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                    onClick={handleAcceptTerms}
                  >
                    I Agree & Continue
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="text-green-600 mb-4">
                  <CheckCircle className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-bold mb-2">Thank you!</h3>
                <p className="text-gray-700 text-center">You have accepted the Terms & Conditions. Redirecting to checkout...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StripeCheckoutButton;
