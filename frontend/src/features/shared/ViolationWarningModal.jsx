import { useEffect } from 'react';

/**
 * Violation Warning Modal
 * Shows warning when user approaches violation thresholds
 */
export default function ViolationWarningModal({ isOpen, violationType, currentCount, threshold, onClose }) {
  // Auto-close after 10 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 10000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const remaining = threshold - currentCount;

  const violationMessages = {
    TAB_SWITCH: {
      title: 'Tab Switching Detected',
      description: 'You switched to another tab or window. Please remain focused on the assessment.',
      icon: '🔄'
    },
    PAGE_BLUR: {
      title: 'Window Focus Lost',
      description: 'The assessment window lost focus. Please keep the assessment window active.',
      icon: '👁️'
    },
    RIGHT_CLICK: {
      title: 'Right-Click Disabled',
      description: 'Right-clicking is disabled during the assessment for security purposes.',
      icon: '🖱️'
    },
    KEYBOARD_SHORTCUT: {
      title: 'Restricted Keyboard Shortcut',
      description: 'The keyboard shortcut you used is disabled during the assessment.',
      icon: '⌨️'
    },
    DEVTOOLS_OPEN: {
      title: 'Developer Tools Detected',
      description: 'Opening developer tools is strictly prohibited and will result in immediate submission.',
      icon: '🔧'
    },
    NEW_WINDOW_ATTEMPT: {
      title: 'New Window Blocked',
      description: 'Opening new windows or tabs is not allowed during the assessment.',
      icon: '🪟'
    },
    FULLSCREEN_EXIT: {
      title: 'Fullscreen Mode Exited',
      description: 'Please return to fullscreen mode immediately.',
      icon: '🖥️'
    },
    NO_FACE_DETECTED: {
      title: 'Face Not Detected',
      description: 'Your face is not visible in the camera. Please ensure you remain in view.',
      icon: '👤'
    },
    MULTIPLE_FACES: {
      title: 'Multiple Faces Detected',
      description: 'Multiple faces were detected. Only you should be visible during the assessment.',
      icon: '👥'
    },
    IP_CHANGE: {
      title: 'IP Address Changed',
      description: 'Your IP address has changed. This is a critical security violation.',
      icon: '🌐'
    },
    COPY_PASTE: {
      title: 'Copy/Paste Detected',
      description: 'Copying or pasting content is restricted during the assessment.',
      icon: '📋'
    }
  };

  const config = violationMessages[violationType] || violationMessages.TAB_SWITCH;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 animate-fade-in">
        {/* Icon */}
        <div className="text-center mb-4">
          <span className="text-6xl">{config.icon}</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-red-600 mb-3 text-center">
          ⚠️ Warning
        </h2>
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          {config.title}
        </h3>

        {/* Description */}
        <p className="text-gray-700 mb-6 text-center leading-relaxed">
          {config.description}
        </p>

        {/* Violation Count Warning */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-2xl">🚨</span>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-bold text-red-800 mb-1">
                Violation #{currentCount} of {threshold}
              </h4>
              <p className="text-sm text-red-700">
                {remaining > 0 ? (
                  <>
                    You have <strong>{remaining} more warning{remaining !== 1 ? 's' : ''}</strong> before your assessment will be automatically submitted.
                  </>
                ) : (
                  <strong className="text-red-900">
                    Next violation will result in immediate auto-submission!
                  </strong>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mb-6">
          <p className="text-sm text-yellow-800 font-medium text-center">
            All violations are being logged and will be reviewed. Please follow all assessment guidelines to avoid auto-submission.
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          I Understand
        </button>

        {/* Auto-close notice */}
        <p className="text-xs text-gray-500 text-center mt-3">
          This warning will automatically close in 10 seconds
        </p>
      </div>
    </div>
  );
}
