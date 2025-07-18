import React from 'react';

export default function DisclaimerDetailed() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Detailed Disclaimer</h1>
      <p className="mb-4">
        <strong>Last Updated:</strong> July 16, 2025
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Educational Use Only</h2>
      <p className="mb-4">
        Learn Options Trading Academy is an educational platform. All content, simulations, and tools are for informational and educational purposes only. We do not provide investment, financial, legal, or tax advice.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">No Investment Advice</h2>
      <p className="mb-4">
        Nothing on this platform constitutes a solicitation, recommendation, endorsement, or offer by Learn Options Trading Academy or any third party to buy or sell any securities or other financial instruments.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Simulated Trading</h2>
      <p className="mb-4">
        All trading on this platform is simulated. No real money is used or exchanged. Past simulated performance is not indicative of future results.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Risk Warning</h2>
      <p className="mb-4">
        Options trading involves substantial risk and is not suitable for every investor. You may lose all or more than your initial investment. You should carefully consider your financial situation and consult with a qualified advisor before engaging in any trading activity.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Jurisdictional Restrictions</h2>
      <p className="mb-4">
        Access to this platform may be restricted in certain jurisdictions. It is your responsibility to ensure that your use of this platform complies with all applicable laws and regulations, including those in the United States, India, and globally.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Third-Party Content</h2>
      <p className="mb-4">
        We may provide links to third-party websites or resources. We are not responsible for the content, accuracy, or availability of these external sites or resources.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p>
        For questions about this disclaimer, contact us at <a href="mailto:support@learnoptionstrading.academy" className="text-blue-600 underline">support@learnoptionstrading.academy</a>.
      </p>
    </div>
  );
}