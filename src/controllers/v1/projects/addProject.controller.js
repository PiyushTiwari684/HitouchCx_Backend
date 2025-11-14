import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * @route POST /api/v1/projects
 * @desc Create a new project
 * @access Private (Client only)
 */
const addProject = async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      totalHoursNeeded,
      agentsNeeded,
      skillsRequired,
      totalBudget,
      currency,
      projectDeadline,
      clientId
    } = req.body;

    // Validation
    if (!title || !description || !totalHoursNeeded || !agentsNeeded || !totalBudget || !projectDeadline || !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, totalHoursNeeded, agentsNeeded, totalBudget, projectDeadline, clientId'
      });
    }

    // Verify client exists
    const clientExists = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!clientExists) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        title,
        description,
        department,
        totalHoursNeeded: parseInt(totalHoursNeeded),
        agentsNeeded: parseInt(agentsNeeded),
        skillsRequired: skillsRequired || [],
        totalBudget: parseFloat(totalBudget),
        currency: currency || 'INR',
        projectDeadline: new Date(projectDeadline),
        status: 'PLANNING',
        clientId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });

  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export {addProject}