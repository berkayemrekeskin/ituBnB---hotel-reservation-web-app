import React from 'react';
import { CheckCircle, Home } from 'lucide-react';
import { Button } from '../components/Button';

interface SuccessPageProps {
  onGoHome: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 animate-in zoom-in-95 duration-500">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={3} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
          <p className="text-gray-500">
            Your trip is all set. We've sent a confirmation email with all the details.
          </p>
        </div>

        <div className="pt-4">
          <Button onClick={onGoHome} className="w-full bg-black text-white hover:bg-gray-800 py-3">
             <Home size={18} className="mr-2" />
             Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};