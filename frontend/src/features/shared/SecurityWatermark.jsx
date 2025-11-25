import { useEffect, useState } from 'react';

/**
 * Security Watermark Component
 * Displays semi-transparent watermark with assessment info
 * Prevents screenshots and adds traceability
 */
export default function SecurityWatermark({ assessmentId, candidateName, attemptId }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const watermarkText = `${candidateName} | ${assessmentId} | ${attemptId} | ${formatTime(currentTime)}`;

  return (
    <>
      {/* Diagonal watermarks */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[9999] select-none">
        <div className="absolute inset-0 flex flex-col justify-around">
          {[...Array(8)].map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex justify-around transform -rotate-45 opacity-10"
              style={{ transform: 'rotate(-45deg) translateY(0)' }}
            >
              {[...Array(4)].map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="text-gray-800 font-mono text-sm whitespace-nowrap px-8"
                >
                  {watermarkText}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Corner watermarks (always visible) */}
      <div className="fixed top-2 left-2 pointer-events-none z-[9999] select-none">
        <div className="bg-black bg-opacity-20 text-white text-xs font-mono px-2 py-1 rounded">
          {candidateName}
        </div>
      </div>

      <div className="fixed top-2 right-2 pointer-events-none z-[9999] select-none">
        <div className="bg-black bg-opacity-20 text-white text-xs font-mono px-2 py-1 rounded">
          ID: {attemptId}
        </div>
      </div>

      <div className="fixed bottom-2 left-2 pointer-events-none z-[9999] select-none">
        <div className="bg-black bg-opacity-20 text-white text-xs font-mono px-2 py-1 rounded">
          {formatTime(currentTime)}
        </div>
      </div>

      <div className="fixed bottom-2 right-2 pointer-events-none z-[9999] select-none">
        <div className="bg-black bg-opacity-20 text-white text-xs font-mono px-2 py-1 rounded flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          PROCTORED
        </div>
      </div>
    </>
  );
}
