import groq from "../utils/groq.client.js";
import fs from "fs";

/**
 * Transcribe audio using Groq's FREE Whisper API
 * This is a 100% FREE alternative to AssemblyAI!
 *
 * @param {string} audioFilePath - Path to audio file
 * @returns {Promise<Object>} Transcription result
 */
export async function transcribeAudio(audioFilePath) {
  try {
    console.log("Starting Groq Whisper transcription (FREE)...");

    // Read the audio file
    const audioFile = fs.createReadStream(audioFilePath);

    // Transcribe using Groq's Whisper API (FREE!)
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3", // FREE Whisper model on Groq
      language: "en", // English
      response_format: "verbose_json", // Get detailed info
      temperature: 0.0, // More deterministic
    });

    console.log("Groq Whisper transcription complete!");

    return {
      text: transcription.text || "",
      confidence: 1.0, // Whisper doesn't provide confidence, assume high
      duration: transcription.duration || 0,
      words: transcription.words || [], // Word-level timestamps
      language: transcription.language || "en",
    };
  } catch (error) {
    console.error("Groq Whisper transcription error:", error);
    throw new Error(`Groq transcription failed: ${error.message}`);
  }
}

/**
 * Check if Groq transcription is properly configured
 */
export function isGroqTranscriptionConfigured() {
  return !!process.env.GROQ_API_KEY;
}
