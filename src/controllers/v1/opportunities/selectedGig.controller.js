import { prisma } from '../../../utils/prismaClient.js';
    
// After agent applies for opportunity and the gig is created where he will work
//Time Slot Pending for this controller and model
export const addSelectedGig = async (req, res) => {
  const { applicationId } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch application with all related data
      const existingApp = await tx.gigApplication.findUnique({
        where: { id: applicationId },
        include: { 
          opportunity: {
            include: {
              project: true // Need project for agentsHired update
            }
          },
          selectedGig: true
        }
      });

      // Validations
      if (!existingApp) {
        throw new Error('Application not found');
      }

      if (existingApp.status !== 'PENDING') {
        throw new Error(`Application already ${existingApp.status.toLowerCase()}`);
      }

      if (existingApp.selectedGig) {
        throw new Error('SelectedGig already exists for this application');
      }

      const opportunity = existingApp.opportunity;
      const project = opportunity.project;

      // Check if opportunity still has openings
      if (opportunity.agentsHired >= opportunity.agentsRequired) {
        throw new Error('Opportunity has reached maximum agents');
      }

      // 2. Update GigApplication status to ACCEPTED
      const application = await tx.gigApplication.update({
        where: { id: applicationId },
        data: { 
          status: 'ACCEPTED',
          hireDateAt: new Date()
        }
      });

      // 3. Create SelectedGig
      const selectedGig = await tx.selectedGig.create({
        data: {
          gigApplicationId: application.id,
          agentId: application.agentId,
          opportunityId: application.opportunityId,
          status: 'OPEN'
        }
      });

      // 4. Update Opportunity (increment agentsHired, update status)
      const updatedOpportunity = await tx.opportunity.update({
        where: { id: application.opportunityId },
        data: {
          agentsHired: { increment: 1 },
          status: opportunity.agentsHired + 1 >= opportunity.agentsRequired 
            ? 'IN_PROGRESS' // All positions filled
            : 'IN_PROGRESS'  // Partially filled but in progress
        }
      });

      // 5. Update Project (increment agentsHired)
      const updatedProject = await tx.project.update({
        where: { id: opportunity.projectId },
        data: {
          agentsHired: { increment: 1 },
          status: project.status === 'DRAFT' ? 'ACTIVE' : project.status
        }
      });

      return { 
        application, 
        selectedGig, 
        opportunity: updatedOpportunity,
        project: updatedProject
      };
    });

    res.status(200).json({
      success: true,
      message: 'Application accepted successfully',
      data: {
        selectedGig: result.selectedGig,
        application: {
          id: result.application.id,
          status: result.application.status,
          hireDateAt: result.application.hireDateAt
        },
        opportunity: {
          id: result.opportunity.id,
          title: result.opportunity.title,
          agentsHired: result.opportunity.agentsHired,
          agentsRequired: result.opportunity.agentsRequired,
          status: result.opportunity.status
        },
        project: {
          id: result.project.id,
          projectName: result.project.projectName,
          agentsHired: result.project.agentsHired,
          status: result.project.status
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

