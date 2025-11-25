import { useEffect, useState, useRef } from 'react';
import { useFullscreen } from '../../hooks/useFullscreen';
import { isBrowserAllowed, detectBrowser } from '../../utils/fullscreenHelpers';
import { detectDevTools } from '../../utils/devToolsDetection';

/**
 * Fullscreen Icon SVG Component
 */
function FullscreenIcon() {
  return (
    <svg
      className="w-16 h-16 text-blue-500 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
      />
    </svg>
  );
}

/**
 * Fullscreen Modal Component
 * Shows a modal requesting fullscreen permission before starting assessment
 *
 * 🆕 NEW FEATURE: Developer Tools Detection
 * - Checks if DevTools are open when modal is displayed
 * - Disables "Allow & Continue" button if DevTools are open
 * - Shows warning message to close DevTools
 * - Re-enables button when DevTools are closed
 */
export default function FullscreenModal({ isOpen, onClose, onConfirm, onCancel }) {
  const { enterFullscreen, isSupported } = useFullscreen();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [browserAllowed] = useState(isBrowserAllowed());
  const [currentBrowser] = useState(detectBrowser());

  // 🆕 NEW: DevTools detection state
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const devToolsCheckIntervalRef = useRef(null);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Show warning instead of closing
        setError('Fullscreen mode is required to proceed with the assessment.');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 🆕 NEW: DevTools Detection - Only when modal is visible
  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setIsDevToolsOpen(false);
      if (devToolsCheckIntervalRef.current) {
        clearInterval(devToolsCheckIntervalRef.current);
        devToolsCheckIntervalRef.current = null;
      }
      return;
    }

    // When modal opens, check DevTools every 500ms
    console.log('🔍 [Fullscreen Modal] Starting DevTools detection...');

    // Initial check
    const initialCheck = detectDevTools();
    setIsDevToolsOpen(initialCheck);

    // Continue checking every 500ms
    devToolsCheckIntervalRef.current = setInterval(() => {
      const isOpen = detectDevTools();
      setIsDevToolsOpen(isOpen);

      if (isOpen) {
        console.log('⚠️ [Fullscreen Modal] DevTools are open - button disabled');
      } else {
        console.log('✅ [Fullscreen Modal] DevTools are closed - button enabled');
      }
    }, 500);

    // Cleanup on unmount
    return () => {
      if (devToolsCheckIntervalRef.current) {
        clearInterval(devToolsCheckIntervalRef.current);
        devToolsCheckIntervalRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle Allow & Continue button
  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await enterFullscreen();

      if (result.success) {
        // Fullscreen successful
        onConfirm();
      } else {
        // Fullscreen failed
        setError(
          result.error?.message?.includes('denied') || result.error?.message?.includes('permission')
            ? 'Fullscreen permission was denied. Please click "Retry" and allow fullscreen to continue.'
            : 'Unable to enter fullscreen mode. Please try again.'
        );
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Cancel button
  const handleCancel = () => {
    setError(null);
    onCancel();
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      // Show warning instead of closing
      setError('Fullscreen mode is required to proceed with the assessment.');
    }
  };

  if (!isOpen) return null;

  // Browser not supported
  if (!browserAllowed || !isSupported) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
          {/* Warning Icon */}
          <div className="text-6xl text-red-500 text-center mb-4">⚠️</div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Browser Not Supported
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6 text-center leading-relaxed">
            Your browser ({currentBrowser || 'Unknown'}) does not support fullscreen mode or is not allowed for this assessment.
          </p>

          <p className="text-gray-600 mb-6 text-center font-semibold">
            Please use one of the following browsers:
          </p>

          <ul className="text-gray-700 mb-6 text-center space-y-2">
            <li className="flex items-center justify-center gap-2">
              <span className="text-blue-500">✓</span> Google Chrome
            </li>
            <li className="flex items-center justify-center gap-2">
              <span className="text-blue-500">✓</span> Mozilla Firefox
            </li>
            <li className="flex items-center justify-center gap-2">
              <span className="text-blue-500">✓</span> Safari
            </li>
          </ul>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Main fullscreen request modal
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
        {/* Fullscreen Icon */}
        <FullscreenIcon />

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Enter Fullscreen Mode
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-6 text-center leading-relaxed">
          For test integrity, you must remain in fullscreen throughout the assessment.
          Exiting fullscreen will be flagged and tracked.
        </p>

        {/* Warning Box */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                If you spend more than <strong>5 minutes total</strong> outside fullscreen during the assessment,
                it will be automatically submitted.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">❌</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 🆕 NEW: DevTools Warning - shown when DevTools are detected */}
        {isDevToolsOpen && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-500 text-xl">🚨</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 font-semibold mb-1">
                  Developer Tools Detected
                </p>
                <p className="text-xs text-red-700">
                  Please close Developer Tools (F12) before continuing. The "Allow & Continue" button will be enabled once DevTools are closed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          {/* Allow & Continue Button - 🔄 UPDATED: Disabled when DevTools are open */}
          <button
            onClick={handleConfirm}
            disabled={isProcessing || isDevToolsOpen}
            className={`flex-1 px-6 py-3 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDevToolsOpen
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isProcessing
              ? 'Requesting...'
              : isDevToolsOpen
              ? '🔒 Close DevTools to Continue'
              : error
              ? 'Retry'
              : 'Allow & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
