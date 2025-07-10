import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4">By using Learn Options Trading Academy, you agree to the following terms and conditions. Please read them carefully.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">1. Educational Purpose Only</h2>
      <p className="mb-4">This platform is for educational purposes only. No real money is traded. All trading is simulated and does not reflect actual market conditions or outcomes.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">2. No Financial Advice</h2>
      <p className="mb-4">Nothing on this site constitutes financial, investment, or trading advice. You should consult with a qualified financial advisor before making any investment decisions.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">3. Risks of Options Trading</h2>
      <p className="mb-4">Options trading involves substantial risk and is not suitable for all investors. You may lose the entire value of your investment. Past performance is not indicative of future results.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">4. User Conduct</h2>
      <p className="mb-4">You agree to use this platform lawfully and respectfully. Any misuse may result in termination of access.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">5. Privacy</h2>
      <p className="mb-4">See our <Link to="/privacy" className="underline text-blue-600">Privacy Policy</Link> for details on how your data is handled.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">6. Disclaimer</h2>
      <p className="mb-4">See our <Link to="/disclaimer" className="underline text-blue-600">Disclaimer</Link> for important information about the limitations of this platform.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">7. Changes to Terms</h2>
      <p className="mb-4">We may update these terms at any time. Continued use of the platform constitutes acceptance of the new terms.</p>
      <div className="mt-8">
        <Link to="/" className="text-blue-600 underline">Back to Home</Link>
      </div>
    </div>
  );
}
