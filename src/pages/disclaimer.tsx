import React from 'react';
import { Link } from 'react-router-dom';

export default function Disclaimer() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Disclaimer</h1>
      <p className="mb-4">Learn Options Trading Academy is an educational platform. All trading is simulated. No real money is traded, and no actual trades are executed on any financial exchange.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">No Investment Advice</h2>
      <p className="mb-4">The content provided is for informational and educational purposes only and does not constitute financial, investment, or trading advice. We do not recommend or endorse any specific securities, strategies, or investments.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Risk Warning</h2>
      <p className="mb-4">Options trading involves substantial risk and is not suitable for all investors. You may lose the entire value of your investment. Past performance is not indicative of future results. Always consult a qualified financial advisor before making investment decisions.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">No Guarantees</h2>
      <p className="mb-4">We make no guarantees regarding the accuracy, completeness, or reliability of any information on this platform. Use at your own risk.</p>
      <div className="mt-8">
        <Link to="/" className="text-blue-600 underline">Back to Home</Link>
      </div>
    </div>
  );
}
