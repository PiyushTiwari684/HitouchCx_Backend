 const Step = {
  VERIFY: 'VERIFY',
  SET_PASSWORD: 'SET_PASSWORD',
  PROFILE: 'PROFILE',
  KYC: 'KYC',
  ASSESSMENT_INTRO: 'ASSESSMENT_INTRO',
  ASSESSMENT: 'ASSESSMENT',
  AGREEMENTS: 'AGREEMENTS',
  DASHBOARD: 'DASHBOARD',
};


 function calculateNextStepCode(flags) {
  const {
    emailVerified = false,
    phoneVerified = false,
    status = 'INACTIVE',
    profileCompleted = false,
    kycCompleted = false,            // PENDING | APPROVED | REJECTED
    assessmentStatus = 'NOT_STARTED', // NOT_STARTED | IN_PROGRESS | COMPLETED
    agreementSigned = false,
  } = flags || {};

  if (!emailVerified || !phoneVerified) return Step.VERIFY;
  if (status !== 'ACTIVE') return Step.SET_PASSWORD;
  if (!profileCompleted) return Step.PROFILE;
  if (kycCompleted !== 'APPROVED') return Step.KYC;
  if (assessmentStatus !== 'COMPLETED') {
    return assessmentStatus === 'IN_PROGRESS' ? Step.ASSESSMENT : Step.ASSESSMENT_INTRO;
  }
  if (!agreementSigned) return Step.AGREEMENTS;
  return Step.DASHBOARD;
}

 function buildProgress(user = {}) {
  // Map DB → flags. Adjust field names to your schema.
  const flags = {
    emailVerified: user.emailVerified ?? false,
    phoneVerified: user.phoneVerified ?? false,
    status: user.status ?? 'INACTIVE',
    profileCompleted: user.profileCompleted ?? false,
    kycCompleted: user.kycCompleted ?? false,
    assessmentStatus: user.assessmentStatus ?? 'NOT_STARTED',
    agreementSigned: user.agreementSigned ?? false,
  };
  const stepCode = calculateNextStepCode(flags);
  return { stepCode,flags };
}

export {Step,stepToPath,calculateNextStepCode,buildProgress}