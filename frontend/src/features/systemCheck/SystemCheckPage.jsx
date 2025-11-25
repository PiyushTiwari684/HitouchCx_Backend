import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import { getDeviceInfo } from '../../utils/deviceInfo'; // Our new utility

// Import our shared components
import StatusIndicator from '../shared/StatusIndicator';
import Button from '../shared/Button';

// A single check item component, updated to show a message
const CheckItem = ({ label, status, onCheck, checkType, loading, message }) => (
  <div className="flex items-center justify-between p-4 border-b">
    <div>
      <span className="text-gray-700">{label}</span>
      {/* This new line displays the message (e.g., "Good (100+ Mbps)") */}
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
    <div className="flex items-center space-x-4">
      <StatusIndicator status={status} />
      {onCheck && (
        <Button
          onClick={() => onCheck(checkType)}
          disabled={loading || status === 'success'}
        >
          {status === 'success' ? 'Granted' : 'Check'}
        </Button>
      )}
    </div>
  </div>
);

// The main page component
const SystemCheckPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { attemptId } = useParams(); // Get attemptId from route params
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checksState, setChecksState] = useState({
    camera: { status: 'pending', message: 'Requires user action' },
    mic: { status: 'pending', message: 'Requires user action' },
    screenRecording: { status: 'pending', message: 'Requires user action' }, // Renamed from screenShare
    rightClick: { status: 'pending', message: '' },
    network: { status: 'pending', message: 'Checking...' },
    vpn: { status: 'pending', message: 'Checking...' },
    
  });

  // --- 1. On-Load Effect: Get Device Info & Run Passive Checks ---
  useEffect(() => {
    // A. Get all device info
    const info = getDeviceInfo();
    setDeviceInfo(info);
    console.log('Device Info:', info);

    // B. Run passive check: Disable Right Click
    const handleRightClick = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleRightClick);
    setChecksState((prev) => ({
      ...prev,
      rightClick: { status: 'success', message: 'Disabled' },
    }));

    // C. Run passive check: Network Speed
    // Mocking a real speed test
    setTimeout(() => {
      setChecksState((prev) => ({
        ...prev,
        network: { status: 'success', message: 'Good (100+ Mbps)' },
      }));
    }, 1000); // Simulate a 1-second check

    // D. Run passive check: VPN
    // Mocking a real VPN check
    setTimeout(() => {
      setChecksState((prev) => ({
        ...prev,
        vpn: { status: 'success', message: 'Not Detected' },
      }));
    }, 500); // Simulate a 0.5-second check

    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener('contextmenu', handleRightClick);
    };
  }, []); // Empty array means this runs only once on mount

  // --- 2. Active Check Handlers ---
  const handlePermissionCheck = async (checkType) => {
    setChecksState((prev) => ({
      ...prev,
      [checkType]: { status: 'loading', message: 'Awaiting permission...' },
    }));

    try {
      let stream;
      if (checkType === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } else if (checkType === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else if (checkType === 'screenRecording') {
        // Changed from screenShare
        stream = await navigator.mediaDevices.getDisplayMedia();
      }

      // Stop tracks immediately, we just needed permission
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      setChecksState((prev) => ({
        ...prev,
        [checkType]: { status: 'success', message: 'Access Granted' },
      }));
    } catch (err) {
      console.error(`Permission denied for ${checkType}:`, err);
      setChecksState((prev) => ({
        ...prev,
        [checkType]: { status: 'error', message: 'Access Denied' },
      }));
    }
  };

  // --- 3. Save & Proceed Logic ---
  const handleSaveAndProceed = async () => {
    setLoading(true);

    const payload = {
      // A. Device Info
      ...deviceInfo,

      // B. Permissions Status
      cameraAccess: checksState.camera.status === 'success',
      microphoneAccess: checksState.mic.status === 'success',
      screenRecordingAccess: checksState.screenRecording.status === 'success', // Renamed

      // C. Device Tests (we'll do these on Page 2, but API expects them)
      // We set them to false, as they haven't been tested yet.
      cameraWorking: false,
      microphoneWorking: false,
      faceDetected: false,
    };

    try {
      // We are *creating* a new system check entry here
      const response = await apiClient.post('/system-checks', payload);
      console.log('System check saved:', response.data);

      // We'll store the ID of this new check to update it on the next page
      const systemCheckId = response.data.data.id;

      // Navigate to Page 2 (Device Tests) - include attemptId in URL
      navigate(`/device-test/${attemptId}/${systemCheckId}`);
    } catch (err) {
      console.error('Failed to save system check:', err);
      // We are not using alert()
      // Instead, we'd set an error state here.
      // For now, we log to console.
    } finally {
      setLoading(false);
    }
  };

  // --- 4. Render Logic ---
  const allChecksPassed = Object.values(checksState).every(
    (check) => check.status === 'success'
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gray-50 border-b">
          {/* Updated Header Text */}
          <h1 className="text-xl font-bold text-gray-800">Permission Checks</h1>
          <button
            onClick={logout}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Logout
          </button>
        </div>

        {/* Checklist */}
        <div className="divide-y">
          <CheckItem
            label="Camera Access"
            status={checksState.camera.status}
            onCheck={handlePermissionCheck}
            checkType="camera"
            loading={checksState.camera.status === 'loading'}
            message={checksState.camera.message}
          />
          <CheckItem
            label="Microphone Access"
            status={checksState.mic.status}
            onCheck={handlePermissionCheck}
            checkType="mic"
            loading={checksState.mic.status === 'loading'}
            message={checksState.mic.message}
          />
          <CheckItem
            label="Screen Recording" // Renamed
            status={checksState.screenRecording.status}
            onCheck={handlePermissionCheck}
            checkType="screenRecording" // Renamed
            loading={checksState.screenRecording.status === 'loading'}
            message={checksState.screenRecording.message}
          />
          <CheckItem
            label="Right-Click Disabled"
            status={checksState.rightClick.status}
            message={checksState.rightClick.message}
          />
          <CheckItem
            label="Network Speed Check"
            status={checksState.network.status}
            message={checksState.network.message}
          />
          <CheckItem
            label="VPN Check"
            status={checksState.vpn.status}
            message={checksState.vpn.message}
          />
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 border-t">
          <Button
            onClick={handleSaveAndProceed}
            disabled={!allChecksPassed || loading}
            className="w-full" // Make button full width
          >
            {loading
              ? 'Saving...'
              : 'All Checks Passed - Save & Proceed to Page 2'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SystemCheckPage;


