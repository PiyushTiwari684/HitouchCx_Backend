import React from 'react';

// This component receives a 'status' prop ('pending', 'success', 'error')
// and an optional 'text' prop to display a custom message.
const StatusIndicator = ({ status, text }) => {
  
  // This function will decide which icon, color, and text to show
  // based on the 'status' prop.
  const renderStatus = () => {
    switch (status) {
      case 'success':
        return {
          icon: '✅',
          label: text || 'Allowed',
          className: 'text-green-600',
        };
      case 'error':
        return {
          icon: '❌',
          label: text || 'Denied',
          className: 'text-red-600',
        };
      case 'pending':
      default:
        return {
          icon: '⌛',
          label: text || 'Pending',
          className: 'text-yellow-600',
        };
    }
  };

  const { icon, label, className } = renderStatus();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-lg">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </div>
  );
};

export default StatusIndicator;