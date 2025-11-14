import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

class ImageProcessor {
  /**
   * Process and optimize uploaded profile photo
   * @param {string} filePath - Path to uploaded file
   * @param {number} size - Desired output size (default: 400x400)
   * @returns {Promise<string>} - Path to processed image
   */
  static async processProfilePhoto(filePath, size = 400) {
    try {
      const outputPath = filePath.replace(
        path.extname(filePath),
        '-optimized' + path.extname(filePath)
      );

      await sharp(filePath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
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

  /**
   * Delete old profile photo
   * @param {string} photoPath - Path to photo to delete
   */
  static async deletePhoto(photoPath) {
    try {
      if (photoPath && photoPath !== '') {
        const fullPath = path.join('.', photoPath);
        await fs.unlink(fullPath);
      }
    } catch (error) {
      console.error('Error deleting photo:', error.message);
      // Don't throw - photo might already be deleted
    }
  }
}

export default ImageProcessor;