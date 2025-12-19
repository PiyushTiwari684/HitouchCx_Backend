import prisma from '../../../config/db.js'; 

const registerAgent = async (req, res) => {
    try {
        // Get user ID from JWT (set by middleware)
        const userId = req.user.id;
        
        // Get data from request body
        const {
            firstName,
            middleName,
            lastName,
            dob,
            profilePhotoUrl,
            // Address fields
            currentAddress,
            currentCity,
            currentState,
            currentPincode,
            permanentAddress,
            permanentCity,
            permanentState,
            permanentPincode,
            qualifications,
            hasExperience,
            experiences,
            isEmployed,
            employment,
            skills,
            languages,
            preferredShift,
            hoursPerDay
        } = req.body;

        // Check required fields
        if (!firstName ||  !dob  || !preferredShift || !hoursPerDay) {
            return res.status(400).json({ error: "All fields are required: firstName, dob, preferredShift, hoursPerDay" });
        }

        // Validate shift enum
        const validShifts = ['MORNING_9_5', 'AFTERNOON_1_9', 'EVENING_5_1', 'NIGHT_1_9', 'FLEXIBLE', 'CUSTOM'];
        if (!validShifts.includes(preferredShift)) {
            return res.status(400).json({ 
                error: `Invalid shift. Must be one of: ${validShifts.join(', ')}` 
            });
        }

        // Validate hoursPerDay
        if (typeof hoursPerDay !== 'number' || hoursPerDay < 1 || hoursPerDay > 24) {
            return res.status(400).json({ 
                error: "hoursPerDay must be a number between 1 and 24" 
            });
        }

        // ✨ Array length validation (must have at least 1 item)
        if (!qualifications || !Array.isArray(qualifications) || qualifications.length === 0) {
            return res.status(400).json({ error: "Qualifications array must have at least 1 item" });
        }
        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return res.status(400).json({ error: "Skills array must have at least 1 item" });
        }
        if (!languages || !Array.isArray(languages) || languages.length === 0) {
            return res.status(400).json({ error: "Languages array must have at least 1 item" });
        }

        // ✨ REMOVED: experiences array validation - it's now optional even when hasExperience is true
        // Users can indicate they have experience without providing exact employment details

        if (isEmployed === true && !employment) {
            return res.status(400).json({ error: "Employment object is required when isEmployed is true" });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { agent: true } // Include agent relation to check if exists
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if agent already exists
        if (user.agent) {
            return res.status(400).json({ error: "Agent already registered for this user" });
        }

        // Validate age (must be 18+)
        const dobDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
            age--;
        }
        if (age < 18) {
            return res.status(400).json({ error: "Must be 18 years or older" });
        }

         // Validate qualification types
        const validQualificationTypes = ['HIGH_SCHOOL', 'DIPLOMA', 'BACHELORS', 'MASTERS', 'PHD', 'CERTIFICATION'];
        for (const qual of qualifications) {
            if (!qual.type || !validQualificationTypes.includes(qual.type)) {
                return res.status(400).json({ 
                    error: `Invalid qualification type. Must be one of: ${validQualificationTypes.join(', ')}` 
                });
            }
        }

        // Create agent profile
        const agent = await prisma.agent.create({
            data: {
                userId: userId,
                firstName,
                middleName,
                lastName,
                dob: dobDate,
                profilePhotoUrl,
                // Address fields (structured)
                currentAddress,
                currentCity,
                currentState,
                currentPincode,
                permanentAddress,
                permanentCity,
                permanentState,
                permanentPincode,
                hasExperience: hasExperience || false,
                isEmployed: isEmployed || false,
                skills: skills || [],
                languages: languages || [],
                kycStatus: 'PENDING',
                preferredShift,
                hoursPerDay,

                // Add qualifications if provided
                qualifications:  {
                    create: qualifications
                },
                
                // Add experiences if provided (only if array exists and has items)
                experiences: (hasExperience && experiences && experiences.length > 0) ? {
                    create: experiences.map(exp => ({
                        ...exp,
                        startDate: exp.startDate? new Date(exp.startDate): null,
                        endDate:exp.endDate? new Date(exp.endDate): null
                    }))
                } : undefined ,
                
                // Add employment if provided
                employment: isEmployed ?  {
                    create: {
                        ...employment,
                        startDate: employment.startDate ? new Date(employment.startDate) : null
                    }
                } : undefined 
            }
        });

        // Update User's profileCompleted flag
        await prisma.user.update({
            where: { id: userId },
            data: { profileCompleted: true }
        });

        res.status(201).json({
            message: "Agent registered successfully",
            agent: {
                id: agent.id,
                firstName: agent.firstName,
                lastName: agent.lastName,
                kycStatus: agent.kycStatus,
                dob:agent.dob
            }
        });

    } catch (error) {
        console.error("Error registering agent:", error);
        res.status(500).json({
            error: "Cannot register the agent",
            details: error.message
        });
    }
};

export { registerAgent };

