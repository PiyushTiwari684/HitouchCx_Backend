import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Audio Processor Utility
 * Compresses large audio files using FFmpeg
 */

/**
 * Compress audio file
 * @param {string} inputPath - Path to original audio file
 * @param {string} outputPath - Path to save compressed audio
 * @returns {Promise<object>} - { success: boolean, outputPath: string, originalSize: number, compressedSize: number }
 */
export async function compressAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Get original file size
    const originalSize = fs.statSync(inputPath).size;

    ffmpeg(inputPath)
      .audioCodec("libmp3lame") // Use MP3 codec
      .audioBitrate(64) // 64 kbps (good for speech)
      .audioChannels(1) // Convert to mono (speech doesn't need stereo)
      .audioFrequency(16000) // 16kHz sample rate (sufficient for speech)
      .toFormat("mp3") // Convert to MP3
      .on("start", (commandLine) => {
        console.log("FFmpeg command:", commandLine);
      })
      .on("progress", (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on("end", () => {
        // Get compressed file size
        const compressedSize = fs.statSync(outputPath).size;
        const compressionRatio = (
          (1 - compressedSize / originalSize) *
          100
        ).toFixed(2);

        console.log(`Compression complete! Reduced by ${compressionRatio}%`);

        resolve({
          success: true,
          outputPath,
          originalSize,
          compressedSize,
          compressionRatio: parseFloat(compressionRatio),
        });
      })
      .on("error", (error) => {
        reject(new Error(`Audio compression failed: ${error.message}`));
      })
      .save(outputPath);
  });
}

/**
 * Check if audio file needs compression
 * @param {string} filePath - Path to audio file
 * @param {number} threshold - Size threshold in bytes (default: 5MB)
 * @returns {boolean} - True if file needs compression
 */
export function needsCompression(filePath, threshold = 5 * 1024 * 1024) {
  const fileSize = fs.statSync(filePath).size;
  return fileSize > threshold;
}

/**
 * Process audio file (compress if needed)
 * @param {string} inputPath - Path to original audio file
 * @returns {Promise<object>} - { compressed: boolean, filePath: string, size: number }
 */
export async function processAudio(inputPath) {
  try {
    const fileSize = fs.statSync(inputPath).size;

    // Check if compression is needed (> 5MB)
    if (!needsCompression(inputPath)) {
      console.log(
        `File size ${(fileSize / 1024 / 1024).toFixed(
          2
        )}MB - No compression needed`
      );
      return {
        compressed: false,
        filePath: inputPath,
        size: fileSize,
      };
    }

    // Compression needed
    console.log(
      `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB - Compressing...`
    );

    // Generate output path
    const parsedPath = path.parse(inputPath);
    const outputPath = path.join(
      parsedPath.dir,
      `${parsedPath.name}-compressed.mp3`
    );

    // Compress audio
    const result = await compressAudio(inputPath, outputPath);

    // Delete original file after successful compression
    fs.unlinkSync(inputPath);

    return {
      compressed: true,
      filePath: result.outputPath,
      size: result.compressedSize,
      originalSize: result.originalSize,
      compressionRatio: result.compressionRatio,
    };
  } catch (error) {
    throw new Error(`Audio processing failed: ${error.message}`);
  }
}

/**
 * Get audio file duration
 * @param {string} filePath - Path to audio file
 * @returns {Promise<number>} - Duration in seconds (returns 0 if ffprobe not available)
 */
export async function getAudioDuration(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) {
        // If ffprobe is not available, log warning and return 0 instead of rejecting
        console.warn(`Failed to get audio duration (ffprobe not available): ${error.message}`);
        console.warn('Continuing without duration information...');
        resolve(0); // Return 0 seconds as fallback
      } else {
        const duration = metadata.format.duration;
        resolve(Math.round(duration));
      }
    });
  });
}
