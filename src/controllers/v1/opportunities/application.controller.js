import express from 'express';
import prisma from '../../../config/db.js'; 


// POST an Application when Agent applies for an Opportunity
const gigApplication = async (req, res) => {
  try {
    const { agentId, opportunityId } = req.body;

    // Validation
    if (!agentId || !opportunityId) {
      return res.status(400).json({
        success: false,
        message: 'agentId and opportunityId are required'
      });
    }

    // Check if agent exists
    const existingAgent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Check if opportunity exists with project details
    const existingOpportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        project: {
          select: {
            id: true,
            agentsNeeded: true,
            totalHoursNeeded: true,
            agentsHired: true,
            hoursCompleted: true
          }
        }
      }
    });

    if (!existingOpportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Check if opportunity is available (OPEN or IN_PROGRESS allowed)
    const allowedStatuses = ['OPEN', 'IN_PROGRESS'];
    if (!allowedStatuses.includes(existingOpportunity.status)) {
      return res.status(400).json({
        success: false,
        message: `Opportunity is not available for applications. Current status: ${existingOpportunity.status}`
      });
    }



    // Check if agent has already applied for this opportunity
    const existingApplication = await prisma.gigApplication.findFirst({
      where: {
        agentId,
        opportunityId
      }
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this opportunity',
        data: existingApplication
      });
    }

    // Create new gig application
    const newApplication = await prisma.gigApplication.create({
      data: {
        agentId,
        opportunityId,
        status: 'PENDING'
      },
      include: {
        agent: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
          }
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: newApplication
    });

  } catch (error) {
    console.error('Error creating gig application:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export {gigApplication}