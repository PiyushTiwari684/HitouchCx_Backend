import prisma from '../../../config/db.js'; 


const getAgentById = async (req, res) => {
  try {
    const { agentId } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        dob: true,
        profilePhotoUrl: true,
        
        // Shift & Availability
        preferredShift: true,
        hoursPerDay: true,
        
        // Skills & Languages
        skills: true,
        languages: true,
        
        // Experience & Employment
        hasExperience: true,
        isEmployed: true,
        
        // KYC Status
        kycStatus: true,
        assessedCandidate:true,

        //Gig Application
        GigApplication:{
          select:{
            selectedGig:{
              select:{
                activityLogs:true
              }
            }
          }
        },
        
        // Timestamps
        createdAt: true,
        updatedAt: true,
        
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        agent
      }
    });

  } catch (error) {
    console.error('Error fetching agent:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch agent information',
      message: error.message
    });
  }
};

export { getAgentById };