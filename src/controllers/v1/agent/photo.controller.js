import prisma from '../../../config/db.js';
import { deleteFromCloudinary } from '../../../utils/cloudinaryUpload.js';

/**
 * Upload and process agent profile photo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadAgentPhoto = async (req, res) => {
  try {
    const { agentId } = req.params;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // When using CloudinaryStorage, req.file contains:
    // - path: Cloudinary URL
    // - filename: Cloudinary public_id
    const cloudinaryUrl = req.file.path;

    console.log('✅ File uploaded to Cloudinary:', cloudinaryUrl);

    // Delete old profile photo if exists
    if (agent.profilePhotoUrl) {
      try {
        await deleteFromCloudinary(agent.id);
        console.log('🗑️ Old profile photo deleted');
      } catch (deleteError) {
        console.warn('⚠️ Could not delete old photo:', deleteError.message);
        // Continue even if deletion fails
      }
    }

    // Update agent with new photo URL
    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: { profilePhotoUrl: cloudinaryUrl },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        agent: updatedAgent
      }
    });

  } catch (error) {
    console.error('❌ Error uploading photo:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to upload profile photo',
      message: error.message
    });
  }
};

/**
 * Delete agent profile photo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAgentPhoto = async (req, res) => {
  try {
    const { agentId } = req.params;

    // Find agent
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, profilePhotoUrl: true }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    if (!agent.profilePhotoUrl) {
      return res.status(400).json({
        success: false,
        error: 'No profile photo to delete'
      });
    }

    // Delete photo from Cloudinary
    const result = await deleteFromCloudinary(agent.id);

    if (result.result !== 'ok' && result.result !== 'not found') {
      return res.status(502).json({
        success: false,
        error: 'Cloudinary delete failed',
        details: result
      });
    }

    // Update agent record
    await prisma.agent.update({
      where: { id: agentId },
      data: { profilePhotoUrl: null }
    });

    return res.status(200).json({
      success: true,
      message: 'Profile photo deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting photo:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete profile photo',
      message: error.message
    });
  }
};

export { uploadAgentPhoto, deleteAgentPhoto };
