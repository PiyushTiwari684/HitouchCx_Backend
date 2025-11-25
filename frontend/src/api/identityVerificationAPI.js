import apiClient from "./apiClient.js";


// Face capture api
export async function uploadFaceCapture(attemptId, imageFile, faceDescriptor = null) {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    // candidateId is now extracted from JWT token on backend
    formData.append("faceImage", imageFile);

    // Add face descriptor if available (for live face comparison during assessment)
    if (faceDescriptor && Array.isArray(faceDescriptor)) {
      formData.append("faceDescriptor", JSON.stringify(faceDescriptor));
    }

    // Make API call
    const response = await apiClient.post(
      `/identity-verification/${attemptId}/face-capture`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Face capture upload failed:", error);
    throw new Error(
      error.response?.data?.message || "Failed to upload face image"
    );
  }
}

// Audio recording api

export async function uploadAudioRecording(
  attemptId,
  audioFile,
  originalText,
  transcription = ""
) {
  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    // candidateId is now extracted from JWT token on backend
    formData.append("audioFile", audioFile);
    formData.append("originalText", originalText);
    if (transcription) {
      formData.append("transcription", transcription);
    }

    // Make API call
    const response = await apiClient.post(
      `/identity-verification/${attemptId}/audio-recording`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Audio recording upload failed:", error);
    throw new Error(
      error.response?.data?.message || "Failed to upload audio recording"
    );
  }
}

/**
 * Retry audio recording (wrapper around uploadAudioRecording)
 * @param {string} attemptId - Assessment attempt ID
 * @param {string} candidateId - Candidate ID
 * @param {File} audioFile - New audio file
 * @param {string} originalText - Original text
 * @param {string} transcription - New transcription
 * @returns {Promise<object>}
 */
export async function retryAudioRecording(
  attemptId,
  audioFile,
  originalText,
  transcription
) {
  return uploadAudioRecording(
    attemptId,
    audioFile,
    originalText,
    transcription
  );
}

// ============================================================
// LIVE FACE COMPARISON APIs
// ============================================================

/**
 * Get reference face descriptor for live comparison during assessment
 * @param {string} attemptId - Assessment attempt ID
 * @returns {Promise<object>} - { descriptor: Array[128], faceImagePath: string, qualityScore: number }
 */
export async function getReferenceDescriptor(attemptId) {
  try {
    const response = await apiClient.get(
      `/identity-verification/${attemptId}/descriptor`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to get reference descriptor:", error);
    throw new Error(
      error.response?.data?.message || "Failed to retrieve reference face descriptor"
    );
  }
}

/**
 * Log face comparison result during assessment
 * @param {string} attemptId - Assessment attempt ID
 * @param {object} comparisonData - { matchScore, matched, faceDetected, faceCount, snapshotBase64 }
 * @returns {Promise<object>}
 */
export async function logFaceComparison(attemptId, comparisonData) {
  try {
    const response = await apiClient.post(
      `/identity-verification/${attemptId}/comparison-log`,
      comparisonData
    );
    return response.data;
  } catch (error) {
    console.error("Failed to log face comparison:", error);
    // Don't throw error - comparison logging is non-critical
    // Return null to indicate failure without breaking the assessment
    return null;
  }
}
