import React from 'react';

const Logo = ({ variant = 'light', className = '', size = 'md' }) => {
  const isDark = variant === 'dark';
  const isMono = variant === 'monochrome';
  const textColor = isDark ? 'text-gray-900' : isMono ? 'text-gray-400' : 'text-white';
  const accentColor = isMono ? 'text-gray-400' : 'text-[#F84464]';
  const badgeBg = isMono ? 'bg-gray-600' : 'bg-[#F84464]';

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <div className={`flex items-center justify-center ${badgeBg} text-white p-1.5 rounded-lg shadow-sm flex-shrink-0`}>
        <svg className={`${iconSizes[size] || iconSizes.md} fill-current`} viewBox="0 0 24 24">
          <path d="M4 4C2.89 4 2 4.89 2 6v3.2c1.1 0 2 .9 2 2s-.9 2-2 2V18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2v-2.8c-1.1 0-2-.9-2-2s.9-2 2-2V6c0-1.11-.89-2-2-2H4zm8 3c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1V8c0-.55.45-1 1-1zm0 6c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1z" />
        </svg>
      </div>
      <span className={`${textSizes[size] || textSizes.md} tracking-tight font-extrabold flex items-center leading-none font-sans`}>
        <span className={textColor}>book</span>
        <span className={accentColor}>my</span>
        <span className={textColor}>ticket</span>
      </span>
    </div>
  );
};

export default Logo;
