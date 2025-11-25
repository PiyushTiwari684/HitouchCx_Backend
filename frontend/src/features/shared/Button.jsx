import React from 'react';

// A reusable, styled button component

const Button = ({
  children,
  onClick,
  disabled = false,
  className = '',
}) => {
  // Base styles for all buttons
  const baseStyles =
    'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';

  // Styles for the disabled state
  const disabledStyles = 'opacity-50 cursor-not-allowed bg-gray-400';

  // Styles for the enabled (hover) state
  const enabledStyles = 'hover:bg-blue-700';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${disabled ? disabledStyles : enabledStyles}
        ${className} 
      `}
    >
      {children}
    </button>
  );
};

export default Button;