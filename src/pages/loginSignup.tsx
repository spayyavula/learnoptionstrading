import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', marketing: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let userCredential;
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        // Send to Constant Contact if marketing consented
        if (form.marketing) {
          await fetch("https://api.cc.email/v3/contacts/sign_up_form", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer 83354061-af35-4309-8857-ec412c69c021"
            },
            body: JSON.stringify({
              email_address: form.email,
              first_name: form.name,
              list_memberships: ["YOUR_LIST_ID"]
            })
          });
        }
      } else {
        userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      }
      setSubmitting(false);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          {isSignup ? "Sign Up" : "Login"} to Learn Options Trading
        </h2>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            disabled={submitting}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            disabled={submitting}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={form.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            disabled={submitting}
          />
        </div>
        <div className="mb-4 flex items-center">
          <input
            id="marketing"
            name="marketing"
            type="checkbox"
            checked={form.marketing}
            onChange={handleChange}
            className="mr-2"
            disabled={submitting}
          />
          <label htmlFor="marketing" className="text-gray-700 text-sm">
            I agree to receive updates, tips, and offers by email.
          </label>
        </div>
        {error && (
          <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-colors"
          disabled={submitting}
        >
          {submitting ? (isSignup ? 'Signing up...' : 'Logging in...') : (isSignup ? 'Sign Up' : 'Login')}
        </button>
        <p className="text-xs text-gray-500 mt-4 text-center">
          By continuing, you agree to our{' '}
          <a href="/TermsAndConditions" className="underline hover:text-blue-700">Terms</a> and{' '}
          <a href="/PrivacyPolicy" className="underline hover:text-blue-700">Privacy Policy</a>.
        </p>
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-blue-600 underline text-sm"
            onClick={() => setIsSignup(!isSignup)}
            disabled={submitting}
          >
            {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </form>
    </div>
  );
}