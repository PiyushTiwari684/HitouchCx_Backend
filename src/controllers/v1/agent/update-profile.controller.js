/**
 * Agent Profile Update Controller
 *
 * Allows agents to update their profile information after KYC rejection.
 * This enables users to fix name/DOB/address mismatches and retry KYC.
 *
 * @module controllers/v1/agent/update-profile
 */

import prisma from '../../../config/db.js';

/**
 * Get current agent profile
 * Returns all editable fields for profile update
 */
export const getAgentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const agent = await prisma.agent.findUnique({
      where: { userId },
      include: {
        qualifications: true,
        experiences: true,
        employment: true,
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        // Personal Information
        firstName: agent.firstName,
        middleName: agent.middleName,
        lastName: agent.lastName,
        dob: agent.dob,

        // Address fields (structured)
        currentAddress: agent.currentAddress,
        currentCity: agent.currentCity,
        currentState: agent.currentState,
        currentPincode: agent.currentPincode,
        permanentAddress: agent.permanentAddress,
        permanentCity: agent.permanentCity,
        permanentState: agent.permanentState,
        permanentPincode: agent.permanentPincode,

        // Qualifications
        qualifications: agent.qualifications.map(q => ({
          type: q.type,
          field: q.field,
          degree: q.degree,
          institution: q.institution,
          startYear: q.startYear,
          endYear: q.endYear,
          grade: q.grade,
        })),

        // Experience
        hasExperience: agent.hasExperience,
        experiences: agent.experiences.map(exp => ({
          experienceMin: exp.experienceMin,
          experienceMax: exp.experienceMax,
          industry: exp.industry,
          vertical: exp.vertical,
          jobTitle: exp.jobTitle,
          companyName: exp.companyName,
          startDate: exp.startDate,
          endDate: exp.endDate,
        })),

        // Employment
        isEmployed: agent.isEmployed,
        employment: agent.employment ? {
          companyName: agent.employment.companyName,
          industry: agent.employment.industry,
          vertical: agent.employment.vertical,
          jobTitle: agent.employment.jobTitle,
          startDate: agent.employment.startDate,
        } : null,

        // Skills & Availability
        skills: agent.skills,
        languages: agent.languages,
        preferredShift: agent.preferredShift,
        hoursPerDay: agent.hoursPerDay,

        // KYC Status
        kycStatus: agent.kycStatus,
      },
    });
  } catch (error) {
    console.error('Error in getAgentProfile controller:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get agent profile',
      error: error.message,
    });
  }
};

/**
 * Update agent profile
 * Only allowed if KYC status is REJECTED or PENDING
 */
export const updateAgentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Find agent
    const agent = await prisma.agent.findUnique({
      where: { userId },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found',
      });
    }

    // Check if profile can be updated
    if (agent.kycStatus === 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: 'Cannot update profile after KYC approval. Please contact support.',
      });
    }

    // Validate required fields
    if (!updates.firstName || !updates.dob) {
      return res.status(400).json({
        success: false,
        message: 'First name and date of birth are required',
      });
    }

    // Prepare update data
    const updateData = {
      firstName: updates.firstName,
      middleName: updates.middleName || null,
      lastName: updates.lastName || null,
      dob: new Date(updates.dob),
      // Address fields (structured)
      currentAddress: updates.currentAddress || null,
      currentCity: updates.currentCity || null,
      currentState: updates.currentState || null,
      currentPincode: updates.currentPincode || null,
      permanentAddress: updates.permanentAddress || null,
      permanentCity: updates.permanentCity || null,
      permanentState: updates.permanentState || null,
      permanentPincode: updates.permanentPincode || null,
      skills: updates.skills || agent.skills,
      languages: updates.languages || agent.languages,
      preferredShift: updates.preferredShift || agent.preferredShift,
      hoursPerDay: updates.hoursPerDay || agent.hoursPerDay,
    };

    // Update agent
    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: updateData,
    });

    console.log('[Update Profile] Agent profile updated:', {
      agentId: agent.id,
      userId,
      previousKycStatus: agent.kycStatus,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully. You can now retry KYC verification.',
      data: {
        firstName: updatedAgent.firstName,
        middleName: updatedAgent.middleName,
        lastName: updatedAgent.lastName,
        dob: updatedAgent.dob,
        // Address fields
        currentAddress: updatedAgent.currentAddress,
        currentCity: updatedAgent.currentCity,
        currentState: updatedAgent.currentState,
        currentPincode: updatedAgent.currentPincode,
        permanentAddress: updatedAgent.permanentAddress,
        permanentCity: updatedAgent.permanentCity,
        permanentState: updatedAgent.permanentState,
        permanentPincode: updatedAgent.permanentPincode,
        kycStatus: updatedAgent.kycStatus,
      },
    });
  } catch (error) {
    console.error('Error in updateAgentProfile controller:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};
