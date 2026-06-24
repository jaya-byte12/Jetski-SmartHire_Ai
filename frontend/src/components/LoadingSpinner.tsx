import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Processing requests with AI model...",
  size = 'md',
  fullPage = false,
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-3',
    lg: 'h-16 w-16 border-4',
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative">
        {/* Outer glowing pulsing ring */}
        <div className={`absolute inset-0 rounded-full bg-violet-600/20 blur-xl animate-pulse ${
          size === 'sm' ? 'scale-150' : size === 'md' ? 'scale-125' : 'scale-110'
        }`} />
        
        {/* Main Spinner Ring */}
        <div className={`animate-spin rounded-full border-t-violet-500 border-r-teal-400 border-b-transparent border-l-transparent ${sizeClasses[size]}`} />
      </div>

      {message && (
        <p className="mt-4 text-slate-400 font-sans tracking-wide text-xs md:text-sm animate-pulse font-medium">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};
export default LoadingSpinner;
