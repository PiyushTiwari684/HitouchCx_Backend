import sharp from "sharp";
import fs from "fs/promises";
import path from "path";


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


class ImageProcessor {

  static async processProfilePhoto(filePath, size = 400) {
    try {
      const outputPath = filePath.replace(
        path.extname(filePath),
        "-optimized" + path.extname(filePath),
      );

      await sharp(filePath)
        .resize(size, size, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      // Delete original file
      await fs.unlink(filePath);

      return outputPath;
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

 
  static async deletePhoto(photoPath) {
    try {
      if (photoPath && photoPath !== "") {
        const fullPath = path.join(".", photoPath);
        await fs.unlink(fullPath);
      }
    } catch (error) {
      console.error("Error deleting photo:", error.message);
      // Don't throw - photo might already be deleted
    }
  }
}

export default ImageProcessor;
