 const Step = {
  PROFILE: 'PROFILE',
  KYC: 'KYC',
  ASSESSMENT_INTRO: 'ASSESSMENT_INTRO',
  ASSESSMENT: 'ASSESSMENT',
  AGREEMENTS: 'AGREEMENTS',
  DASHBOARD: 'DASHBOARD',
};


 function calculateNextStepCode(flags) {
  const {
    profileCompleted = false,
    kycCompleted = false,            // PENDING | APPROVED | REJECTED
    assessmentStatus = 'NOT_STARTED', // NOT_STARTED | IN_PROGRESS | COMPLETED
    agreementSigned = false,
  } = flags || {};

  if (!profileCompleted) return Step.PROFILE;
  if (kycCompleted !== true) return Step.KYC;
  if (assessmentStatus !== 'COMPLETED') {
    return assessmentStatus === 'IN_PROGRESS' ? Step.ASSESSMENT : Step.ASSESSMENT_INTRO;
  }
  if (!agreementSigned) return Step.AGREEMENTS;
  return Step.DASHBOARD;
}

 function buildProgress(user = {}) {
  // Map DB → flags. Adjust field names to your schema.
  const flags = {
    status: user.status ?? 'INACTIVE',
    profileCompleted: user.profileCompleted ?? false,
    kycCompleted: user.kycCompleted ?? false,
    assessmentStatus: user.assessmentStatus ?? 'NOT_STARTED',
    agreementSigned: user.agreementSigned ?? false,
  };
  const nextStep = calculateNextStepCode(flags);
  return { nextStep,flags };
}

export {buildProgress}