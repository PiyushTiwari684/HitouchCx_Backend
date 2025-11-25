import { useEffect, useState } from 'react';
import { useFullscreenContext } from '../../context/FullscreenContext';
import { useFullscreen } from '../../hooks/useFullscreen';
import { formatTime } from '../../utils/fullscreenHelpers';

/**
 * Warning Overlay Component
 * Shown when user exits fullscreen during assessment
 * Displays countdown and allows re-entering fullscreen
 */
export default function FullscreenWarningOverlay({ onAutoSubmit }) {
  const {
    isPaused,
    getRemainingTime,
    fullscreenExitCount,
    totalTimeOutsideFullscreen
  } = useFullscreenContext();

  const { enterFullscreen } = useFullscreen();
  const [remainingTime, setRemainingTime] = useState(300);
  const [isReentering, setIsReentering] = useState(false);

  // Update remaining time
  useEffect(() => {
    if (isPaused) {
      const interval = setInterval(() => {
        const remaining = getRemainingTime();
        setRemainingTime(remaining);

        // Auto-submit if time runs out
        if (remaining <= 0) {
          clearInterval(interval);
          onAutoSubmit();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPaused, getRemainingTime, onAutoSubmit]);

  // Handle re-enter fullscreen
  const handleReenterFullscreen = async () => {
    setIsReentering(true);
    try {
      await enterFullscreen();
    } catch (err) {
      console.error('Failed to re-enter fullscreen:', err);
    } finally {
      setIsReentering(false);
    }
  };

  if (!isPaused) return null;

  const isUrgent = remainingTime <= 60; // Last minute

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full mx-4">
        {/* Warning Icon */}
        <div className={`text-6xl text-center mb-4 ${isUrgent ? 'animate-pulse' : ''}`}>
          {isUrgent ? '🚨' : '⚠️'}
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">
          Assessment Paused
        </h2>

        {/* Main Message */}
        <p className="mb-6 text-center text-lg text-gray-700">
          You have exited fullscreen mode. Please return to fullscreen to continue your assessment.
        </p>

        {/* Countdown Timer */}
        <div className={`mb-6 p-6 rounded-lg ${isUrgent ? 'bg-red-100 border-2 border-red-400' : 'bg-yellow-50 border-2 border-yellow-400'}`}>
          <p className={`text-sm font-semibold mb-2 text-center ${isUrgent ? 'text-red-700' : 'text-yellow-700'}`}>
            Time Remaining Before Auto-Submit
          </p>
          <p className={`text-5xl font-bold text-center ${isUrgent ? 'text-red-600' : 'text-yellow-600'}`}>
            {formatTime(remainingTime)}
          </p>
        </div>

        {/* Statistics */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Fullscreen Exits:</span>
            <span className="font-semibold text-gray-900">{fullscreenExitCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Time Outside Fullscreen:</span>
            <span className="font-semibold text-gray-900">{formatTime(totalTimeOutsideFullscreen)}</span>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-sm text-red-700">
            <strong>Important:</strong> If you spend more than 5 minutes total outside fullscreen,
            your assessment will be automatically submitted.
          </p>
        </div>

        {/* Return to Fullscreen Button */}
        <button
          onClick={handleReenterFullscreen}
          disabled={isReentering}
          className={`w-full px-6 py-4 rounded font-semibold text-lg transition-all ${
            isUrgent
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed ${
            isUrgent ? 'animate-pulse' : ''
          }`}
        >
          {isReentering
            ? 'Returning to Fullscreen...'
            : 'Return to Fullscreen & Resume'}
        </button>

        {/* Help Text */}
        <p className="text-xs text-center mt-4 text-gray-500">
          Press F11 or click the button above to return to fullscreen mode
        </p>
      </div>
    </div>
  );
}
