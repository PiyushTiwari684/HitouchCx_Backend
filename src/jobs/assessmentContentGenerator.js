import prisma from "../config/db.js";
import assessmentConfig from "../config/assessmentConfig.js";


export async function generateAssessmentContent(assessmentId, assessmentType) {
  try {
    console.log(`[Background] Starting assessment content generation for ${assessmentId}`);

    // Step 1: Get configuration for this assessment type
    const config = assessmentConfig[assessmentType];
    if (!config) {
      console.error(`[Background] Invalid assessmentType: ${assessmentType}`);
      return;
    }

    let sectionsWithQuestions = [];
    let warnings = [];

    // Step 2: Create sections and map questions
    for (const sectionConf of config.sections) {
      const totalQuestions = sectionConf.rules.reduce((sum, r) => sum + r.count, 0);

      // Create section
      const section = await prisma.section.create({
        data: {
          assessmentId: assessmentId,
          name: sectionConf.name,
          description: `Section for ${sectionConf.name}`,
          orderIndex: sectionsWithQuestions.length + 1,
          durationMinutes: sectionConf.durationMinutes || 15,
          totalQuestions,
        },
      });

      let allQuestions = [];

      // Map questions to section based on rules
      for (const rule of sectionConf.rules) {
        const questions = await prisma.question.findMany({
          where: {
            questionType: sectionConf.type,
            cefrLevel: { in: rule.cefrLevels },
            assessmentType: assessmentType,
            isActive: true,
          },
          take: rule.count,
        });

        // Warning if not enough questions found
        if (questions.length < rule.count) {
          warnings.push(
            `Not enough questions for section "${sectionConf.name}" and CEFR [${rule.cefrLevels}]: found ${questions.length}, required ${rule.count}`
          );
        }

        // Batch insert question-section mappings (only if questions exist)
        if (questions.length > 0) {
          await prisma.$transaction(
            questions.map((q) =>
              prisma.questionSection.create({
                data: { sectionId: section.id, questionId: q.id },
              })
            )
          );
        }

        // Collect questions for response
        allQuestions.push(
          ...questions.map((q) => ({
            id: q.id,
            questionType: q.questionType,
            cefrLevel: q.cefrLevel,
            questionText: q.questionText,
          }))
        );
      }

      sectionsWithQuestions.push({
        id: section.id,
        name: section.name,
        orderIndex: section.orderIndex,
        questions: allQuestions,
      });
    }

    // Step 3: Update assessment status to ACTIVE when content is ready
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { status: "ACTIVE" },
    });

    console.log(`[Background] Assessment content generation completed for ${assessmentId}`);
    if (warnings.length > 0) {
      console.warn(`[Background] Warnings:`, warnings);
    }
  } catch (error) {
    console.error(`[Background] Error generating assessment content:`, error);

    // Update assessment status to indicate failure
    await prisma.assessment
      .update({
        where: { id: assessmentId },
        data: { status: "DRAFT" },
      })
      .catch((err) => console.error("[Background] Failed to update assessment status:", err));
  }
}
