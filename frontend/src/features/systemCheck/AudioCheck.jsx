// AudioCheck.jsx

import React, { useState, useRef, useEffect } from "react";
import { uploadAudioRecording } from "../../api/identityVerificationAPI";

const AudioCheck = ({ attemptId, originalText, onSuccess }) => {
  // Native MediaRecorder implementation
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [backendError, setBackendError] = useState("");

  const timerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start browser speech recognition
  const startSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setTranscription(transcript);
    };

    recognition.onend = () => console.log('Speech recognition ended');
    recognition.onerror = (error) => console.error('Speech recognition error:', error);

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // Start Recording
  const handleStart = async () => {
    try {
      console.log('Starting recording with MediaRecorder...');
      setBackendError("");
      setRecordingBlob(null);
      audioChunksRef.current = [];

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio chunk received:', event.data.size, 'bytes');
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, creating blob...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob created:', audioBlob.size, 'bytes');
        setRecordingBlob(audioBlob);

        // Stop all tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start speech recognition
      startSpeechRecognition();

      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setBackendError(`Failed to start recording: ${error.message}`);
    }
  };

  // Stop Recording
  const handleStop = () => {
    console.log('Stopping recording...');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    stopSpeechRecognition();
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    console.log('Recording stopped');
  };

  // Submit Recording
  const handleSubmit = async () => {
    console.log('handleSubmit called');
    console.log('recordingBlob:', recordingBlob);
    console.log('recordingBlob type:', recordingBlob?.type);
    console.log('recordingBlob size:', recordingBlob?.size);

    if (!recordingBlob) {
      setBackendError("No audio recorded! Please record again.");
      return;
    }

    try {
      // Convert blob to File object
      const audioFile = new File([recordingBlob], "audio.webm", {
        type: recordingBlob.type || 'audio/webm',
      });

      console.log('Uploading audio file:', audioFile);

      // Use the API function with authentication
      const result = await uploadAudioRecording(
        attemptId,
        audioFile,
        originalText,
        transcription
      );

      console.log('Upload result:', result);

      if (result.success) {
        onSuccess(result.data); // Notify parent/advance UI
        // Reset state
        setRecordingBlob(null);
        setTranscription("");
        setRecordingTime(0);
        setBackendError("");
        audioChunksRef.current = [];
      } else {
        setBackendError(result.message || "Audio check failed.");
      }
    } catch (error) {
      console.error('Upload error:', error);
      setBackendError(error.message || "Upload error.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="font-bold mb-2">Speech Recording</h2>
      <p>Original Text: <strong>{originalText}</strong></p>
      <div className="flex gap-6 my-3">
        <button
          className={`px-4 py-2 rounded font-semibold ${
            isRecording
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
          }`}
          disabled={isRecording}
          onClick={handleStart}
        >
          Start Recording
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold ${
            !isRecording
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
          }`}
          disabled={!isRecording}
          onClick={handleStop}
        >
          Stop Recording {isRecording && '(Click to stop)'}
        </button>
      </div>
      <p className="text-sm text-gray-600">
        Recording: {isRecording ? 'YES' : 'NO'}
      </p>
      <p>Recording Time: {recordingTime}s</p>
      <div className="my-2">
        <label>Transcription:</label>
        <textarea
          className="w-full border rounded p-2"
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          rows={3}
        />
      </div>

      {recordingBlob && (
        <div className="my-2">
          <p className="text-sm font-semibold text-green-600 mb-1">✓ Recording captured!</p>
          <audio controls src={URL.createObjectURL(recordingBlob)} className="w-full" />
        </div>
      )}

      <button
        className={`px-4 py-2 rounded mt-2 font-semibold ${
          !recordingBlob
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
        }`}
        disabled={!recordingBlob}
        onClick={handleSubmit}
      >
        Submit Recording {recordingBlob && '✓'}
      </button>

      <p className="text-xs text-gray-500 mt-2">
        Recording Blob: {recordingBlob ? `Yes (${recordingBlob.size} bytes)` : 'No'}
      </p>

      {backendError && (
        <div className="text-red-600 font-bold mt-2">{backendError}</div>
      )}
    </div>
  );
};

export default AudioCheck;
