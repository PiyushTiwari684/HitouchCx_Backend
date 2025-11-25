import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WebCamCheck from "./WebCamCheck";
import AudioCheck from "./AudioCheck";
import apiClient from "../../api/apiClient";
import FullscreenModal from "../shared/FullscreenModal";
import { useFullscreenContext } from "../../context/FullscreenContext";

const WebcamAudioPage = () => {
  const { attemptId, systemCheckId } = useParams(); // Get both from URL params
  const navigate = useNavigate();
  const originalText = "The quick brown fox jumps over the lazy dog"; // Text for audio verification
  const { showModal, setShowModal, setFullscreenRequired } = useFullscreenContext();

  // Debug: Log attemptId
  console.log('WebcamAudioPage - attemptId:', attemptId);
  console.log('WebcamAudioPage - systemCheckId:', systemCheckId);

  const [faceDone, setFaceDone] = useState(false);
  const [audioDone, setAudioDone] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startButtonDisabled, setStartButtonDisabled] = useState(false);
  const [assessmentData, setAssessmentData] = useState(null);

  // Handle success from Webcam (face capture)
  const handleFaceSuccess = () => {
    setFaceDone(true);
    // Optionally feedback/confirmation for user
  };

  // Handle success from AudioCheck
  const handleAudioSuccess = () => {
    setAudioDone(true);
    // Optionally feedback, or proceed next
  };

  // Handle Start button click - Show fullscreen modal
  const handleStartButtonClick = async () => {
    try {
      setIsStarting(true);
      console.log("Fetching assessment data...");
      console.log("Attempt ID:", attemptId);

      // Fetch the attempt to get the assessmentId
      const response = await apiClient.get(`/assessments/attempt/${attemptId}`);

      console.log("API Response:", response);

      if (response.data.success) {
        const { assessmentId } = response.data.data;
        console.log("Assessment ID:", assessmentId);

        // Store assessment data for later navigation
        setAssessmentData({ assessmentId, attemptId });

        // Show fullscreen modal
        setShowModal(true);
      } else {
        console.error('API returned unsuccessful response:', response.data);
        alert('Failed to start assessment. Please try again.');
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      alert(`Failed to start assessment: ${error.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  // Handle fullscreen modal confirm - Navigate to assessment
  const handleFullscreenConfirm = () => {
    if (assessmentData) {
      const { assessmentId, attemptId } = assessmentData;

      // Enable fullscreen requirement for assessment
      setFullscreenRequired(true);

      // Close modal
      setShowModal(false);

      // Navigate to assessment page
      navigate(`/assessment/${assessmentId}/${attemptId}`);
    }
  };

  // Handle fullscreen modal cancel - Disable start button
  const handleFullscreenCancel = () => {
    setShowModal(false);
    setStartButtonDisabled(true);
  };

  // Handle retry after cancel
  const handleRetry = () => {
    setStartButtonDisabled(false);
  };

  // You could add logic to only enable "Proceed" when both checks passed
  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Identity Verification</h1>
      
      <div className="mb-8">
        <WebCamCheck
          attemptId={attemptId}
          onSuccess={handleFaceSuccess}
        />
        {faceDone && (
          <div className="text-green-700 font-medium mt-2">
            Face photo verified!
          </div>
        )}
      </div>

      <div className="mb-8">
        <AudioCheck
          attemptId={attemptId}
          originalText={originalText}
          onSuccess={handleAudioSuccess}
        />
        {audioDone && (
          <div className="text-green-700 font-medium mt-2">
            Audio verified!
          </div>
        )}
      </div>
      
      {(faceDone && audioDone) && (
        <div className="mt-6 space-y-4">
          <div className="p-3 border rounded text-green-800 bg-green-100 font-bold text-center">
            All checks completed! You may proceed.
          </div>

          {/* Start Button or Disabled Message */}
          {startButtonDisabled ? (
            <div className="space-y-3">
              <div className="p-3 border border-red-400 rounded text-red-700 bg-red-50 text-center">
                Fullscreen mode is required to proceed. Click "Retry" to continue.
              </div>
              <button
                onClick={handleRetry}
                className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartButtonClick}
              disabled={isStarting}
              className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isStarting ? 'Loading Assessment...' : 'Start'}
            </button>
          )}
        </div>
      )}

      {/* Fullscreen Modal */}
      <FullscreenModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleFullscreenConfirm}
        onCancel={handleFullscreenCancel}
      />
    </div>
  );
};

export default WebcamAudioPage;
