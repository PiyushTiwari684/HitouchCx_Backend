import { useState, useEffect, useCallback } from 'react';
import {
  isFullscreenSupported,
  requestFullscreen,
  exitFullscreen,
  isCurrentlyFullscreen,
  addFullscreenChangeListener,
  getFullscreenErrorMessage
} from '../utils/fullscreenHelpers';


export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported] = useState(isFullscreenSupported());
  const [error, setError] = useState(null);

  // Update fullscreen state when it changes
  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(isCurrentlyFullscreen());
  }, []);

  // Set up fullscreen change listeners
  useEffect(() => {
    // Initial state
    setIsFullscreen(isCurrentlyFullscreen());

    // Add listeners
    const cleanup = addFullscreenChangeListener(handleFullscreenChange);

    // Cleanup on unmount
    return cleanup;
  }, [handleFullscreenChange]);

  // Enter fullscreen mode
  const enterFullscreen = useCallback(async () => {
    if (!isSupported) {
      const err = new Error('Fullscreen not supported');
      setError(getFullscreenErrorMessage(err));
      return { success: false, error: err };
    }

    try {
      setError(null);
      await requestFullscreen();
      return { success: true, error: null };
    } catch (err) {
      const errorMessage = getFullscreenErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: err };
    }
  }, [isSupported]);

  // Exit fullscreen mode
  const exitFullscreenMode = useCallback(async () => {
    if (!isCurrentlyFullscreen()) {
      return { success: true, error: null };
    }

    try {
      setError(null);
      await exitFullscreen();
      return { success: true, error: null };
    } catch (err) {
      const errorMessage = getFullscreenErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: err };
    }
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (isCurrentlyFullscreen()) {
      return await exitFullscreenMode();
    } else {
      return await enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreenMode]);

  return {
    isFullscreen,
    isSupported,
    error,
    enterFullscreen,
    exitFullscreen: exitFullscreenMode,
    toggleFullscreen
  };
}
