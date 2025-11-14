import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


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
        
        // Timestamps
        createdAt: true,
        updatedAt: true,
        
        // User Information
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
            role: true,
            status: true,
            profilePicture: true,
            provider: true
          }
        },
        
        // Qualifications
        qualifications: {
          select: {
            id: true,
            type: true,
            field: true,
            startYear: true,
            endYear: true,
            createdAt: true
          }
        },
        
        // Experiences
        experiences: {
          select: {
            id: true,
            experienceMin: true,
            experienceMax: true,
            jobTitle: true,
            industry: true,
            vertical: true,
            companyName: true,
            startDate: true,
            endDate: true
          }
        },
        
        // Current Employment
        employment: {
          select: {
            id: true,
            jobTitle: true,
            industry: true,
            vertical: true,
            companyName: true,
            startDate: true
          }
        },
        
        // KYC Documents
        kycDocuments: {
          select: {
            id: true,
            documentType: true,
            documentNumber: true,
            holderName: true,
            verificationStatus: true,
            verifiedAt: true,
            uploadedAt: true
          }
        },
        
        // Gig Applications
        GigApplication: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
            hireDateAt: true,
            opportunity: {
              select: {
                id: true,
                title: true,
                category: true,
                status: true
              }
            }
          }
        },
        
        // Selected/Active Gigs
        SelectedGig: {
          select: {
            id: true,
            status: true,
            loginTime: true,
            logoutTime: true,
            totalMinutesWorked: true,
            createdAt: true,
            opportunity: {
              select: {
                id: true,
                title: true,
                category: true,
                budget: true,
                currency: true
              }
            }
          }
        },
        
        // Reviews
        reviews: {
          select: {
            id: true,
            reviewType: true,
            rating: true,
            category: true,
            comment: true,
            approved: true,
            createdAt: true
          }
        },
        
        // Payments
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            method: true,
            payoutDate: true,
            createdAt: true
          }
        },
        
        // Disputes
        disputes: {
          select: {
            id: true,
            disputeType: true,
            title: true,
            status: true,
            createdAt: true
          }
        }
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