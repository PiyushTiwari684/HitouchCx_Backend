import prisma from '../../../config/db.js';

// Get agent info by ID
const getAgentById = async (req, res) => {
  try {
    const agentId = req.params?.id;
    if (!agentId) {
      return res.status(400).json({ message: 'agentId (params.id) is required' });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
            phone: true,
            phoneVerified: true,
            status: true,
          },
        },
      },
    });

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    return res.status(200).json({
      message: 'Agent fetched',
      data: {
        agent: {
          id: agent.id,
          firstName: agent.firstName,
          middleName: agent.middleName,
          lastName: agent.lastName,
          dob: agent.dob,
          address: agent.address,
          profilePhotoUrl: agent.profilePhotoUrl,
          preferredShift: agent.preferredShift,
          hoursPerDay: agent.hoursPerDay,
          hasExperience: agent.hasExperience,
          isEmployed: agent.isEmployed,
          skills: agent.skills,
          languages: agent.languages,
          kycStatus: agent.kycStatus,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
        },
        user: agent.user,
      },
    });
  } catch (err) {
    console.error('getAgentById error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export { getAgentById };