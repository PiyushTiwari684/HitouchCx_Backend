import { useState, useEffect } from 'react';
import { UAParser } from 'ua-parser-js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import modelPreloader from '../../utils/modelPreloader';

export default function InstructionPage() {
  const navigate = useNavigate();
  useAuth();

  // States
  const [loading, setLoading] = useState(true);
  const [deviceValidation, setDeviceValidation] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [startingAssessment, setStartingAssessment] = useState(false);

  // 1. COLLECT DEVICE INFO
  const getDeviceInfo = () => {
    const parser = new UAParser();
    const result = parser.getResult();

    return {
      browserName: result.browser.name || 'Unknown',
      browserVersion: result.browser.version || 'Unknown',
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      deviceType: result.device.type || 'desktop',
      fullscreenSupported: !!document.fullscreenEnabled ||
                           !!document.webkitFullscreenEnabled ||
                           !!document.mozFullScreenEnabled
    };
  };

  // 2. VALIDATE DEVICE ON PAGE LOAD
  useEffect(() => {
    const validateDevice = async () => {
      try {
        setLoading(true);
        const deviceInfo = getDeviceInfo();

        const response = await apiClient.post('/instructions/validate-device', deviceInfo);

        if (response.data.success) {
          setDeviceValidation(response.data.data);
          setValidationError(null);
        }
      } catch (error) {
        console.error('Device validation error:', error);
        setValidationError(error.response?.data?.message || 'Device validation failed');
      } finally {
        setLoading(false);
      }
    };

    validateDevice();
  }, []);

  // 3. HANDLE START ASSESSMENT
  const handleStartAssessment = async () => {
    try {
      setStartingAssessment(true);
      setValidationError(null);

      // 🚀 TRIGGER MODEL PRELOADING IN BACKGROUND
      // Models will load while user completes system checks
      // By the time they reach webcam page, models will be ready!
      modelPreloader.preloadModels().catch(err => {
        console.warn('Model preload failed (will retry later):', err);
      });

      // Step 1: Generate the assessment first
      const generateResponse = await apiClient.post('/assessments/generate', {
        assessmentType: 'LANGUAGE' // You can make this dynamic based on test type
      });

      if (!generateResponse.data.success) {
        throw new Error('Failed to generate assessment');
      }

      const { attemptId } = generateResponse.data.data;

      // Step 2: Navigate to system check page with attemptId
      // Models continue loading in background during this navigation
      navigate(`/system-check/${attemptId}`);
    } catch (error) {
      console.error('Start assessment error:', error);
      setValidationError(error.response?.data?.message || 'Failed to start assessment');
    } finally {
      setStartingAssessment(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-900 font-sans">Validating your device...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold font-sans mb-2">Assessment Instructions</h1>
          <p className="text-lg opacity-90 font-sans">Please read the instructions carefully before starting</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Assessment Details Card */}
        <div className="bg-white rounded shadow p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 font-sans">📋 Assessment Details</h2>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-gray-500 text-sm font-sans mb-2">Duration</p>
              <p className="text-black text-2xl font-semibold font-sans">90 minutes</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-sans mb-2">Total Questions</p>
              <p className="text-black text-2xl font-semibold font-sans">15-20</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-sans mb-2">Passing Score</p>
              <p className="text-black text-2xl font-semibold font-sans">70%</p>
            </div>
          </div>
        </div>

        {/* System Requirements Card */}
        <div className="bg-white rounded shadow p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 font-sans">⚙️ System Requirements</h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="font-semibold text-black font-sans mb-3">Supported Browsers:</p>
              <ul className="space-y-2">
                {['Google Chrome', 'Mozilla Firefox', 'Microsoft Edge', 'Safari'].map((browser) => (
                  <li key={browser} className="text-gray-900 font-sans">✓ {browser}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-black font-sans mb-3">Device Requirements:</p>
              <ul className="space-y-2">
                <li className="text-gray-900 font-sans">✓ Desktop/Laptop only</li>
                <li className="text-gray-900 font-sans">✓ Minimum screen: 1024x768</li>
                <li className="text-gray-900 font-sans">✓ Fullscreen support</li>
                <li className="text-gray-900 font-sans">✓ Stable internet</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Your Device Status Card */}
        <div className={`bg-white rounded shadow p-8 mb-8 border-l-4 ${
          deviceValidation?.isValid ? 'border-l-green-500' : 'border-l-red-500'
        }`}>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 font-sans">✅ Your Device Status</h2>

          {deviceValidation && (
            <div className="space-y-4">
              {/* Browser Check */}
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  deviceValidation.validations.browser.valid ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {deviceValidation.validations.browser.valid ? '✓' : '✕'}
                </div>
                <div>
                  <p className="font-semibold text-black font-sans">Browser</p>
                  <p className="text-gray-500 text-sm font-sans">{deviceValidation.validations.browser.message}</p>
                </div>
              </div>

              {/* Screen Size Check */}
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  deviceValidation.validations.screenSize.valid ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {deviceValidation.validations.screenSize.valid ? '✓' : '✕'}
                </div>
                <div>
                  <p className="font-semibold text-black font-sans">Screen Size</p>
                  <p className="text-gray-500 text-sm font-sans">{deviceValidation.validations.screenSize.message}</p>
                </div>
              </div>

              {/* Device Type Check */}
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  deviceValidation.validations.deviceType.valid ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {deviceValidation.validations.deviceType.valid ? '✓' : '✕'}
                </div>
                <div>
                  <p className="font-semibold text-black font-sans">Device Type</p>
                  <p className="text-gray-500 text-sm font-sans">{deviceValidation.validations.deviceType.message}</p>
                </div>
              </div>

              {/* Fullscreen Check */}
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  deviceValidation.validations.fullscreen.valid ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {deviceValidation.validations.fullscreen.valid ? '✓' : '✕'}
                </div>
                <div>
                  <p className="font-semibold text-black font-sans">Fullscreen Support</p>
                  <p className="text-gray-500 text-sm font-sans">{deviceValidation.validations.fullscreen.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Important Instructions Card */}
        <div className="bg-white rounded shadow p-8 mb-8 border-l-4 border-l-blue-500">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 font-sans">📝 Important Instructions</h2>

          <ul className="space-y-3">
            <li className="text-gray-900 font-sans">• Ensure you are in a quiet environment</li>
            <li className="text-gray-900 font-sans">• Stable internet connection is required throughout the test</li>
            <li className="text-gray-900 font-sans">• Disable all browser extensions before starting</li>
            <li className="text-gray-900 font-sans">• Close all other applications and browser tabs</li>
            <li className="text-gray-900 font-sans">• Webcam and microphone must be functional and permitted</li>
            <li className="text-gray-900 font-sans">• The test will automatically submit if you exit fullscreen mode</li>
          </ul>
        </div>

        {/* Error Message */}
        {validationError && (
          <div className="bg-red-100 text-red-900 p-4 rounded mb-8 font-sans">
            <p className="font-semibold mb-2">⚠️ Error</p>
            <p>{validationError}</p>
          </div>
        )}

        {/* Button Section */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={handleStartAssessment}
            disabled={!deviceValidation?.isValid || startingAssessment}
            className={`px-8 py-3 rounded font-semibold font-sans text-white transition-all ${
              deviceValidation?.isValid
                ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            } ${startingAssessment ? 'opacity-70' : 'opacity-100'}`}
          >
            {startingAssessment ? 'Starting Assessment...' : 'Start Assessment'}
          </button>
        </div>

        {/* Error Message Below Button */}
        {!deviceValidation?.isValid && !loading && (
          <div className="text-center text-red-500 text-sm font-sans">
            <p>⚠️ Please login with your PC to continue</p>
            {deviceValidation?.errors && deviceValidation.errors.length > 0 && (
              <ul className="mt-2 space-y-1">
                {deviceValidation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
