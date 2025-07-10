import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">1. Information We Collect</h2>
      <p className="mb-4">We collect only the information necessary to provide our educational services, such as your email address and usage data.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">2. How We Use Information</h2>
      <p className="mb-4">We use your information to operate the platform, improve our services, and communicate with you. We do not sell your data to third parties.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">3. Data Security</h2>
      <p className="mb-4">We implement industry-standard security measures to protect your data.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">4. Cookies</h2>
      <p className="mb-4">We use cookies to enhance your experience. You can disable cookies in your browser settings.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">5. Changes to Policy</h2>
      <p className="mb-4">We may update this policy. Continued use of the platform constitutes acceptance of the new policy.</p>
      <div className="mt-8">
        <Link to="/" className="text-blue-600 underline">Back to Home</Link>
      </div>
    </div>
  );
}
