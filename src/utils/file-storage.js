import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateFilePath } from './kyc-helpers.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base upload directory (relative to project root)
const UPLOAD_BASE_DIR = path.join(__dirname, '..', '..', 'uploads', 'kyc');

/**
 * Ensure directory exists, create if it doesn't
 *
 * @param {string} dirPath - Directory path to ensure
 * @private
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};


export const savePdfDocument = async (base64Content, userId, documentType) => {
  try {
    // Generate file path
    const relativePath = generateFilePath(userId, documentType, 'pdf');
    const absolutePath = path.join(__dirname, '..', '..', relativePath);

    // Ensure directory exists
    const dirPath = path.dirname(absolutePath);
    ensureDirectoryExists(dirPath);

    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(absolutePath, buffer);

    return relativePath;
  } catch (error) {
    console.error(`Error saving PDF for ${documentType}:`, error);
    throw new Error(`Failed to save PDF document: ${error.message}`);
  }
};


export const saveXmlDocument = async (xmlContent, userId) => {
  try {
    // Generate file path
    const relativePath = generateFilePath(userId, 'aadhaar', 'xml');
    const absolutePath = path.join(__dirname, '..', '..', relativePath);

    // Ensure directory exists
    const dirPath = path.dirname(absolutePath);
    ensureDirectoryExists(dirPath);

    // Save XML content
    fs.writeFileSync(absolutePath, xmlContent, 'utf8');

    return relativePath;
  } catch (error) {
    console.error('Error saving XML document:', error);
    throw new Error(`Failed to save XML document: ${error.message}`);
  }
};


export const savePhoto = async (base64Photo, userId) => {
  try {
    // Generate file path (use 'photo' as type for clearer naming)
    const timestamp = Date.now();
    const filename = `${userId}_photo_${timestamp}.jpg`;
    const relativePath = `uploads/kyc/aadhaar/${filename}`;
    const absolutePath = path.join(__dirname, '..', '..', relativePath);

    // Ensure directory exists
    const dirPath = path.dirname(absolutePath);
    ensureDirectoryExists(dirPath);

    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Photo, 'base64');
    fs.writeFileSync(absolutePath, buffer);

    return relativePath;
  } catch (error) {
    console.error('Error saving photo:', error);
    throw new Error(`Failed to save photo: ${error.message}`);
  }
};

export const saveDocumentSet = async (documentData, userId, documentType, photoBase64 = null) => {
  const savedFiles = {};

  try {
    // Save PDF (required)
    if (documentData.pdfB64 && documentData.pdfB64.content) {
      savedFiles.pdfPath = await savePdfDocument(
        documentData.pdfB64.content,
        userId,
        documentType
      );
    }

    // Save XML (Aadhaar only)
    if (documentData.xml && documentData.xml.content) {
      savedFiles.xmlPath = await saveXmlDocument(
        documentData.xml.content,
        userId
      );
    }

    // Save photo (Aadhaar only)
    if (photoBase64) {
      savedFiles.photoPath = await savePhoto(photoBase64, userId);
    }

    return savedFiles;
  } catch (error) {
    console.error(`Error saving document set for ${documentType}:`, error);
    throw error;
  }
};


export const deleteFile = async (relativePath) => {
  try {
    const absolutePath = path.join(__dirname, '..', '..', relativePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Initialize upload directories
 * Creates the required folder structure if it doesn't exist
 *
 * Should be called on application startup
 */
export const initializeUploadDirectories = () => {
  const directories = [
    path.join(UPLOAD_BASE_DIR, 'aadhaar'),
    path.join(UPLOAD_BASE_DIR, 'pan'),
  ];

  directories.forEach(dir => {
    ensureDirectoryExists(dir);
  });

  console.log('✓ KYC upload directories initialized');
};
