import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();



// Create a platform review (Agent rating the platform)
const createPlatformReview = async (req, res) => {
    try {


        const userId = req.user.id;
        const { rating, category, comment } = req.body;

        // Validate required fields
        if (!rating) {
            return res.status(400).json({ error: "Rating is required" });
        }

        // Validate rating range
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                error: "Rating must be a number between 1 and 5" 
            });
        }

        // Validate category if provided
        const validCategories = [
            'OVERALL',
            'QUALITY',
            'COMMUNICATION',
            'TIMELINESS',
            'USER_EXPERIENCE',
            'PAYMENT',
            'SUPPORT',
            'ASSESSMENT'
        ];
        
        if (category && !validCategories.includes(category)) {
            return res.status(400).json({ 
                error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
            });
        }

        // Check if agent exists for this user
        const agent = await prisma.agent.findUnique({
            where: { userId }
        });

        if (!agent) {
            return res.status(404).json({ 
                error: "Agent profile not found. Please complete registration first." 
            });
        }

        // Check if agent has already reviewed the platform
        const existingReview = await prisma.review.findFirst({
            where: {
                agentId: agent.id,
                reviewType: 'PLATFORM'
            }
        });

        if (existingReview) {
            return res.status(400).json({ 
                error: "You have already submitted a platform review. Please update your existing review instead." 
            });
        }

        // Create platform review
        const review = await prisma.review.create({
            data: {
                reviewType: 'PLATFORM',
                agentId: agent.id,
                reviewerId: userId, // The user ID of the agent
                reviewerType: 'AGENT',
                rating,
                category: category || 'OVERALL',
                comment,
                approved: false // Admin needs to approve platform reviews
            },
            include: {
                agent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        res.status(201).json({
            message: "Platform review submitted successfully. It will be visible after admin approval.",
            review: {
                id: review.id,
                reviewType: review.reviewType,
                rating: review.rating,
                category: review.category,
                comments: review.comments,
                approved: review.approved,
                agent: review.agent,
                createdAt: review.createdAt
            }
        });

    } catch (error) {
        console.error("Error creating platform review:", error);
        res.status(500).json({
            error: "Failed to create platform review",
            details: error.message
        });
    }
};


export { 
    createPlatformReview,  
};