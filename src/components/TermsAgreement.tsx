import React, { useState } from 'react'
import { Check, AlertTriangle, FileText } from 'lucide-react'

interface TermsAgreementProps {
  onAccept: () => void
  onDecline?: () => void
  className?: string
}

const TermsAgreement: React.FC<TermsAgreementProps> = ({
  onAccept,
  onDecline,
  className = ''
}) => {
  const [isChecked, setIsChecked] = useState(false)

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-1">
          <FileText className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium text-gray-900">Terms and Conditions</h3>
          <div className="mt-2 text-sm text-gray-600 space-y-2">
            <p>
              By subscribing to OptionsWorld, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>. You acknowledge that:
            </p>
            <ul className="list-decimal pl-4 space-y-1">
              <li>OptionsWorld is for educational purposes only and does not provide financial advice.</li>
              <li>Options trading involves substantial risk and may not be suitable for all investors.</li>
              <li>Past performance is not indicative of future results.</li>
              <li>You are responsible for your own trading decisions and potential losses.</li>
              <li>Data provided may not be accurate or timely and should be verified independently.</li>
              <li>Your subscription will automatically renew unless cancelled before the renewal date.</li>
              <li>You must be at least 18 years old to use this service.</li>
              <li>OptionsWorld reserves the right to modify or terminate the service at any time.</li>
              <li>Your personal information will be handled in accordance with our Privacy Policy.</li>
              <li>You agree not to reproduce, duplicate, copy, sell, or resell any portion of the service.</li>
            </ul>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-yellow-700">
                  <strong>Risk Warning:</strong> Options trading carries a high level of risk and may not be suitable for all investors. You should carefully consider your investment objectives, level of experience, and risk appetite before trading options. You may sustain a loss of some or all of your invested capital, therefore, you should not speculate with capital that you cannot afford to lose.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-start">
            <div className="flex-shrink-0">
              <input
                id="terms-agreement"
                name="terms-agreement"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              />
            </div>
            <label htmlFor="terms-agreement" className="ml-3 text-sm text-gray-700">
              I have read and agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </label>
          </div>
          
          <div className="mt-4 flex space-x-3">
            <button
              type="button"
              onClick={onAccept}
              disabled={!isChecked}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4 mr-1" />
              I Accept
            </button>
            
            {onDecline && (
              <button
                type="button"
                onClick={onDecline}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                I Decline
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsAgreement