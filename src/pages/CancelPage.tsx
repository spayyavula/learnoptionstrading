import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';

const CancelPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Enrollment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your academy enrollment process was cancelled. No charges have been made to your account.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <HelpCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
            <div className="text-left">
              <h3 className="font-medium text-yellow-800">Need Help?</h3>
              <p className="text-sm text-yellow-700 mt-1">
                If you encountered any issues during the enrollment process or have questions about our learning programs, please contact our support team.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/" 
            className="btn btn-secondary flex items-center justify-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          
          <Link 
            to="/pricing" 
            className="btn btn-primary flex items-center justify-center"
          >
            View Programs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CancelPage;