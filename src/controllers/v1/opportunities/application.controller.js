import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


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
        },
        selectedGigs: {
          select: {
            id: true,
            totalMinutesWorked: true,
            status: true
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

    // Calculate total hours worked across all selected gigs for this opportunity
    const totalMinutesWorked = existingOpportunity.selectedGigs.reduce(
      (sum, gig) => sum + (gig.totalMinutesWorked || 0), 
      0
    );
    const totalHoursWorked = totalMinutesWorked / 60;

    const project = existingOpportunity.project;

    // Check if hours limit is reached
    if (totalHoursWorked >= project.totalHoursNeeded) {
      return res.status(400).json({
        success: false,
        message: `Required hours (${project.totalHoursNeeded}) already completed for this opportunity`,
        data: {
          totalHoursNeeded: project.totalHoursNeeded,
          hoursCompleted: totalHoursWorked.toFixed(2)
        }
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
            project: {
              select: {
                id: true,
                title: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                    companyName: true
                  }
                }
              }
            }
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