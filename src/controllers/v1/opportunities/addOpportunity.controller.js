import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

//POST an Opportunity Linked to Project
const addOpportunity = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      processType,
      workMode,
      deadline,
      duration,
      durationType,
      budget,
      currency,
      paymentType,
      status,
      visibility,
      projectId
    } = req.body;

    // Validation
    if (!title || !description || !processType || !deadline || !duration || !budget || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, processType, deadline, duration, budget, and clientId are required'
      });
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Validate enum values
    const validCategories = ['BPO', 'CONTENT', 'TECH'];
    const validWorkModes = ['REMOTE', 'ON_SITE', 'HYBRID'];
    const validDurationTypes = ['HOURS', 'DAYS', 'WEEKS', 'MONTHS'];
    const validPaymentTypes = ['FIXED', 'HOURLY', 'MILESTONE'];
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'CANCELLED', 'COMPLETED', 'CLOSED'];
    const validVisibilityLevels = ['PUBLIC', 'PRIVATE', 'DRAFT'];

    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be one of: BPO, CONTENT, TECH'
      });
    }

    if (workMode && !validWorkModes.includes(workMode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workMode. Must be one of: REMOTE, ON_SITE, HYBRID'
      });
    }

    if (durationType && !validDurationTypes.includes(durationType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid durationType. Must be one of: HOURS, DAYS, WEEKS, MONTHS'
      });
    }

    if (paymentType && !validPaymentTypes.includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid paymentType. Must be one of: FIXED, HOURLY, MILESTONE'
      });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    if (visibility && !validVisibilityLevels.includes(visibility)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visibility. Must be one of: PUBLIC, PRIVATE, DRAFT'
      });
    }

    // Validate budget is positive
    if (budget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be greater than 0'
      });
    }

    // Validate duration is positive
    if (duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be greater than 0'
      });
    }

    // Create new opportunity
    const newOpportunity = await prisma.opportunity.create({
      data: {
        title,
        description,
        category: category || 'BPO',
        processType,
        workMode: workMode || 'REMOTE',
        deadline,
        duration,
        durationType: durationType || 'DAYS',
        budget,
        currency: currency || 'INR',
        paymentType: paymentType || 'HOURLY',
        status: status || 'OPEN',
        visibility: visibility || 'PUBLIC',
        projectId
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            category: true,
            projectDeadline: true,
            agentsNeeded:true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Opportunity created successfully',
      data: newOpportunity
    });


  } catch (error) {
    console.error('Error creating opportunity:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};






export { addOpportunity};