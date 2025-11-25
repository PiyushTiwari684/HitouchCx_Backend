import { AssemblyAI } from "assemblyai";

// Initialize AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});


export async function transcribeAudio(audioFilePath) {
  try {
    console.log("Starting AssemblyAI transcription...");

    // Upload and transcribe audio file
    const transcript = await client.transcripts.transcribe({
      audio: audioFilePath,
      language_code: "en", // English
      speech_model: "best", // Use best accuracy model
    });

    // Check if transcription was successful
    if (transcript.status === "error") {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    console.log("Transcription complete!");

    return {
      text: transcript.text || "",
      confidence: transcript.confidence || 0,
      duration: transcript.audio_duration || 0,
      words: transcript.words || [], // Word-level timestamps
    };
  } catch (error) {
    throw new Error(`AssemblyAI transcription failed: ${error.message}`);
  }
}


export function isAssemblyAIConfigured() {
  return !!process.env.ASSEMBLYAI_API_KEY;
}
