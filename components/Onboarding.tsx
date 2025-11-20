
import React, { useState } from 'react';
import { HeartIcon, MicrophoneIcon, ShieldIcon, SparklesIcon, ArrowRightIcon } from './icons';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const steps = [
    {
      title: "Welcome to KUMARI",
      description: "I'm your friendly personal health assistant. I'm here to help you with questions about health, hygiene, and growing up.",
      icon: <HeartIcon className="w-20 h-20 text-white" />,
      bgColor: "bg-pink-500",
    },
    {
      title: "Talk or Type",
      description: "You can chat with me by typing, or just use your voice! Tap the microphone to speak naturally.",
      icon: <MicrophoneIcon className="w-20 h-20 text-white" />,
      bgColor: "bg-blue-500",
    },
    {
      title: "Safe & Private",
      description: "This is a safe space. Your conversations are private, and I'll always ask for permission before saving anything to help me learn.",
      icon: <ShieldIcon className="w-20 h-20 text-white" />,
      bgColor: "bg-green-500",
    },
    {
      title: "Smart Guidance",
      description: "I can help explain things clearly in English or your local language. Let's start this journey together!",
      icon: <SparklesIcon className="w-20 h-20 text-white" />,
      bgColor: "bg-purple-500",
    }
  ];

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentStep = steps[currentIndex];

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg overflow-hidden relative">
      {/* Top Section with Color Background */}
      <div className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors duration-500 ${currentStep.bgColor} text-white relative overflow-hidden`}>
        
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10 mb-8 p-6 bg-white bg-opacity-20 rounded-full backdrop-blur-sm shadow-lg">
            {currentStep.icon}
        </div>
        <h2 className="relative z-10 text-3xl font-bold text-center mb-2 drop-shadow-sm">{currentStep.title}</h2>
      </div>

      {/* Bottom Section with Content */}
      <div className="bg-white p-8 pb-12 flex flex-col items-center text-center min-h-[280px]">
        <p className="text-slate-600 text-lg mb-8 flex-grow leading-relaxed px-4">
            {currentStep.description}
        </p>

        {/* Progress Dots */}
        <div className="flex gap-2 mb-10">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? `w-8 ${currentStep.bgColor}` : 'w-2 bg-gray-200'}`}
            ></div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between w-full gap-4 px-2">
            <button 
                onClick={handleSkip}
                className="text-slate-400 font-semibold hover:text-slate-600 px-4 py-2 transition-colors"
            >
                Skip
            </button>
            <button 
                onClick={handleNext}
                className={`${currentStep.bgColor} text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:opacity-90 transition-all flex items-center gap-2 transform active:scale-95`}
            >
                {currentIndex === steps.length - 1 ? "Get Started" : "Next"}
                <ArrowRightIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
