import * as faceapi from '@vladmandic/face-api';
import modelPreloader from './modelPreloader';

/**
 * Face Recognition Service - Face descriptor extraction and comparison
 *
 * Uses face-api.js for:
 * - Extracting face descriptors (128-d vectors)
 * - Comparing faces for identity verification
 * - Validating captured images
 */
class FaceRecognitionService {
  constructor() {
    this.isReady = false;
  }
  
  
  async ensureModelsLoaded() {
    const status = modelPreloader.getStatus();

    if (!status.isLoaded) {
      console.log('[FaceRecognitionService] Models not loaded, loading now...');
      await modelPreloader.preloadModels();
    }

    this.isReady = true;
  }


  async extractDescriptor(input) {
    try {
      await this.ensureModelsLoaded();

      // Convert base64 to image if needed
      let imageElement = input;
      if (typeof input === 'string' && input.startsWith('data:image')) {
        imageElement = await this.base64ToImage(input);
      }

      // Detect single face with landmarks and descriptor
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.warn('[FaceRecognitionService] No face detected for descriptor extraction');
        return null;
      }

      console.log('[FaceRecognitionService] Face descriptor extracted successfully');
      return detection.descriptor; // Float32Array[128]
    } catch (error) {
      console.error('[FaceRecognitionService] Error extracting descriptor:', error);
      return null;
    }
  }

  /**
   * Validate captured image has a clear face
   * @param {HTMLImageElement|string} imageData - Image element or base64 string
   * @returns {Promise<Object>} Validation result
   */
  async validateImage(imageData) {
    try {
      await this.ensureModelsLoaded();

      // Convert base64 to image if needed
      let imageElement = imageData;
      if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
        imageElement = await this.base64ToImage(imageData);
      }

      // Detect all faces
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const faceCount = detections.length;

      if (faceCount === 0) {
        return {
          isValid: false,
          faceCount: 0,
          message: 'No face detected in captured image. Please retake.',
          detections: null
        };
      }

      if (faceCount > 1) {
        return {
          isValid: false,
          faceCount,
          message: `Multiple faces detected (${faceCount}). Please ensure only you are visible and retake.`,
          detections
        };
      }

      // Single face detected - check quality
      const detection = detections[0];
      const score = detection.detection.score;

      if (score < 0.5) {
        return {
          isValid: false,
          faceCount: 1,
          message: 'Face detection confidence too low. Please ensure good lighting and retake.',
          detections
        };
      }

      return {
        isValid: true,
        faceCount: 1,
        message: 'Face detected successfully.',
        detections,
        confidence: score
      };
    } catch (error) {
      console.error('[FaceRecognitionService] Error validating image:', error);
      return {
        isValid: false,
        faceCount: 0,
        message: 'Error validating image. Please try again.',
        error: error.message
      };
    }
  }

  /**
   * Compare two face descriptors
   * @param {Float32Array} descriptor1 - First face descriptor
   * @param {Float32Array} descriptor2 - Second face descriptor
   * @returns {Object} Comparison result { distance, isSamePerson, similarity }
   */
  compareDescriptors(descriptor1, descriptor2) {
    if (!descriptor1 || !descriptor2) {
      console.error('[FaceRecognitionService] Invalid descriptors for comparison');
      return {
        distance: 1,
        isSamePerson: false,
        similarity: 0,
        error: 'Invalid descriptors'
      };
    }

    try {
      // Calculate Euclidean distance
      const distance = faceapi.euclideanDistance(descriptor1, descriptor2);

      // Threshold: < 0.6 is considered same person
      // This is the industry standard threshold
      const isSamePerson = distance < 0.6;

      // Convert distance to similarity percentage (inverse)
      const similarity = Math.max(0, (1 - distance) * 100);

      return {
        distance,
        isSamePerson,
        similarity: Math.round(similarity * 100) / 100, // Round to 2 decimals
        threshold: 0.6
      };
    } catch (error) {
      console.error('[FaceRecognitionService] Error comparing descriptors:', error);
      return {
        distance: 1,
        isSamePerson: false,
        similarity: 0,
        error: error.message
      };
    }
  }

  /**
   * Convert base64 image to HTMLImageElement
   * @param {string} base64 - Base64 image string
   * @returns {Promise<HTMLImageElement>}
   */
  base64ToImage(base64) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = base64;
    });
  }

  /**
   * Convert Float32Array descriptor to regular array (for JSON serialization)
   * @param {Float32Array} descriptor - Face descriptor
   * @returns {Array<number>}
   */
  descriptorToArray(descriptor) {
    return Array.from(descriptor);
  }

  /**
   * Convert regular array back to Float32Array
   * @param {Array<number>} array - Descriptor array
   * @returns {Float32Array}
   */
  arrayToDescriptor(array) {
    return new Float32Array(array);
  }

  /**
   * Check if service is ready
   * @returns {boolean}
   */
  isServiceReady() {
    return this.isReady && modelPreloader.getStatus().isLoaded;
  }
}

// Export singleton instance
export default new FaceRecognitionService();
