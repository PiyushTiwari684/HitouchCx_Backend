// import { useState, useEffect } from 'react';

// /**
//  * Toast Notification Component
//  * Lightweight toast system for showing brief messages
//  */

// // Toast container to manage multiple toasts
// export function ToastContainer({ toasts, removeToast }) {
//   return (
//     <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
//       {toasts.map(toast => (
//         <Toast
//           key={toast.id}
//           {...toast}
//           onClose={() => removeToast(toast.id)}
//         />
//       ))}
//     </div>
//   );
// }

// // Individual toast component
// function Toast({ id, message, type = 'info', duration = 3000, onClose }) {
//   const [isVisible, setIsVisible] = useState(false);

//   useEffect(() => {
//     // Fade in
//     setTimeout(() => setIsVisible(true), 10);

//     // Auto-dismiss
//     const timer = setTimeout(() => {
//       setIsVisible(false);
//       setTimeout(onClose, 300); // Wait for fade out animation
//     }, duration);

//     return () => clearTimeout(timer);
//   }, [duration, onClose]);

//   const typeStyles = {
//     info: 'bg-blue-500 text-white',
//     success: 'bg-green-500 text-white',
//     warning: 'bg-yellow-500 text-white',
//     error: 'bg-red-500 text-white',
//     violation: 'bg-red-600 text-white border-2 border-red-800'
//   };

//   const icons = {
//     info: 'ℹ️',
//     success: '✅',
//     warning: '⚠️',
//     error: '❌',
//     violation: '🚨'
//   };

//   return (
//     <div
//       className={`
//         pointer-events-auto
//         flex items-center gap-3
//         px-4 py-3 rounded-lg shadow-lg
//         min-w-[300px] max-w-md
//         transition-all duration-300 transform
//         ${typeStyles[type] || typeStyles.info}
//         ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
//       `}
//     >
//       <span className="text-2xl flex-shrink-0">{icons[type]}</span>
//       <p className="flex-1 text-sm font-medium">{message}</p>
//       <button
//         onClick={() => {
//           setIsVisible(false);
//           setTimeout(onClose, 300);
//         }}
//         className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
//       >
//         ✕
//       </button>
//     </div>
//   );
// }

// // Hook to use toast system
// export function useToast() {
//   const [toasts, setToasts] = useState([]);

//   const showToast = (message, type = 'info', duration = 3000) => {
//     const id = Date.now() + Math.random();
//     setToasts(prev => [...prev, { id, message, type, duration }]);
//   };

//   const removeToast = (id) => {
//     setToasts(prev => prev.filter(toast => toast.id !== id));
//   };

//   return {
//     toasts,
//     showToast,
//     removeToast,
//     success: (msg, duration) => showToast(msg, 'success', duration),
//     error: (msg, duration) => showToast(msg, 'error', duration),
//     warning: (msg, duration) => showToast(msg, 'warning', duration),
//     info: (msg, duration) => showToast(msg, 'info', duration),
//     violation: (msg, duration = 5000) => showToast(msg, 'violation', duration)
//   };
// }



import { useState, useEffect, useCallback } from 'react';  // ✅ Added useCallback

/**
 * Toast Notification Component
 * Lightweight toast system for showing brief messages
 */

// Toast container to manage multiple toasts (NO CHANGES)
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Individual toast component (NO CHANGES)
function Toast({ id, message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    info: 'bg-blue-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-500 text-white',
    violation: 'bg-red-600 text-white border-2 border-red-800'
  };

  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    violation: '🚨'
  };

  return (
    <div
      className={`
        pointer-events-auto
        flex items-center gap-3
        px-4 py-3 rounded-lg shadow-lg
        min-w-[300px] max-w-md
        transition-all duration-300 transform
        ${typeStyles[type] || typeStyles.info}
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
    >
      <span className="text-2xl flex-shrink-0">{icons[type]}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

// ============================================================================
// ✅ FIXED VERSION - Hook to use toast system
// ============================================================================
export function useToast() {
  const [toasts, setToasts] = useState([]);

  // ✅ FIX: Wrap in useCallback with empty dependencies
  // This creates a STABLE function that won't recreate on every render
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []); // ✅ Empty array = function never recreates

  // ✅ FIX: Stable removeToast function
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []); // ✅ Empty array = function never recreates

  // ✅ FIX: Create stable helper functions using useCallback
  // Each only depends on showToast, which is already stable
  const success = useCallback((msg, duration) => {
    showToast(msg, 'success', duration);
  }, [showToast]);

  const error = useCallback((msg, duration) => {
    showToast(msg, 'error', duration);
  }, [showToast]);

  const warning = useCallback((msg, duration) => {
    showToast(msg, 'warning', duration);
  }, [showToast]);

  const info = useCallback((msg, duration) => {
    showToast(msg, 'info', duration);
  }, [showToast]);

  const violation = useCallback((msg, duration = 5000) => {
    showToast(msg, 'violation', duration);
  }, [showToast]);

  // ✅ FIX: Return object with stable functions
  // All functions are now wrapped in useCallback, so they won't recreate
  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,    // ✅ Now stable!
    info,
    violation
  };
}
