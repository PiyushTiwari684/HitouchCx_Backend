import prisma from '../../../config/db.js'; 
import ImageProcessor from '../../../utils/imageProcessor.js';
import fs from 'fs/promises';


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
      // Delete uploaded file if agent not found
      await fs.unlink(req.file.path);
      return res.status(404).json({ 
        success: false,
        error: 'Agent not found' 
      });
    }

    // Process and optimize the uploaded image
    const optimizedPath = await ImageProcessor.processProfilePhoto(req.file.path);

    // Delete old profile photo if exists
    if (agent.profilePhotoUrl) {
      await ImageProcessor.deletePhoto(agent.profilePhotoUrl);
    }

    // Update agent with new photo URL
    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: { profilePhotoUrl: optimizedPath },
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
    console.error('Error uploading photo:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

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

    // Delete photo file
    await ImageProcessor.deletePhoto(agent.profilePhotoUrl);

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
    console.error('Error deleting photo:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete profile photo',
      message: error.message
    });
  }
};

export {uploadAgentPhoto,deleteAgentPhoto}