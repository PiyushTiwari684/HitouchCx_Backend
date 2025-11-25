import sharp from "sharp";


/**
 * Calculate image sharpness using Laplacian variance method
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {Promise<number>} - Variance score (higher = sharper)
 */
async function calculateSharpness(imageBuffer) {
  try {
    // Convert image to grayscale and apply Laplacian filter
    const { data, info } = await sharp(imageBuffer)
      .greyscale() // Convert to grayscale
      .raw() // Get raw pixel data
      .toBuffer({ resolveWithObject: true });

    // Apply Laplacian kernel manually
    // Kernel: [-1, -1, -1]
    //         [-1,  8, -1]
    //         [-1, -1, -1]
    const width = info.width;
    const height = info.height;
    const values = [];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;

        // Apply Laplacian kernel
        const laplacian =
          -1 * data[idx - width - 1] + // Top-left
          -1 * data[idx - width] + // Top
          -1 * data[idx - width + 1] + // Top-right
          -1 * data[idx - 1] + // Left
          8 * data[idx] + // Center
          -1 * data[idx + 1] + // Right
          -1 * data[idx + width - 1] + // Bottom-left
          -1 * data[idx + width] + // Bottom
          -1 * data[idx + width + 1]; // Bottom-right

        values.push(laplacian);
      }
    }

    // Calculate variance
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;

    return variance;
  } catch (error) {
    throw new Error(`Failed to calculate sharpness: ${error.message}`);
  }
}

/**
 * Check if image is blurry
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {number} threshold - Minimum variance score (default: 100)
 * @returns {Promise<object>} - { isBlurry: boolean, sharpness: number }
 */
export async function checkImageBlur(imageBuffer, threshold = 100) {
  try {
    const sharpness = await calculateSharpness(imageBuffer);

    return {
      isBlurry: sharpness < threshold,
      sharpness: Math.round(sharpness * 100) / 100, // Round to 2 decimals
      threshold,
    };
  } catch (error) {
    throw new Error(`Blur detection failed: ${error.message}`);
  }
}

/**
 * Get image metadata (dimensions, format, size)
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {Promise<object>} - Image metadata
 */
export async function getImageMetadata(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
    };
  } catch (error) {
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
}

/**
 * Resize image if too large (save storage space)
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {number} maxWidth - Maximum width (default: 1280)
 * @param {number} maxHeight - Maximum height (default: 720)
 * @returns {Promise<Buffer>} - Resized image buffer
 */
export async function resizeImage(
  imageBuffer,
  maxWidth = 1280,
  maxHeight = 720
) {
  try {
    const resized = await sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: "inside", // Maintain aspect ratio
        withoutEnlargement: true, // Don't upscale small images
      })
      .jpeg({ quality: 90 }) // Convert to JPEG with 90% quality
      .toBuffer();

    return resized;
  } catch (error) {
    throw new Error(`Failed to resize image: ${error.message}`);
  }
}
