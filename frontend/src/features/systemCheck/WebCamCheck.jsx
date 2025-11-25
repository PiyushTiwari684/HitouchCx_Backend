import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { uploadFaceCapture } from "../../api/identityVerificationAPI";
import { useFaceDetection } from "../../hooks/useFaceDetection";
import { useFaceRecognition } from "../../hooks/useFaceRecognition";
import modelPreloader from "../../utils/modelPreloader";
import { getGuideBoxDimensions } from "../../utils/validationHelpers";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "user",
};

const WebcamCapture = ({ attemptId, onSuccess }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [descriptor, setDescriptor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [imageQuality, setImageQuality] = useState(null);

  // Model loading state
  const [modelsReady, setModelsReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(null);

  // Real-time face detection (BlazeFace)
  const { validationStatus, faces } = useFaceDetection(webcamRef, {
    enabled: modelsReady && !imgSrc,
    interval: 100,
  });

  // Face recognition (face-api.js)
  const {
    extractDescriptor,
    validateImage,
    descriptorToArray,
    isProcessing: isRecognitionProcessing,
  } = useFaceRecognition();

  // Check if models are preloaded
  useEffect(() => {
    const checkModels = () => {
      const status = modelPreloader.getStatus();

      if (status.isLoaded) {
        console.log('[WebCamCheck] Models already loaded!');
        setModelsReady(true);
        setLoadingProgress(null);
      } else if (status.isLoading) {
        console.log('[WebCamCheck] Models loading in background...');
        setLoadingProgress(status);
      } else {
        console.log('[WebCamCheck] Models not loaded, starting now...');
        modelPreloader.preloadModels();
      }
    };

    checkModels();

    // Subscribe to loading progress
    const unsubscribe = modelPreloader.subscribe((status) => {
      if (status.isLoaded) {
        setModelsReady(true);
        setLoadingProgress(null);
      } else {
        setLoadingProgress(status);
      }
    });

    return unsubscribe;
  }, []);

  // Draw guide overlay on canvas
  useEffect(() => {
    if (!canvasRef.current || !webcamRef.current || imgSrc) return;

    const canvas = canvasRef.current;
    const video = webcamRef.current.video;

    if (!video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || videoConstraints.width;
    canvas.height = video.videoHeight || videoConstraints.height;

    const drawOverlay = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw guide box
      const guideBox = getGuideBoxDimensions(canvas.width, canvas.height);

      // Determine guide box color based on validation status
      let guideColor = '#EF4444'; // Red (default)
      if (validationStatus?.isValid) {
        guideColor = '#10B981'; // Green
      } else if (faces && faces.length === 1) {
        guideColor = '#F59E0B'; // Yellow (face detected but not valid)
      }

      // Draw guide box with dotted border
      ctx.strokeStyle = guideColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(guideBox.x, guideBox.y, guideBox.width, guideBox.height);
      ctx.setLineDash([]);

      // Draw detected face boxes
      if (faces && faces.length > 0) {
        faces.forEach(face => {
          const x = face.topLeft[0];
          const y = face.topLeft[1];
          const width = face.bottomRight[0] - face.topLeft[0];
          const height = face.bottomRight[1] - face.topLeft[1];

          // Draw face bounding box
          ctx.strokeStyle = validationStatus?.isValid ? '#10B981' : '#F59E0B';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          // Draw facial landmarks
          if (face.landmarks) {
            ctx.fillStyle = validationStatus?.isValid ? '#10B981' : '#F59E0B';
            face.landmarks.forEach(landmark => {
              ctx.beginPath();
              ctx.arc(landmark[0], landmark[1], 3, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
        });
      }
    };

    const intervalId = setInterval(drawOverlay, 100);
    return () => clearInterval(intervalId);
  }, [faces, validationStatus, imgSrc]);

  // Called when user clicks "Capture"
  const capture = async () => {
    if (!validationStatus?.isValid) {
      setBackendError("Please position your face correctly before capturing.");
      return;
    }

    if (webcamRef.current) {
      const src = webcamRef.current.getScreenshot();
      setImgSrc(src);
      setBackendError("");
      setImageQuality(null);

      // Extract face descriptor for backend
      console.log('[WebCamCheck] Extracting face descriptor...');
      const desc = await extractDescriptor(src);

      if (desc) {
        setDescriptor(desc);
        console.log('[WebCamCheck] Descriptor extracted successfully');
      } else {
        console.warn('[WebCamCheck] Failed to extract descriptor');
      }
    }
  };

  // Convert base64 image to a File/blob for upload
  function dataUrlToFile(dataUrl, filename) {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  // Send to backend
  const handleSubmit = async () => {
    if (!imgSrc) {
      setBackendError("No photo captured! Please take a photo.");
      return;
    }

    setUploading(true);
    setBackendError("");
    setImageQuality(null);

    try {
      // Validate captured image has a face
      console.log('[WebCamCheck] Validating captured image...');
      const validation = await validateImage(imgSrc);

      if (!validation.isValid) {
        setBackendError(validation.message);
        setUploading(false);
        return;
      }

      console.log('[WebCamCheck] Image validation passed');

      // Re-extract descriptor from captured image to ensure it's fresh
      console.log('[WebCamCheck] Re-extracting descriptor for upload...');
      const freshDescriptor = await extractDescriptor(imgSrc);

      // Convert base64 to File and upload
      const imageFile = dataUrlToFile(imgSrc, "face.jpg");

      // Convert descriptor to array for backend storage
      const descriptorArray = freshDescriptor ? descriptorToArray(freshDescriptor) : null;

      if (descriptorArray) {
        console.log('[WebCamCheck] Sending face descriptor to backend:', descriptorArray.slice(0, 5), '...');
      } else {
        console.warn('[WebCamCheck] No descriptor available - face comparison may not work during assessment');
      }

      const result = await uploadFaceCapture(attemptId, imageFile, descriptorArray);

      setUploading(false);
      if (result.success) {
        setImageQuality(result.data.imageQuality);
        setBackendError("");
        if (onSuccess) onSuccess(result.data);
      } else {
        setBackendError(result.message || "Photo upload failed.");
        setImageQuality(null);
      }
    } catch (err) {
      setUploading(false);
      setBackendError(err.message || "Upload failed.");
    }
  };

  const handleRetake = () => {
    setImgSrc(null);
    setDescriptor(null);
    setImageQuality(null);
    setBackendError("");
  };

  // Show loading state while models are loading
  if (!modelsReady && loadingProgress) {
    return (
      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Preparing Face Detection...</h2>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
          <div
            className="bg-blue-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress.progress}%` }}
          />
        </div>

        <p className="text-sm text-gray-600 mb-2">{loadingProgress.currentStep}</p>
        <p className="text-xs text-gray-500">This usually takes a few seconds...</p>

        {loadingProgress.error && (
          <div className="mt-3 p-3 bg-red-100 text-red-700 rounded">
            <p className="font-semibold">Error loading models:</p>
            <p className="text-sm">{loadingProgress.error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="font-bold mb-2 text-xl">Webcam Face Capture</h2>
      <p className="text-sm text-gray-600 mb-4">
        Position your face within the guide box for best results
      </p>

      {!imgSrc ? (
        <div>
          {/* Video container with overlay */}
          <div className="relative inline-block">
            <Webcam
              audio={false}
              height={videoConstraints.height}
              width={videoConstraints.width}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className={`rounded shadow border-4 transition-colors duration-300 ${
                validationStatus?.isValid
                  ? 'border-green-500'
                  : 'border-red-500'
              }`}
            />

            {/* Canvas overlay for guide box and face detection boxes */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ width: videoConstraints.width, height: videoConstraints.height }}
            />
          </div>

          {/* Status message */}
          {validationStatus && (
            <div
              className={`mt-3 p-3 rounded flex items-center gap-2 ${
                validationStatus.isValid
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <span className="text-2xl">{validationStatus.icon}</span>
              <span className="font-medium">{validationStatus.message}</span>
            </div>
          )}

          {/* Capture button */}
          <button
            className={`px-6 py-3 rounded mt-4 font-semibold transition-all ${
              validationStatus?.isValid
                ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
            onClick={capture}
            disabled={!validationStatus?.isValid}
            title={
              !validationStatus?.isValid
                ? 'Position your face correctly to enable capture'
                : 'Capture photo'
            }
          >
            {isRecognitionProcessing ? 'Processing...' : 'Capture Photo'}
          </button>
        </div>
      ) : (
        <div>
          <img src={imgSrc} alt="Captured" className="rounded shadow mb-3 border-2 border-gray-300" />

          {imageQuality && (
            <div className="mb-3 p-3 bg-blue-50 rounded">
              <p className="font-semibold mb-1">Image Quality:</p>
              <p className="text-sm"><b>Sharpness:</b> {imageQuality.sharpness}</p>
              <p className="text-sm"><b>Quality:</b> {imageQuality.isSharp ? 'Sharp ✓' : 'Blurry ✗'}</p>
              <p className="text-sm"><b>Dimensions:</b> {imageQuality.dimensions}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Submit Photo'}
            </button>
            <button
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded font-semibold transition-colors"
              onClick={handleRetake}
              disabled={uploading}
            >
              Retake
            </button>
          </div>
        </div>
      )}

      {backendError && (
        <div className="text-red-600 font-bold mt-3 p-3 bg-red-50 rounded">
          {backendError}
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
