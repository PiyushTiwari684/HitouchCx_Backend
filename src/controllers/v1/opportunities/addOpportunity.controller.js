import express from 'express';
import {
  PrismaClient,
  ServiceCategory,
  ProcessType,
  PaymentType,
  OpportunityStatus,
  VisibilityLevel,
  LanguageProficiency,
  ProjectStatus
} from '@prisma/client';



const prisma = new PrismaClient();

// Helper to safely create a Set from a Prisma enum (avoids crash if undefined)
const toSet = (e) => e ? new Set(Object.values(e)) : new Set();

/* Prisma is an object like : const Prisma = {
  ServiceCategory: { BPO: 'BPO', CONTENT: 'CONTENT', TECH: 'TECH' }
  // ...
} so toSet converts those object to the set of respective values of these enums */

const ServiceCategoryValues     = toSet(ServiceCategory);
const ProcessTypeValues         = toSet(ProcessType);
const PaymentTypeValues         = toSet(PaymentType);
const OpportunityStatusValues   = toSet(OpportunityStatus);
const VisibilityLevelValues     = toSet(VisibilityLevel);
const LanguageProficiencyValues = toSet(LanguageProficiency);
const ProjectStatusValues       = toSet(ProjectStatus);


const addOpportunity = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      processType,
      deadline,
      payAmount,
      currency,
      paymentType,
      status,
      visibility,
      projectId,
      minimumSkills,
      requiredLanguages,
      minimumQualifications,
      minimumL1Score,
      preferredExperience
    } = req.body;
    console.log(ServiceCategoryValues)

    if (!title || !description || !processType || !deadline || !payAmount || !projectId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Validate enums
    if (category && !ServiceCategoryValues.has(category)) {
      return res.status(400).json({ error: 'Invalid category.' });
    }
    if (!ProcessTypeValues.has(processType)) {
      return res.status(400).json({ error: 'Invalid processType.' });
    }
    if (paymentType && !PaymentTypeValues.has(paymentType)) {
      return res.status(400).json({ error: 'Invalid paymentType.' });
    }
    if (status && !OpportunityStatusValues.has(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    if (visibility && !VisibilityLevelValues.has(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility.' });
    }
    if (minimumL1Score && !LanguageProficiencyValues.has(minimumL1Score)) {
      return res.status(400).json({ error: 'Invalid minimumL1Score.' });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ error: 'Invalid deadline date.' });
    }

    const skillsArray = Array.isArray(minimumSkills) ? minimumSkills : [];
    const languagesArray = Array.isArray(requiredLanguages) ? requiredLanguages : [];
    const normalizedPayAmount = typeof payAmount === 'number' ? payAmount.toString() : payAmount;

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (!project) throw new Error('PROJECT_NOT_FOUND');

      if (project.status === 'PLANNING') {
        await tx.project.update({
          where: { id: projectId },
          data: { status: 'ACTIVE' }
        });
      }

      const opportunity = await tx.opportunity.create({
        data: {
          title,
          description,
          category: category || 'BPO',
          processType,
          deadline: deadlineDate,
            payAmount: normalizedPayAmount,
          currency: currency || 'INR',
          paymentType: paymentType || 'FIXED',
          status: status || 'OPEN',
          visibility: visibility || 'PUBLIC',
          projectId,
          minimumSkills: skillsArray,
          requiredLanguages: languagesArray,
          minimumQualifications: minimumQualifications || undefined,
          minimumL1Score: minimumL1Score || 'A1',
          preferredExperience: preferredExperience || undefined
        }
      });

      return opportunity;
    });

    return res.status(201).json({ data: result });
  } catch (err) {
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({ error: 'Project not found.' });
    }
    return res.status(500).json({ error: 'Internal server error.', detail: err.message });
  }
};


export { addOpportunity };






