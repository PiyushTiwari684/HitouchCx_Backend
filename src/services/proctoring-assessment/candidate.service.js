import prisma from "../../config/db.js";

/**
 * Candidate Service
 * Handles all candidate-related business logic
 */
export async function getOrCreateCandidate(agentId) {
  // Step 1: Try to find existing candidate
  let candidate = await prisma.candidate.findFirst({
    where: { agentId }
  });

  // Step 2: If candidate exists, return it
  if (candidate) {
    console.log(`[CandidateService] Using existing candidate: ${candidate.id}`);
    return candidate;
  }

  // Step 3: Candidate doesn't exist, need to create one from agent data
  console.log(`[CandidateService] Creating new candidate for agentId: ${agentId}`);

  // Step 4: Fetch agent details with user info
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  // Step 5: Validate agent exists
  if (!agent) {
    throw new Error("Agent profile not found. Please complete registration first.");
  }

  // Step 6: Create candidate record (Agent → Candidate transition)
  candidate = await prisma.candidate.create({
    data: {
      agentId: agentId,
      email: agent.user.email,
      firstName: agent.firstName, // Get from Agent model, not User model
      lastName: agent.lastName || "", // Get from Agent model, not User model
    },
  });

  console.log(`✅ [CandidateService] Candidate created: ${candidate.id}`);
  return candidate;
}

export async function getOrCreateAgent(userId) {
  // Step 1: Find user with agent relation
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { agent: true },
  });

  // Step 2: Validate user exists
  if (!user) {
    throw new Error("User not found");
  }

  // Step 3: If agent exists, return agent ID
  if (user.agent) {
    console.log(`[CandidateService] Using existing agent: ${user.agent.id}`);
    return user.agent.id;
  }

  // Step 4: Agent doesn't exist - user needs to complete profile registration first
  console.log(`[CandidateService] Agent profile not found for user: ${userId}`);
  throw new Error("Agent profile not found. Please complete your profile registration with all required details (firstName, lastName, DOB) before taking the assessment.");
}

export async function verifyCandidateOwnership(candidateId, agentId) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { agentId: true },
  });

  if (!candidate) {
    return false;
  }

  return candidate.agentId === agentId;
}
