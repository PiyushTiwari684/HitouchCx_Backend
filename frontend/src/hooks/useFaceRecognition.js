import { useState, useCallback } from 'react';
import faceRecognitionService from '../utils/faceRecognitionService';

/**
 * useFaceRecognition Hook
 *
 * Face descriptor extraction and image validation using face-api.js
 *
 * @returns {Object} Recognition functions and state
 */
export function useFaceRecognition() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Extract face descriptor from captured image
   * @param {string|HTMLImageElement} imageData - Base64 image or image element
   * @returns {Promise<Float32Array|null>} Face descriptor or null
   */
  const extractDescriptor = useCallback(async (imageData) => {
    setIsProcessing(true);
    setError(null);

    try {
      const descriptor = await faceRecognitionService.extractDescriptor(imageData);

      if (!descriptor) {
        setError('Could not extract face descriptor. Please ensure face is clearly visible.');
        return null;
      }

      console.log('[useFaceRecognition] Descriptor extracted successfully');
      return descriptor;
    } catch (err) {
      console.error('[useFaceRecognition] Error extracting descriptor:', err);
      setError(err.message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Validate captured image has a clear face
   * @param {string|HTMLImageElement} imageData - Base64 image or image element
   * @returns {Promise<Object>} Validation result
   */
  const validateImage = useCallback(async (imageData) => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await faceRecognitionService.validateImage(imageData);

      if (!result.isValid) {
        setError(result.message);
      }

      return result;
    } catch (err) {
      console.error('[useFaceRecognition] Error validating image:', err);
      const errorResult = {
        isValid: false,
        faceCount: 0,
        message: err.message || 'Error validating image',
        error: err.message
      };
      setError(err.message);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Compare two face descriptors
   * @param {Float32Array} descriptor1 - First descriptor
   * @param {Float32Array} descriptor2 - Second descriptor
   * @returns {Object} Comparison result
   */
  const compareDescriptors = useCallback((descriptor1, descriptor2) => {
    try {
      const result = faceRecognitionService.compareDescriptors(descriptor1, descriptor2);

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      console.error('[useFaceRecognition] Error comparing descriptors:', err);
      setError(err.message);
      return {
        distance: 1,
        isSamePerson: false,
        similarity: 0,
        error: err.message
      };
    }
  }, []);

  /**
   * Convert descriptor to array for JSON serialization
   * @param {Float32Array} descriptor - Face descriptor
   * @returns {Array<number>}
   */
  const descriptorToArray = useCallback((descriptor) => {
    return faceRecognitionService.descriptorToArray(descriptor);
  }, []);

  /**
   * Convert array back to Float32Array descriptor
   * @param {Array<number>} array - Descriptor array
   * @returns {Float32Array}
   */
  const arrayToDescriptor = useCallback((array) => {
    return faceRecognitionService.arrayToDescriptor(array);
  }, []);

  return {
    isProcessing,
    error,
    extractDescriptor,
    validateImage,
    compareDescriptors,
    descriptorToArray,
    arrayToDescriptor
  };
}
