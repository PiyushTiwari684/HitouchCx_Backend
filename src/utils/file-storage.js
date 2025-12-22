import cloudinary from '../config/cloudinary.config.js';

/**
 * Save PDF document to Cloudinary
 *
 * @param {string} base64Content - Base64 encoded PDF content
 * @param {string} userId - User ID for file organization
 * @param {string} documentType - Type of document (aadhaar, pan, etc.)
 * @returns {Promise<string>} Cloudinary URL of uploaded file
 */
export const savePdfDocument = async (base64Content, userId, documentType) => {
  try {
    // Generate unique file identifier
    const timestamp = Date.now();
    const publicId = `hitouchcx/kyc/${documentType}/${userId}_${documentType}_${timestamp}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${base64Content}`,
      {
        public_id: publicId,
        resource_type: 'raw',
        folder: `hitouchcx/kyc/${documentType}`,
      }
    );

    console.log(`✅ PDF uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`Error saving PDF for ${documentType}:`, error);
    throw new Error(`Failed to save PDF document: ${error.message}`);
  }
};

/**
 * Save XML document to Cloudinary
 *
 * @param {string} xmlContent - XML content as string
 * @param {string} userId - User ID for file organization
 * @returns {Promise<string>} Cloudinary URL of uploaded file
 */
export const saveXmlDocument = async (xmlContent, userId) => {
  try {
    // Convert XML content to base64
    const base64Content = Buffer.from(xmlContent, 'utf8').toString('base64');
    const timestamp = Date.now();
    const publicId = `hitouchcx/kyc/aadhaar/${userId}_aadhaar_${timestamp}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:application/xml;base64,${base64Content}`,
      {
        public_id: publicId,
        resource_type: 'raw',
        folder: 'hitouchcx/kyc/aadhaar',
      }
    );

    console.log(`✅ XML uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('Error saving XML document:', error);
    throw new Error(`Failed to save XML document: ${error.message}`);
  }
};

/**
 * Save photo to Cloudinary
 *
 * @param {string} base64Photo - Base64 encoded photo
 * @param {string} userId - User ID for file organization
 * @returns {Promise<string>} Cloudinary URL of uploaded photo
 */
export const savePhoto = async (base64Photo, userId) => {
  try {
    const timestamp = Date.now();
    const publicId = `hitouchcx/kyc/photos/${userId}_photo_${timestamp}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Photo}`,
      {
        public_id: publicId,
        folder: 'hitouchcx/kyc/photos',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' },
        ],
      }
    );

    console.log(`✅ Photo uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
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

/**
 * Delete file from Cloudinary
 *
 * @param {string} cloudinaryUrl - Full Cloudinary URL or public ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
export const deleteFile = async (cloudinaryUrl) => {
  try {
    // Extract public_id from Cloudinary URL
    // Example: https://res.cloudinary.com/cloud/raw/upload/v123/hitouchcx/kyc/pan/file.pdf
    // We need: hitouchcx/kyc/pan/file

    let publicId;
    if (cloudinaryUrl.includes('cloudinary.com')) {
      const urlParts = cloudinaryUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1) {
        // Get everything after 'upload/v{version}/'
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
        // Remove file extension
        publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
      }
    } else {
      // Assume it's already a public_id
      publicId = cloudinaryUrl;
    }

    if (!publicId) {
      console.error('Could not extract public_id from URL:', cloudinaryUrl);
      return false;
    }

    // Determine resource type based on public_id
    const resourceType = publicId.includes('/kyc/') ? 'raw' : 'image';

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    console.log(`🗑️  File deletion result:`, result);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return false;
  }
};

/**
 * Initialize upload directories - NOT NEEDED FOR CLOUDINARY
 * This function is kept for backward compatibility but does nothing
 * since we're using cloud storage
 */
export const initializeUploadDirectories = () => {
  console.log('✅ Using Cloudinary for file storage - no local directories needed');
};
