/**
 * Assessment Helper Functions
 * Utilities for handling assessment abandonment and routing logic
 */

/**
 * Check if assessment was abandoned and determine the appropriate route
 * @param {Object} assessment - CandidateAssessment object from database
 * @returns {Object} { isAbandoned: boolean, shouldResume: boolean, route: string }
 */
export function checkAssessmentAbandonment(assessment) {
  // If no assessment or not started, not abandoned
  if (!assessment || assessment.sessionStatus === 'NOT_STARTED') {
    return {
      isAbandoned: false,
      shouldResume: false,
      route: '/assessment/instructions'
    };
  }

  // If assessment completed, not abandoned
  if (assessment.sessionStatus === 'COMPLETED') {
    return {
      isAbandoned: false,
      shouldResume: false,
      route: '/thank-you' // FIXED: Correct route
    };
  }

  // If assessment is IN_PROGRESS or PAUSED, check abandonment conditions
  if (assessment.sessionStatus === 'IN_PROGRESS' || assessment.sessionStatus === 'PAUSED') {
    const now = new Date();
    const startedAt = new Date(assessment.startedAt);
    const timeDiffMinutes = (now - startedAt) / (1000 * 60); // Time difference in minutes

    // Case 1: User left BEFORE entering fullscreen
    if (!assessment.fullscreenEntered) {
      // If within 10-15 minute window, allow resume
      if (timeDiffMinutes <= 15) {
        return {
          isAbandoned: false,
          shouldResume: true,
          route: '/assessment/instructions' // FIXED: Restart from instructions (no dynamic params)
        };
      } else {
        // Beyond 15 minutes, mark as abandoned
        return {
          isAbandoned: true,
          shouldResume: false,
          route: '/thank-you' // FIXED: Correct route
        };
      }
    } else {
      // Case 2: User left AFTER entering fullscreen (during actual assessment)
      // Always redirect to thank you page
      return {
        isAbandoned: true,
        shouldResume: false,
        route: '/thank-you' // FIXED: Correct route
      };
    }
  }

  // For EXPIRED or TERMINATED status
  if (assessment.sessionStatus === 'EXPIRED' || assessment.sessionStatus === 'TERMINATED') {
    return {
      isAbandoned: true,
      shouldResume: false,
      route: '/thank-you' // FIXED: Correct route
    };
  }

  // Default fallback
  return {
    isAbandoned: false,
    shouldResume: false,
    route: '/assessment/instructions'
  };
}

/**
 * Get assessment status summary for login response
 * @param {Object} assessment - CandidateAssessment object
 * @returns {string} Summary status: 'not_started', 'in_progress', 'abandoned', 'completed'
 */
export function getAssessmentStatusSummary(assessment) {
  if (!assessment) return 'not_started';

  switch (assessment.sessionStatus) {
    case 'NOT_STARTED':
      return 'not_started';
    case 'IN_PROGRESS':
    case 'PAUSED':
      const abandonmentCheck = checkAssessmentAbandonment(assessment);
      return abandonmentCheck.isAbandoned ? 'abandoned' : 'in_progress';
    case 'COMPLETED':
      return 'completed';
    case 'EXPIRED':
    case 'TERMINATED':
      return 'abandoned';
    default:
      return 'not_started';
  }
}

/**
 * Calculate the next step in registration flow based on user's current progress
 * This is the master routing logic for the entire registration process
 *
 * @param {Object} user - User object from database
 * @param {Object} agent - Agent object from database (can be null)
 * @param {Object} assessment - CandidateAssessment object from database (can be null)
 * @returns {string} Route path where user should be redirected
 */
export function calculateNextStep(user, agent, assessment) {
  // Step 1: Check email verification (happens during signup)
  if (!user.emailVerified) {
    return '/signup'; // Should verify email first
  }

  // Step 2: Check profile completion (ProfileRegistration page)
  if (!user.profileCompleted) {
    return '/profile-registration'; // FIXED: Correct route
  }

  // Step 3: Check KYC status (KYC page)
  if (!agent || agent.kycStatus !== 'APPROVED') {
    return '/kyc';
  }

  // Step 4: Check assessment status
  if (!assessment) {
    // No assessment record exists, user hasn't started
    return '/assessment/instructions';
  }

  // Step 5: Handle assessment-related routing
  const assessmentCheck = checkAssessmentAbandonment(assessment);

  if (assessmentCheck.shouldResume) {
    // User can resume assessment (within 15 min, before fullscreen)
    return assessmentCheck.route; // Will return '/assessment/instructions' to restart
  }

  if (assessment.sessionStatus === 'NOT_STARTED') {
    return '/assessment/instructions';
  }

  if (assessment.sessionStatus === 'IN_PROGRESS' || assessment.sessionStatus === 'PAUSED') {
    // Already handled by checkAssessmentAbandonment above
    return assessmentCheck.route;
  }

  if (assessment.sessionStatus === 'COMPLETED' || assessmentCheck.isAbandoned) {
    // Assessment is done (completed or abandoned)
    // Step 6: Check if agreements are signed
    if (!user.agreementSigned) {
      return '/agreements';
    }

    // Step 7: Everything complete, go to dashboard
    return '/dashboard';
  }

  // Default fallback (shouldn't reach here normally)
  return '/dashboard';
}
