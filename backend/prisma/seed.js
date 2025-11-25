import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create sample questions for LANGUAGE assessment
  console.log('📝 Creating WRITING questions...');

  // Writing questions - A1-A2 level
  await prisma.question.createMany({
    data: [
      {
        questionType: 'WRITING',
        questionText: 'Write a short paragraph (50-100 words) about your daily routine.',
        cefrLevel: 'A1',
        taskLevel: 'LEVEL_1',
        sectionType: 'WRITING',
        assessmentType: 'LANGUAGE',
        wordCountMin: 50,
        wordCountMax: 100,
        skillTested: 'Basic writing',
        isActive: true,
      },
      {
        questionType: 'WRITING',
        questionText: 'Describe your favorite food in 50-100 words.',
        cefrLevel: 'A2',
        taskLevel: 'LEVEL_1',
        sectionType: 'WRITING',
        assessmentType: 'LANGUAGE',
        wordCountMin: 50,
        wordCountMax: 100,
        skillTested: 'Basic description',
        isActive: true,
      },
      {
        questionType: 'WRITING',
        questionText: 'Write about your last vacation or weekend trip (50-100 words).',
        cefrLevel: 'A2',
        taskLevel: 'LEVEL_1',
        sectionType: 'WRITING',
        assessmentType: 'LANGUAGE',
        wordCountMin: 50,
        wordCountMax: 100,
        skillTested: 'Past tense narration',
        isActive: true,
      },
    ],
  });

  // Writing questions - B1-B2 level
  await prisma.question.createMany({
    data: [
      {
        questionType: 'WRITING',
        questionText: 'Write a formal email (100-150 words) to your manager requesting time off for a family event.',
        cefrLevel: 'B1',
        taskLevel: 'LEVEL_2',
        sectionType: 'WRITING',
        assessmentType: 'LANGUAGE',
        wordCountMin: 100,
        wordCountMax: 150,
        skillTested: 'Formal writing',
        isActive: true,
      },
      {
        questionType: 'WRITING',
        questionText: 'Describe the advantages and disadvantages of working from home (100-150 words).',
        cefrLevel: 'B2',
        taskLevel: 'LEVEL_2',
        sectionType: 'WRITING',
        assessmentType: 'LANGUAGE',
        wordCountMin: 100,
        wordCountMax: 150,
        skillTested: 'Argumentative writing',
        isActive: true,
      },
    ],
  });

  // Writing questions - C1-C2 level
  await prisma.question.createMany({
    data: [
      {
        questionType: 'WRITING',
        questionText: 'Write a critical analysis (150-200 words) of how technology has impacted modern workplace communication.',
        cefrLevel: 'C1',
        taskLevel: 'LEVEL_3',
        sectionType: 'WRITING',
        assessmentType: 'LANGUAGE',
        wordCountMin: 150,
        wordCountMax: 200,
        skillTested: 'Advanced analysis',
        isActive: true,
      },
    ],
  });

  console.log('✅ Created 7 WRITING questions\n');

  // Speaking questions - A1-A2 level
  console.log('🎤 Creating SPEAKING questions...');

  await prisma.question.createMany({
    data: [
      {
        questionType: 'SPEAKING',
        questionText: 'Introduce yourself: What is your name, where are you from, and what do you do?',
        speakingPrompt: 'Please speak for 30-45 seconds about yourself.',
        speakingDuration: 45,
        cefrLevel: 'A1',
        taskLevel: 'LEVEL_1',
        sectionType: 'SPEAKING',
        assessmentType: 'LANGUAGE',
        skillTested: 'Basic self-introduction',
        isActive: true,
      },
      {
        questionType: 'SPEAKING',
        questionText: 'Describe your hometown or city. What do you like about it?',
        speakingPrompt: 'Please speak for 30-45 seconds about your hometown.',
        speakingDuration: 45,
        cefrLevel: 'A2',
        taskLevel: 'LEVEL_1',
        sectionType: 'SPEAKING',
        assessmentType: 'LANGUAGE',
        skillTested: 'Basic description',
        isActive: true,
      },
    ],
  });

  // Speaking questions - B1-B2 level
  await prisma.question.createMany({
    data: [
      {
        questionType: 'SPEAKING',
        questionText: 'Describe a challenging situation you faced at work or school and how you resolved it.',
        speakingPrompt: 'Please speak for 60 seconds about a challenge you overcame.',
        speakingDuration: 60,
        cefrLevel: 'B1',
        taskLevel: 'LEVEL_2',
        sectionType: 'SPEAKING',
        assessmentType: 'LANGUAGE',
        skillTested: 'Narrative speaking',
        isActive: true,
      },
      {
        questionType: 'SPEAKING',
        questionText: 'What are your thoughts on remote work? Discuss both benefits and challenges.',
        speakingPrompt: 'Please speak for 60-90 seconds presenting your viewpoint.',
        speakingDuration: 90,
        cefrLevel: 'B2',
        taskLevel: 'LEVEL_2',
        sectionType: 'SPEAKING',
        assessmentType: 'LANGUAGE',
        skillTested: 'Opinion expression',
        isActive: true,
      },
    ],
  });

  console.log('✅ Created 4 SPEAKING questions\n');

  const totalQuestions = await prisma.question.count();
  console.log(`\n✨ Seed completed! Total questions in database: ${totalQuestions}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
