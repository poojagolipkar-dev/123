import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-white shadow-lg shadow-blue-500/10 border border-slate-100 dark:border-neutral-800 ${className} relative group`}>
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      {/* 
        Replace the src below with your actual logo URL or base64 data.
        The image you provided is a circular logo with a car and "Shree" text.
      */}
      <img 
        src="https://i.ibb.co/vYm6p6n/shree-logo.png" 
        alt="Shree Logo" 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Fallback if image fails to load
          const target = e.target as HTMLImageElement;
          target.src = 'https://picsum.photos/seed/car/200/200';
        }}
      />
    </div>
  );
};

export default Logo;
