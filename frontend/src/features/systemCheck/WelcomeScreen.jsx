import React, { useState } from 'react';
// We will import PermissionCheck and DeviceTest here later
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SystemCheckPage = () => {
  // --- State ---
  // This state will control which step we are on.
  // Steps: 'welcome', 'permissions', 'deviceTest', 'results'
  const [currentStep, setCurrentStep] = useState('welcome');

  // --- Hooks ---
  const { logout } = useAuth();
  const navigate = useNavigate();

  // --- Handlers ---
  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  // This function will be passed to child components to advance the step
  const goToNextStep = (stepName) => {
    setCurrentStep(stepName);
  };

  // --- Render Logic ---
  // This function decides which component to show based on the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        // Pass the 'goToNextStep' function as a prop
        return <WelcomeStep onProceed={() => goToNextStep('permissions')} />;

      case 'permissions':
        return <PermissionStep onProceed={() => goToNextStep('deviceTest')} onBack={() => goToNextStep('welcome')} />;

      case 'deviceTest':
        return <DeviceTestStep onProceed={() => goToNextStep('results')} onBack={() => goToNextStep('permissions')} />;
      
      // case 'permissions':
      //   return <PermissionCheck onProceed={() => goToNextStep('deviceTest')} />;
      
      // ... other steps ...

      default:
        return <WelcomeStep onProceed={() => goToNextStep('permissions')} />;
    }
  };

// Local welcome step component (avoids importing this file into itself)
const WelcomeStep = ({ onProceed }) => (
  <div className="text-center">
    <h2 className="text-xl font-semibold mb-4">Welcome</h2>
    <p className="mb-6 text-gray-600">Please follow the steps to complete the system check before starting the assessment.</p>
    <button
      onClick={onProceed}
      className="px-4 py-2 bg-blue-600 text-white rounded-md"
    >
      Start checks
    </button>
  </div>
);

const PermissionStep = ({ onProceed, onBack }) => (
  <div className="text-center">
    <h2 className="text-lg font-semibold mb-4">Permissions</h2>
    <p className="mb-4 text-gray-600">Please allow camera and microphone access when prompted.</p>
    <div className="flex justify-center gap-3">
      <button onClick={onBack} className="px-4 py-2 bg-gray-300 rounded-md">Back</button>
      <button onClick={onProceed} className="px-4 py-2 bg-blue-600 text-white rounded-md">Next</button>
    </div>
  </div>
);

const DeviceTestStep = ({ onProceed, onBack }) => (
  <div className="text-center">
    <h2 className="text-lg font-semibold mb-4">Device Test</h2>
    <p className="mb-4 text-gray-600">Testing camera, microphone and system capabilities...</p>
    <div className="flex justify-center gap-3">
      <button onClick={onBack} className="px-4 py-2 bg-gray-300 rounded-md">Back</button>
      <button onClick={onProceed} className="px-4 py-2 bg-blue-600 text-white rounded-md">Finish</button>
    </div>
  </div>
);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex justify-between items-center p-5 bg-gray-50 border-b">
          <h1 className="text-xl font-bold text-gray-800">
            Pre-Assessment System Check
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default SystemCheckPage;
