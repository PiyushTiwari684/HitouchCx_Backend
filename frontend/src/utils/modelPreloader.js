import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as faceapi from '@vladmandic/face-api';

/**
 * ModelPreloader - Singleton service for preloading ML models
 *
 * Usage:
 * - Call preloadModels() from InstructionPage when user clicks "Start Assessment"
 * - Models load in background while user completes other steps
 * - WebCamCheck component checks if models are ready and uses them instantly
 */
class ModelPreloader {
  constructor() {
    this.status = {
      isLoading: false,
      isLoaded: false,
      progress: 0,
      currentStep: '',
      error: null
    };

    this.models = {
      blazeface: null,
      faceapi: {
        tinyFaceDetector: false,
        faceLandmark68Net: false,
        faceRecognitionNet: false
      }
    };

    // Subscribers for progress updates
    this.listeners = new Set();
  }

  /**
   * Subscribe to loading progress updates
   * @param {Function} callback - Called with status updates
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all subscribers of status change
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.status));
  }

  /**
   * Update status and notify listeners
   */
  updateStatus(updates) {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  /**
   * Main preload function - loads all ML models
   * Called from InstructionPage when user clicks "Start Assessment"
   *
   * @returns {Promise<void>}
   */
  async preloadModels() {
    // If already loaded or loading, don't load again
    if (this.status.isLoaded || this.status.isLoading) {
      console.log('[ModelPreloader] Models already loaded/loading');
      return;
    }

    console.log('[ModelPreloader] 🚀 Starting background model loading...');
    this.updateStatus({ isLoading: true, progress: 0, error: null });

    try {
      // Step 1: Initialize TensorFlow.js backend
      this.updateStatus({ currentStep: 'Initializing TensorFlow.js...', progress: 10 });
      await tf.ready();
      console.log('[ModelPreloader] ✅ TensorFlow.js backend ready');

      // Step 2: Load BlazeFace model
      this.updateStatus({ currentStep: 'Loading face detector...', progress: 25 });
      this.models.blazeface = await blazeface.load();
      console.log('[ModelPreloader] ✅ BlazeFace loaded');

      // Step 3: Load face-api.js models from local directory
      const MODEL_PATH = '/models/face-api';

      // Tiny Face Detector (fast, lightweight)
      this.updateStatus({ currentStep: 'Loading face recognition (1/3)...', progress: 40 });
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH);
      this.models.faceapi.tinyFaceDetector = true;
      console.log('[ModelPreloader] ✅ TinyFaceDetector loaded');

      // Face Landmarks (68 facial points)
      this.updateStatus({ currentStep: 'Loading face recognition (2/3)...', progress: 65 });
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH);
      this.models.faceapi.faceLandmark68Net = true;
      console.log('[ModelPreloader] ✅ FaceLandmark68Net loaded');

      // Face Recognition (128-d descriptor)
      this.updateStatus({ currentStep: 'Loading face recognition (3/3)...', progress: 90 });
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH);
      this.models.faceapi.faceRecognitionNet = true;
      console.log('[ModelPreloader] ✅ FaceRecognitionNet loaded');

      // Complete
      this.updateStatus({
        currentStep: 'Ready!',
        progress: 100,
        isLoading: false,
        isLoaded: true
      });
      console.log('[ModelPreloader] 🎉 All models loaded successfully!');

    } catch (error) {
      console.error('[ModelPreloader] ❌ Error loading models:', error);
      this.updateStatus({
        isLoading: false,
        isLoaded: false,
        error: error.message,
        currentStep: 'Failed to load models'
      });
      throw error;
    }
  }

  /**
   * Get current loading status
   * @returns {Object} Status object
   */
  getStatus() {
    return { ...this.status };
  }

  /**
   * Get loaded models (for services to use)
   * @returns {Object} Models object
   */
  getModels() {
    return this.models;
  }

  /**
   * Check if specific model is loaded
   * @param {string} modelName - Name of model to check
   * @returns {boolean}
   */
  isModelLoaded(modelName) {
    if (modelName === 'blazeface') {
      return !!this.models.blazeface;
    }
    return this.models.faceapi[modelName] || false;
  }

  /**
   * Reset and clear all models (for cleanup/testing)
   */
  reset() {
    this.status = {
      isLoading: false,
      isLoaded: false,
      progress: 0,
      currentStep: '',
      error: null
    };

    if (this.models.blazeface) {
      this.models.blazeface = null;
    }

    this.models.faceapi = {
      tinyFaceDetector: false,
      faceLandmark68Net: false,
      faceRecognitionNet: false
    };

    console.log('[ModelPreloader] Reset complete');
  }
}

// Export singleton instance
export default new ModelPreloader();
