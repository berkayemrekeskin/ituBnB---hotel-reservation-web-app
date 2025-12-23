import React, { useState } from 'react';
import { X, Search, Calendar, Home, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '../../components/Button';

interface IntroTourProps {
    onClose: () => void;
    onLogin: () => void;
}

export const IntroTour: React.FC<IntroTourProps> = ({ onClose, onLogin }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Welcome to ituBeeNBee",
            description: "Discover the perfect stay for your next adventure. Whether you're planning a weekend getaway or a long-term trip, we have you covered.",
            icon: <Building2 className="w-16 h-16 text-amber-500 mb-6" />
        },
        {
            title: "Find Unique Stays",
            description: "Use our AI-powered search to find exactly what you're looking for. Just describe your dream trip, and we'll handle the rest.",
            icon: <Search className="w-16 h-16 text-amber-500 mb-6" />
        },
        {
            title: "Seamless Booking",
            description: "Book securely and manage your trips with ease. Keep track of all your reservations in one place.",
            icon: <Calendar className="w-16 h-16 text-amber-500 mb-6" />
        },
        {
            title: "Become a Host",
            description: "Have a space to share? List your property and start earning. It's simple to get started.",
            icon: <Home className="w-16 h-16 text-amber-500 mb-6" />
        }
    ];

    const currentStep = steps[step];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal User Interface */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[520px] flex flex-col">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Content Area */}
                <div className="p-8 flex flex-col items-center text-center pt-12 flex-1 justify-center">

                    {/* Animated Icon/Image area */}
                    <div className="mb-6 transform transition-all duration-300 hover:scale-105">
                        {currentStep.icon}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        {currentStep.title}
                    </h2>

                    <p className="text-gray-600 mb-8 leading-relaxed">
                        {currentStep.description}
                    </p>

                    {/* Progress Indicators */}
                    <div className="flex gap-2 mb-8 justify-center w-full">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? 'w-8 bg-amber-500' : 'w-2 bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {step === steps.length - 1 && (
                        <div className="mt-2 mb-6">
                            <p className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                                Don't have an account? {' '}
                                <button
                                    onClick={() => { onClose(); onLogin(); }}
                                    className="text-amber-600 font-semibold hover:underline outline-none"
                                >
                                    Sign up
                                </button>
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="w-full mt-auto relative flex items-center justify-center pb-2">
                        {step > 0 && (
                            <button
                                onClick={handleBack}
                                className="absolute left-0 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors px-2 py-1"
                            >
                                Back
                            </button>
                        )}

                        <Button
                            variant="primary"
                            className="w-full max-w-[200px] justify-center text-lg py-4 shadow-lg shadow-amber-200/50"
                            onClick={handleNext}
                        >
                            {step === steps.length - 1 ? "Get Started" : "Next"}
                            {step !== steps.length - 1 && <ArrowRight size={18} className="ml-2" />}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
};
