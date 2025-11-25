import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { isCurrentlyFullscreen, addFullscreenChangeListener } from '../utils/fullscreenHelpers';

const FullscreenContext = createContext();

export function FullscreenProvider({ children }) {
  // Modal visibility state
  const [showModal, setShowModal] = useState(false);

  // Fullscreen enforcement
  const [fullscreenRequired, setFullscreenRequired] = useState(false);

  // Track fullscreen violations
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [totalTimeOutsideFullscreen, setTotalTimeOutsideFullscreen] = useState(0); // in seconds
  const [lastExitTime, setLastExitTime] = useState(null);

  // Current fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Assessment pause state
  const [isPaused, setIsPaused] = useState(false);

  // Maximum allowed time outside fullscreen (5 minutes = 300 seconds)
  const MAX_TIME_OUTSIDE_FULLSCREEN = 300;

  // Track fullscreen changes
  useEffect(() => {
    const handleChange = () => {
      const currentFullscreenState = isCurrentlyFullscreen();
      setIsFullscreen(currentFullscreenState);

      if (fullscreenRequired) {
        if (!currentFullscreenState) {
          // User exited fullscreen
          handleFullscreenExit();
        } else {
          // User re-entered fullscreen
          handleFullscreenReenter();
        }
      }
    };

    const cleanup = addFullscreenChangeListener(handleChange);
    return cleanup;
  }, [fullscreenRequired]);

  // Update time spent outside fullscreen
  useEffect(() => {
    if (!isFullscreen && fullscreenRequired && lastExitTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const timeElapsed = Math.floor((now - lastExitTime) / 1000);
        setTotalTimeOutsideFullscreen(prev => {
          const newTotal = prev + 1;
          return newTotal;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isFullscreen, fullscreenRequired, lastExitTime]);

  // Handle fullscreen exit
  const handleFullscreenExit = useCallback(() => {
    setFullscreenExitCount(prev => prev + 1);
    setLastExitTime(Date.now());
    setIsPaused(true);
  }, []);

  // Handle fullscreen re-enter
  const handleFullscreenReenter = useCallback(() => {
    setLastExitTime(null);
    setIsPaused(false);
  }, []);

  // Reset tracking
  const resetTracking = useCallback(() => {
    setFullscreenExitCount(0);
    setTotalTimeOutsideFullscreen(0);
    setLastExitTime(null);
    setIsPaused(false);
  }, []);

  // Get remaining time before auto-submit
  const getRemainingTime = useCallback(() => {
    return Math.max(0, MAX_TIME_OUTSIDE_FULLSCREEN - totalTimeOutsideFullscreen);
  }, [totalTimeOutsideFullscreen]);

  // Check if should auto-submit
  const shouldAutoSubmit = useCallback(() => {
    return totalTimeOutsideFullscreen >= MAX_TIME_OUTSIDE_FULLSCREEN;
  }, [totalTimeOutsideFullscreen]);

  const value = {
    // Modal state
    showModal,
    setShowModal,

    // Fullscreen enforcement
    fullscreenRequired,
    setFullscreenRequired,

    // Violation tracking
    fullscreenExitCount,
    totalTimeOutsideFullscreen,
    isPaused,

    // Current state
    isFullscreen,

    // Helper functions
    resetTracking,
    getRemainingTime,
    shouldAutoSubmit,
    handleFullscreenExit,
    handleFullscreenReenter,

    // Constants
    MAX_TIME_OUTSIDE_FULLSCREEN
  };

  return (
    <FullscreenContext.Provider value={value}>
      {children}
    </FullscreenContext.Provider>
  );
}

export function useFullscreenContext() {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error('useFullscreenContext must be used within FullscreenProvider');
  }
  return context;
}
