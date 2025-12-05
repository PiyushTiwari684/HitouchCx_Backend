import prisma from "../../config/db.js";

/**
 * Attempt Service
 * Handles all candidate assessment attempt-related business logic
*/

export async function createAttempt(candidateId, assessmentId) {
  // Step 1: Validate assessment exists
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  // Step 2: Get all previous attempts for this candidate + assessment
  const existingAttempts = await prisma.candidateAssessment.findMany({
    where: {
      candidateId: candidateId,
      assessmentId: assessmentId,
    },
  });

  // Step 3: Check if max attempts exceeded
  if (existingAttempts.length >= assessment.maxAttempts) {
    throw new Error(
      `Maximum attempts (${assessment.maxAttempts}) exceeded for this assessment`
    );
  }

  // Step 4: Create new attempt
  const attempt = await prisma.candidateAssessment.create({
    data: {
      candidateId: candidateId,
      assessmentId: assessmentId,
      attemptNumber: existingAttempts.length + 1,
      sessionStatus: "NOT_STARTED",
      verificationStatus: "NOT_STARTED",
      startedAt: new Date(),
    },
  });

  console.log(
    `✅ [AttemptService] Assessment attempt created: ${attempt.id} (attempt #${attempt.attemptNumber})`
  );

  // Step 5: Return attempt with metadata
  return {
    candidateId: attempt.candidateId,
    attemptId: attempt.id,
    assessmentId: attempt.assessmentId,
    attemptNumber: attempt.attemptNumber,
    sessionStatus: attempt.sessionStatus,
    maxAttempts: assessment.maxAttempts,
    attemptsRemaining: assessment.maxAttempts - attempt.attemptNumber,
  };
}


export async function getAttemptDetails(attemptId, agentId) {
  // Step 1: Fetch the attempt
  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      assessmentId: true,
      candidateId: true,
      attemptNumber: true,
      sessionStatus: true,
      verificationStatus: true,
    },
  });

  if (!attempt) {
    throw new Error("Assessment attempt not found");
  }

  // Step 2: Verify ownership (candidate belongs to agent)
  const candidate = await prisma.candidate.findUnique({
    where: { id: attempt.candidateId },
    select: { agentId: true },
  });

  if (!candidate || candidate.agentId !== agentId) {
    throw new Error("Unauthorized access to this assessment attempt");
  }

  return attempt;
}


export async function getAssessmentForAttempt(assessmentId, attemptId, agentId) {
  // Step 1: Verify candidate attempt exists and get candidateId
  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    include: {
      assessment: {
        include: {
          sections: {
            orderBy: { orderIndex: "asc" },
            include: {
              questions: {
                include: {
                  question: true, // Include full question details
                },
              },
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("Assessment attempt not found");
  }

  const candidateId = attempt.candidateId;

  // Step 2: Verify this attempt belongs to the authenticated user's agent
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { agentId: true },
  });

  if (!candidate || candidate.agentId !== agentId) {
    throw new Error("Unauthorized access to this assessment");
  }

  // Step 3: Verify assessmentId matches
  if (attempt.assessmentId !== assessmentId) {
    throw new Error("Assessment ID mismatch");
  }

  // Step 4: Transform data for frontend
  const sections = attempt.assessment.sections.map((section) => ({
    id: section.id,
    name: section.name,
    description: section.description,
    orderIndex: section.orderIndex,
    durationMinutes: section.durationMinutes,
    totalQuestions: section.totalQuestions,
    questions: section.questions.map((qs) => ({
      id: qs.question.id,
      questionType: qs.question.questionType,
      cefrLevel: qs.question.cefrLevel,
      taskLevel: qs.question.taskLevel,
      questionText: qs.question.questionText,
      options: qs.question.options, // For MCQ
      mediaUrl: qs.question.mediaUrl, // If any
      speakingDuration: qs.question.speakingDuration, // For SPEAKING questions
      speakingPrompt: qs.question.speakingPrompt, // For SPEAKING questions
    })),
  }));

  // Step 5: Return formatted assessment data
  return {
    assessmentId: attempt.assessment.id,
    attemptId: attempt.id,
    title: attempt.assessment.title,
    description: attempt.assessment.description,
    totalDuration: attempt.assessment.totalDuration,
    attemptNumber: attempt.attemptNumber,
    sessionStatus: attempt.sessionStatus,
    sections,
  };
}


export async function validateAttemptOwnership(attemptId, agentId) {
  const attempt = await prisma.candidateAssessment.findUnique({
    where: { id: attemptId },
    select: {
      candidate: {
        select: {
          agentId: true,
        },
      },
    },
  });

  if (!attempt || !attempt.candidate) {
    return false;
  }

  return attempt.candidate.agentId === agentId;
}
