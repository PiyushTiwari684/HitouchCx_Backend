import modelPreloader from './modelPreloader';

/**
 * BlazeFace Service - Fast face detection
 *
 * Wrapper around BlazeFace model for real-time face detection
 * Uses preloaded model from modelPreloader for instant availability
 */
class BlazeFaceService {
  constructor() {
    this.model = null;
  }

  /**
   * Get BlazeFace model (from preloader or load fresh)
   * @returns {Promise<Object>} BlazeFace model
   */
  async getModel() {
    // Check if model is already preloaded
    const preloadedModels = modelPreloader.getModels();
    if (preloadedModels.blazeface) {
      console.log('[BlazeFaceService] Using preloaded model');
      this.model = preloadedModels.blazeface;
      return this.model;
    }

    // If not preloaded, trigger preload and wait
    console.log('[BlazeFaceService] Model not preloaded, loading now...');
    await modelPreloader.preloadModels();
    const models = modelPreloader.getModels();
    this.model = models.blazeface;
    return this.model;
  }

  /**
   * Detect faces in video or image element
   * @param {HTMLVideoElement|HTMLImageElement} input - Video or image element
   * @param {boolean} returnTensors - Return tensors (default false)
   * @returns {Promise<Array>} Array of detected faces
   *
   * Each face object contains:
   * - topLeft: [x, y]
   * - bottomRight: [x, y]
   * - landmarks: Array of 6 facial landmarks [x, y]
   *   [0] right eye, [1] left eye, [2] nose,
   *   [3] mouth, [4] right ear, [5] left ear
   * - probability: confidence score (0-1)
   */
  async detectFaces(input, returnTensors = false) {
    try {
      if (!this.model) {
        await this.getModel();
      }

      // Ensure input element is ready
      if (input instanceof HTMLVideoElement) {
        if (input.readyState !== 4) {
          console.warn('[BlazeFaceService] Video not ready');
          return [];
        }
      }

      // Run detection
      const predictions = await this.model.estimateFaces(input, returnTensors);

      return predictions || [];
    } catch (error) {
      console.error('[BlazeFaceService] Detection error:', error);
      return [];
    }
  }

  /**
   * Check if model is ready
   * @returns {boolean}
   */
  isReady() {
    return !!this.model || modelPreloader.isModelLoaded('blazeface');
  }

  /**
   * Dispose model and free memory
   */
  dispose() {
    if (this.model) {
      // BlazeFace doesn't have a dispose method, but we can clear reference
      this.model = null;
      console.log('[BlazeFaceService] Model reference cleared');
    }
  }
}

// Export singleton instance
export default new BlazeFaceService();
