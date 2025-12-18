import prisma from "../config/db.js";

/**
 * Question Seed Script
 * This script populates the database with questions for assessments
 *
 * LANGUAGE Assessment Distribution (based on assessmentConfig.js):
 * - A1-A2 Writing: 30+ questions
 * - B1-B2 Writing: 20+ questions
 * - C1-C2 Writing: 20+ questions
 * - A1-A2 Speaking: 20+ questions
 * - B1-B2 Speaking: 20+ questions
 * - C1-C2 Speaking: 15+ questions
 * Total: 125+ questions
 *
 * CUSTOMER_SERVICE Assessment Distribution:
 * - Level 1 (Foundation - A1/A2): 25 questions (15 WRITING + 10 SPEAKING)
 * - Level 2 (Intermediate - B1/B2): 30 questions (20 WRITING + 10 SPEAKING)
 * - Level 3 (Advanced - C1): 25 questions (15 WRITING + 10 SPEAKING)
 * - Level 4 (Expert - C2): 20 questions (10 WRITING + 10 SPEAKING)
 * Total: 100 questions (60 WRITING + 40 SPEAKING)
 *
 * Instructions:
 * 1. Run: node src/seeds/questions.seed.js
 * 2. Verify with: SELECT "questionType", "cefrLevel", COUNT(*) FROM questions GROUP BY "questionType", "cefrLevel";
 */

// =================================================================
// WRITING QUESTIONS
// =================================================================

const writingQuestionsA1A2 = [
  // A1-A2 Level Writing Questions (Need 30+)
  {
    questionType: "WRITING",
    questionText:
      "Describe your typical day. What time do you wake up? What do you eat for breakfast?",
    cefrLevel: "A1",
    assessmentType: "LANGUAGE",
    isActive: true,
    wordCountMin: 50,
    wordCountMax: 100,
    timeLimit: 300, // 5 minutes in seconds
    skillTested: "Basic daily routine description",
  },
  {
    questionType: "WRITING",
    questionText: "Write about your family. How many people are in your family? What do they do?",
    cefrLevel: "A1",
    assessmentType: "LANGUAGE",
    isActive: true,
    wordCountMin: 50,
    wordCountMax: 100,
    timeLimit: 300,
    skillTested: "Basic description",
  },
  {
    questionType: "WRITING",
    questionText: "Describe your favorite food. Why do you like it?",
    cefrLevel: "A2",
    assessmentType: "LANGUAGE",
    isActive: true,
    wordCountMin: 60,
    wordCountMax: 120,
    timeLimit: 360,
    skillTested: "Personal preferences",
  },
  // TODO: Add 27 more A1-A2 writing questions here
];

const writingQuestionsB1B2 = [
  // B1-B2 Level Writing Questions (Need 20+)
  {
    questionType: "WRITING",
    questionText:
      "Describe a memorable trip you took. What made it special? What did you learn from it?",
    cefrLevel: "B1",
    assessmentType: "LANGUAGE",
    isActive: true,
    wordCountMin: 100,
    wordCountMax: 150,
    timeLimit: 480, // 8 minutes
    skillTested: "Narrative writing",
  },
  {
    questionType: "WRITING",
    questionText:
      "Write about an important decision you made in your life. How did you make this decision and what was the outcome?",
    cefrLevel: "B1",
    assessmentType: "LANGUAGE",
    isActive: true,
    wordCountMin: 100,
    wordCountMax: 150,
    timeLimit: 480,
    skillTested: "Reflective writing",
  },
  {
    questionType: "WRITING",
    questionText:
      "Describe the advantages and disadvantages of working from home. Which do you prefer and why?",
    cefrLevel: "B2",
    assessmentType: "LANGUAGE",
    isActive: true,
    wordCountMin: 120,
    wordCountMax: 180,
    timeLimit: 540, // 9 minutes
    skillTested: "Argumentative writing",
  },
  // TODO: Add 17 more B1-B2 writing questions here
];

const writingQuestionsC1C2 = [
  // C1-C2 Level Writing Questions (Need 20+)
  {
    questionType: "WRITING",
    questionText:
      "Discuss the impact of artificial intelligence on modern society. Consider both technological advancement and ethical implications.",
    cefrLevel: "C1",
    assessmentType: "LANGUAGE",
    isActive: true,
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 900, // 15 minutes
    skillTested: "Advanced argumentative writing",
  },
  {
    questionType: "WRITING",
    questionText:
      "Analyze the role of globalization in shaping contemporary culture. Provide specific examples to support your arguments.",
    cefrLevel: "C1",
    assessmentType: "LANGUAGE",
    isActive: true,
    wordCountMin: 200,
    wordCountMax: 300,
    timeLimit: 900,
    skillTested: "Analytical writing",
  },
  {
    questionType: "WRITING",
    questionText:
      "Evaluate the effectiveness of remote work policies in multinational corporations. Discuss challenges and propose solutions.",
    cefrLevel: "C2",
    assessmentType: "LANGUAGE",
    isActive: true,
    wordCountMin: 250,
    wordCountMax: 350,
    timeLimit: 1080, // 18 minutes
    skillTested: "Critical analysis and evaluation",
  },
  // TODO: Add 17 more C1-C2 writing questions here
];

// =================================================================
// SPEAKING QUESTIONS
// =================================================================

const speakingQuestionsA1A2 = [
  // A1-A2 Level Speaking Questions (Need 20+)
  {
    questionType: "SPEAKING",
    questionText: "Introduce yourself and tell us about your hobbies.",
    speakingPrompt: "Please speak for 30-60 seconds about yourself and your interests.",
    cefrLevel: "A1",
    assessmentType: "LANGUAGE",
    isActive: true,
    speakingDuration: 60,
    timeLimit: 90, // Includes thinking time
    skillTested: "Basic self-introduction",
  },
  {
    questionType: "SPEAKING",
    questionText: "Describe your typical day at work or school.",
    speakingPrompt: "Please speak for 45-60 seconds about your daily routine.",
    cefrLevel: "A1",
    assessmentType: "LANGUAGE",
    isActive: true,
    speakingDuration: 60,
    timeLimit: 90,
    skillTested: "Basic description",
  },
  {
    questionType: "SPEAKING",
    questionText: "Tell us about your favorite place in your city. Why do you like it?",
    speakingPrompt:
      "Please speak for 60-90 seconds about this place and explain why it's special to you.",
    cefrLevel: "A2",
    assessmentType: "LANGUAGE",
    isActive: true,
    speakingDuration: 90,
    timeLimit: 120,
    skillTested: "Description with reasons",
  },
  // TODO: Add 17 more A1-A2 speaking questions here
];

const speakingQuestionsB1B2 = [
  // B1-B2 Level Speaking Questions (Need 20+)
  {
    questionType: "SPEAKING",
    questionText:
      "Describe a challenging situation you faced at work or school. How did you handle it?",
    speakingPrompt:
      "Please speak for 90-120 seconds about a difficult experience and explain your approach to solving it.",
    cefrLevel: "B1",
    assessmentType: "LANGUAGE",
    isActive: true,
    speakingDuration: 120,
    timeLimit: 150,
    skillTested: "Problem-solving narrative",
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Discuss the advantages and disadvantages of learning languages online versus in a classroom.",
    speakingPrompt:
      "Please speak for 90-120 seconds comparing both methods and sharing your opinion.",
    cefrLevel: "B1",
    assessmentType: "LANGUAGE",
    isActive: true,
    speakingDuration: 120,
    timeLimit: 150,
    skillTested: "Comparison and opinion",
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Explain how technology has changed the way people communicate. Is this change positive or negative?",
    speakingPrompt:
      "Please speak for 120-150 seconds analyzing this change and presenting your perspective.",
    cefrLevel: "B2",
    assessmentType: "LANGUAGE",
    isActive: true,
    speakingDuration: 150,
    timeLimit: 180,
    skillTested: "Analysis and argumentation",
  },
  // TODO: Add 17 more B1-B2 speaking questions here
];

const speakingQuestionsC1C2 = [
  // C1-C2 Level Speaking Questions (Need 15+)
  {
    questionType: "SPEAKING",
    questionText:
      "Analyze the impact of artificial intelligence on the job market. What skills will be most valuable in the future?",
    speakingPrompt:
      "Please speak for 150-180 seconds providing a detailed analysis with examples and predictions.",
    cefrLevel: "C1",
    assessmentType: "LANGUAGE",
    isActive: true,
    speakingDuration: 180,
    timeLimit: 210,
    skillTested: "Complex analysis and prediction",
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Discuss the ethical implications of genetic engineering and CRISPR technology. Where should we draw the line?",
    speakingPrompt:
      "Please speak for 150-180 seconds exploring different perspectives and forming a nuanced argument.",
    cefrLevel: "C1",
    assessmentType: "LANGUAGE",
    isActive: true,
    speakingDuration: 180,
    timeLimit: 210,
    skillTested: "Ethical argumentation",
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Evaluate the role of international cooperation in addressing global challenges such as climate change, pandemics, and economic inequality.",
    speakingPrompt:
      "Please speak for 180-240 seconds critically analyzing effectiveness, challenges, and potential solutions.",
    cefrLevel: "C2",
    assessmentType: "LANGUAGE",
    isActive: true,
    speakingDuration: 240,
    timeLimit: 270,
    skillTested: "Sophisticated critical evaluation",
  },
  // TODO: Add 12 more C1-C2 speaking questions here
];

// =================================================================
// CUSTOMER SERVICE QUESTIONS - LANGUAGE ASSESSMENT
// Distribution: 60 WRITING + 40 SPEAKING = 100 questions
// =================================================================

const customerServiceLevel1 = [
  // LEVEL 1: FOUNDATION (Questions 1-25) - A1/A2 Level
  // 15 WRITING + 10 SPEAKING

  // WRITING Questions (1-15)
  {
    questionType: "WRITING",
    questionText: "Introduce yourself and explain what motivates you in customer-facing roles.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A1",
    isActive: true,
    skillTested: "Personal Communication",
    timeLimit: 180,
    wordCountMin: 50,
    wordCountMax: 150,
  },
  {
    questionType: "WRITING",
    questionText:
      "Describe your communication style and give an example of when it helped you succeed.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A1",
    isActive: true,
    skillTested: "Communication Style",
    timeLimit: 180,
    wordCountMin: 50,
    wordCountMax: 150,
  },
  {
    questionType: "WRITING",
    questionText: "What does excellent customer service mean to you personally?",
    assessmentType: "LANGUAGE",
    cefrLevel: "A1",
    isActive: true,
    skillTested: "Service Philosophy",
    timeLimit: 120,
    wordCountMin: 40,
    wordCountMax: 100,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer calls saying their order hasn't arrived. What are your first three steps?",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Problem Resolution",
    timeLimit: 120,
    wordCountMin: 40,
    wordCountMax: 120,
  },
  {
    questionType: "WRITING",
    questionText: "How would you greet and calm a customer who seems frustrated from the start?",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "De-escalation",
    timeLimit: 120,
    wordCountMin: 40,
    wordCountMax: 120,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer asks a question you don't know the answer to immediately. Walk me through your response.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Handling Uncertainty",
    timeLimit: 120,
    wordCountMin: 40,
    wordCountMax: 120,
  },
  {
    questionType: "WRITING",
    questionText:
      "Explain the process of making your favorite dish step-by-step to someone who has never cooked it.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Clear Instruction",
    timeLimit: 180,
    wordCountMin: 60,
    wordCountMax: 150,
  },
  {
    questionType: "WRITING",
    questionText:
      "How do you ensure you've correctly understood a customer's concern before trying to solve it?",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Comprehension Verification",
    timeLimit: 120,
    wordCountMin: 40,
    wordCountMax: 120,
  },
  {
    questionType: "WRITING",
    questionText:
      "What information would you gather first before attempting to resolve a customer's complaint?",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Information Gathering",
    timeLimit: 120,
    wordCountMin: 40,
    wordCountMax: 120,
  },
  {
    questionType: "WRITING",
    questionText:
      "What does empathy mean in a customer service context, and can you give an example?",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Empathy",
    timeLimit: 180,
    wordCountMin: 50,
    wordCountMax: 150,
  },
  {
    questionType: "WRITING",
    questionText:
      "How do you maintain patience when dealing with the same question repeatedly throughout your day?",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Patience",
    timeLimit: 120,
    wordCountMin: 40,
    wordCountMax: 120,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer received a damaged product. Describe the conversation you'd have with them from beginning to end.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Complete Interaction",
    timeLimit: 180,
    wordCountMin: 60,
    wordCountMax: 180,
  },
  {
    questionType: "WRITING",
    questionText:
      "What are the advantages and disadvantages of online shopping versus in-store shopping?",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Comparison Analysis",
    timeLimit: 180,
    wordCountMin: 50,
    wordCountMax: 150,
  },
  {
    questionType: "WRITING",
    questionText:
      "How would you explain artificial intelligence to someone with no technical background?",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Simplification",
    timeLimit: 180,
    wordCountMin: 50,
    wordCountMax: 150,
  },
  {
    questionType: "WRITING",
    questionText: "What steps would you take to learn a new software system required for your job?",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Learning Ability",
    timeLimit: 180,
    wordCountMin: 50,
    wordCountMax: 150,
  },

  // SPEAKING Questions (16-25)
  {
    questionType: "SPEAKING",
    questionText: "How would your previous colleagues or classmates describe your personality?",
    speakingPrompt: "Please speak for 60-90 seconds describing your personality traits.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A1",
    isActive: true,
    skillTested: "Self-Awareness",
    timeLimit: 120,
    speakingDuration: 90,
  },
  {
    questionType: "SPEAKING",
    questionText: "Tell me about your typical day and how you manage your time.",
    speakingPrompt: "Please speak for 60-90 seconds about your daily routine and time management.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Time Management",
    timeLimit: 120,
    speakingDuration: 90,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "How would you handle a customer who is speaking too fast or using unfamiliar terms?",
    speakingPrompt: "Please speak for 60-90 seconds explaining your approach.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Active Listening",
    timeLimit: 120,
    speakingDuration: 90,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "A customer requests a refund for a product they've been using for two weeks. What do you say?",
    speakingPrompt:
      "Please speak for 60-90 seconds explaining how you would handle this situation.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Policy Communication",
    timeLimit: 120,
    speakingDuration: 90,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Describe your hometown to someone who has never visited, highlighting what makes it unique.",
    speakingPrompt: "Please speak for 60-90 seconds describing your hometown.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Descriptive Communication",
    timeLimit: 120,
    speakingDuration: 90,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Explain how social media impacts modern communication - both positively and negatively.",
    speakingPrompt: "Please speak for 90-120 seconds discussing the impact of social media.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Analytical Thinking",
    timeLimit: 150,
    speakingDuration: 120,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Why is following up with customers important, even after their issue seems resolved?",
    speakingPrompt: "Please speak for 60-90 seconds explaining the importance of follow-up.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Follow-up",
    timeLimit: 120,
    speakingDuration: 90,
  },
  {
    questionType: "SPEAKING",
    questionText: "Describe a time when you made a mistake. How did you handle it?",
    speakingPrompt: "Please speak for 90-120 seconds sharing an example and your response.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Accountability",
    timeLimit: 150,
    speakingDuration: 120,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Compare working independently versus working in a team - which do you prefer and why?",
    speakingPrompt: "Please speak for 90-120 seconds comparing both approaches.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Teamwork",
    timeLimit: 150,
    speakingDuration: 120,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Describe a situation where miscommunication caused a problem and how you resolved it.",
    speakingPrompt: "Please speak for 90-120 seconds describing the situation and resolution.",
    assessmentType: "LANGUAGE",
    cefrLevel: "A2",
    isActive: true,
    skillTested: "Conflict Resolution",
    timeLimit: 150,
    speakingDuration: 120,
  },
];

const customerServiceLevel2 = [
  // LEVEL 2: INTERMEDIATE (Questions 26-55) - B1/B2 Level
  // 20 WRITING + 10 SPEAKING

  // WRITING Questions (26-45)
  {
    questionType: "WRITING",
    questionText:
      "You have three customers waiting: one is extremely angry, one has a quick question, and one needs detailed technical help. How do you prioritize and manage all three?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Prioritization",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer demands to speak with your manager immediately, but your manager won't be available for 2 hours. How do you handle this situation?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Escalation Management",
    timeLimit: 180,
    wordCountMin: 70,
    wordCountMax: 180,
  },
  {
    questionType: "WRITING",
    questionText:
      "How would you respond to a customer who insists on a solution that directly violates your company policy?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Policy Enforcement",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer is dissatisfied with the solution you've proposed and says 'this is unacceptable.' What's your next approach?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Objection Handling",
    timeLimit: 180,
    wordCountMin: 70,
    wordCountMax: 180,
  },
  {
    questionType: "WRITING",
    questionText:
      "You discover a billing error that benefited the customer, but they haven't noticed. What do you do?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Ethical Decision Making",
    timeLimit: 120,
    wordCountMin: 50,
    wordCountMax: 150,
  },
  {
    questionType: "WRITING",
    questionText:
      "How do you de-escalate a situation where a customer begins using inappropriate or offensive language?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "De-escalation",
    timeLimit: 180,
    wordCountMin: 70,
    wordCountMax: 180,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer is emotionally upset (crying or very distressed) about a service failure that affected their important event. How do you respond?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Emotional Intelligence",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "How would you handle a customer who accuses you personally of not caring about their problem?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Personal Resilience",
    timeLimit: 180,
    wordCountMin: 70,
    wordCountMax: 180,
  },
  {
    questionType: "WRITING",
    questionText:
      "You notice a pattern of similar complaints about a specific product feature over the past week. What do you do with this information?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Pattern Recognition",
    timeLimit: 180,
    wordCountMin: 70,
    wordCountMax: 180,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer claims an unauthorized charge appeared on their account. Walk me through your investigation process.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Investigation",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "How would you explain a complex return policy to a confused and frustrated customer?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Policy Explanation",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "Compare the skills needed to be a customer service representative versus a customer service manager.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Role Analysis",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "You're handling a complex issue when two urgent cases come in simultaneously. Explain your approach in real-time.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Multi-tasking",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "How do you balance speed and quality when you have performance metrics for both?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Balance",
    timeLimit: 180,
    wordCountMin: 70,
    wordCountMax: 180,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer needs a solution requiring coordination with billing, technical support, and shipping departments. Walk me through your process.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Cross-functional Coordination",
    timeLimit: 180,
    wordCountMin: 90,
    wordCountMax: 220,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer is about to purchase a product that won't actually solve their stated problem. What do you do?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Customer Advocacy",
    timeLimit: 180,
    wordCountMin: 70,
    wordCountMax: 180,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer is hesitant to try your proposed solution because they've had bad experiences before. How do you persuade them?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Trust Building",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "Walk me through your decision-making process when you face conflicting priorities.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Decision Making",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "What would you do if a colleague was consistently providing incorrect information to customers?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Professional Responsibility",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "How do you handle stress during peak periods when customer volume is overwhelming?",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Stress Management",
    timeLimit: 180,
    wordCountMin: 70,
    wordCountMax: 180,
  },

  // SPEAKING Questions (46-55)
  {
    questionType: "SPEAKING",
    questionText:
      "Describe a time when you had to remain calm and professional despite someone being unreasonable with you.",
    speakingPrompt: "Please speak for 120-150 seconds sharing a detailed example.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Emotional Control",
    timeLimit: 180,
    speakingDuration: 150,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "What's the difference between sympathy and empathy, and which is more effective in customer service?",
    speakingPrompt: "Please speak for 120-150 seconds explaining the difference and your opinion.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Empathy Understanding",
    timeLimit: 180,
    speakingDuration: 150,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "If you could change one thing about how companies handle customer complaints, what would it be and why?",
    speakingPrompt: "Please speak for 120-150 seconds explaining your proposed change.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Process Improvement",
    timeLimit: 180,
    speakingDuration: 150,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Describe a time when you had to learn something completely new under pressure. How did you adapt?",
    speakingPrompt:
      "Please speak for 120-150 seconds describing the experience and your adaptation.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Adaptability",
    timeLimit: 180,
    speakingDuration: 150,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "What would you do if you received harsh negative feedback from a customer while you were still trying to help them?",
    speakingPrompt: "Please speak for 120-150 seconds explaining your approach.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B1",
    isActive: true,
    skillTested: "Feedback Handling",
    timeLimit: 180,
    speakingDuration: 150,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Describe a time you anticipated someone's needs before they asked. What was the outcome?",
    speakingPrompt: "Please speak for 120-150 seconds sharing this experience.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Proactive Service",
    timeLimit: 180,
    speakingDuration: 150,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "How would you turn a dissatisfied customer into a loyal advocate for your company?",
    speakingPrompt: "Please speak for 120-150 seconds explaining your strategy.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Customer Retention",
    timeLimit: 180,
    speakingDuration: 150,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Convince me why companies should invest heavily in customer service training rather than marketing.",
    speakingPrompt: "Please speak for 120-150 seconds making a persuasive argument.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Persuasion",
    timeLimit: 180,
    speakingDuration: 150,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "How has technology changed customer service in the past five years, and where is it heading?",
    speakingPrompt: "Please speak for 150-180 seconds analyzing these changes and trends.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Industry Knowledge",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Describe your role in a successful team project. What did you specifically contribute?",
    speakingPrompt: "Please speak for 120-150 seconds describing your contribution.",
    assessmentType: "LANGUAGE",
    cefrLevel: "B2",
    isActive: true,
    skillTested: "Team Contribution",
    timeLimit: 180,
    speakingDuration: 150,
  },
];

const customerServiceLevel3 = [
  // LEVEL 3: ADVANCED (Questions 56-80) - C1 Level
  // 15 WRITING + 10 SPEAKING

  // WRITING Questions (56-70)
  {
    questionType: "WRITING",
    questionText:
      "A VIP customer threatens to cancel their account after a service failure that wasn't your department's fault. How do you retain them?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "VIP Retention",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "You realize a solution you confidently provided yesterday was incorrect, and now the customer's situation is worse. How do you rectify this?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Error Recovery",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer demands a full refund, but your records show they've already received three refunds this month for different issues. How do you proceed?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Fraud Detection",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "Two departments are giving you conflicting information about how to resolve a customer's urgent issue. How do you navigate this?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Conflict Navigation",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer is demanding $500 compensation for an issue that caused them approximately $50 in inconvenience. Negotiate a fair resolution.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Negotiation",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "How would you deliver news to a customer that their expected solution will take 3 more weeks, when they've already been waiting for 4 weeks?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Delivering Bad News",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer misunderstood your company's marketing and expected features you don't actually offer. Manage their expectations while maintaining the relationship.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Expectation Management",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "Craft your response to a customer who left a harsh public review containing both valid criticisms and factual inaccuracies.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Public Relations",
    timeLimit: 180,
    wordCountMin: 120,
    wordCountMax: 280,
  },
  {
    questionType: "WRITING",
    questionText:
      "How would you communicate a price increase to loyal, long-term customers without losing their business?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Change Communication",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "You must decide whether to approve an exception that could cost the company $300 to retain a customer relationship. Walk through your decision framework.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Cost-Benefit Analysis",
    timeLimit: 180,
    wordCountMin: 110,
    wordCountMax: 270,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer asks you to 'bend the rules just this once' and mentions they're friends with your supervisor. How do you respond?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Ethical Boundaries",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "How would you handle a situation where company policy clearly disadvantages the customer, and you personally agree with the customer?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Policy vs Values",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "You have 5 minutes left in your shift when a customer presents a complex problem that will take 45 minutes to resolve. What do you do?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Boundary Management",
    timeLimit: 180,
    wordCountMin: 80,
    wordCountMax: 200,
  },
  {
    questionType: "WRITING",
    questionText:
      "Based on your customer interactions, how would you improve your company's service process or product?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Process Improvement",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "What metrics would you use to measure whether customer service is truly effective, beyond satisfaction scores?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Performance Metrics",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },

  // SPEAKING Questions (71-80)
  {
    questionType: "SPEAKING",
    questionText:
      "Persuade a skeptical customer to try a solution they've already mentally rejected.",
    speakingPrompt: "Please speak for 150-180 seconds making a persuasive case.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Advanced Persuasion",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "A customer threatens legal action over a service issue. How do you respond while protecting both the customer relationship and the company?",
    speakingPrompt: "Please speak for 150-180 seconds explaining your approach.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Legal Threat Management",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "A newer team member asks for your advice on handling aggressive customers. What specific techniques do you teach them?",
    speakingPrompt: "Please speak for 150-180 seconds sharing specific techniques.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Mentorship",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "You notice a colleague struggling with a difficult customer interaction. How and when do you intervene?",
    speakingPrompt: "Please speak for 120-150 seconds explaining your intervention strategy.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Team Support",
    timeLimit: 180,
    speakingDuration: 150,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "How do you give constructive feedback to a peer without damaging your working relationship?",
    speakingPrompt: "Please speak for 120-150 seconds explaining your approach.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Feedback Delivery",
    timeLimit: 180,
    speakingDuration: 150,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "What does 'customer success' mean beyond just 'customer satisfaction,' and why does the distinction matter?",
    speakingPrompt: "Please speak for 150-180 seconds explaining this concept.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Conceptual Understanding",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText: "Argue for or against this statement: 'The customer is always right.'",
    speakingPrompt: "Please speak for 150-180 seconds presenting your argument.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Critical Argumentation",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "How would you balance company profitability with customer advocacy in your decision-making?",
    speakingPrompt: "Please speak for 150-180 seconds explaining your approach.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Strategic Balance",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "What's more valuable in customer service: following established processes or using individual judgment? Defend your position.",
    speakingPrompt: "Please speak for 150-180 seconds defending your position.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Process vs Judgment",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Describe how you would handle a situation where the right solution for the customer conflicts with your performance targets.",
    speakingPrompt: "Please speak for 150-180 seconds explaining your approach.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C1",
    isActive: true,
    skillTested: "Ethical Leadership",
    timeLimit: 180,
    speakingDuration: 180,
  },
];

const customerServiceLevel4 = [
  // LEVEL 4: EXPERT (Questions 81-100) - C2 Level
  // 10 WRITING + 10 SPEAKING

  // WRITING Questions (81-90)
  {
    questionType: "WRITING",
    questionText:
      "A system outage has affected 1,000 customers. You're flooded with inquiries, have no clear timeline for resolution, and customers are threatening to leave. How do you manage this crisis?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Crisis Management",
    timeLimit: 180,
    wordCountMin: 120,
    wordCountMax: 300,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer's complaint reveals a potential security vulnerability in your product. How do you handle the customer while addressing the larger issue?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Security Management",
    timeLimit: 180,
    wordCountMin: 120,
    wordCountMax: 300,
  },
  {
    questionType: "WRITING",
    questionText:
      "You discover that a popular solution your team has been using for months actually violates a policy you just learned about. What do you do?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Compliance Management",
    timeLimit: 180,
    wordCountMin: 120,
    wordCountMax: 300,
  },
  {
    questionType: "WRITING",
    questionText:
      "A language barrier is preventing you from understanding a customer's urgent problem, and no translator is immediately available. How do you proceed?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Cross-cultural Communication",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "A customer wants you to confirm information that you suspect might be for fraudulent purposes. How do you handle this sensitively?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Fraud Prevention",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "If you could redesign the entire customer service experience for your industry, what would you change and why?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Visionary Thinking",
    timeLimit: 180,
    wordCountMin: 130,
    wordCountMax: 320,
  },
  {
    questionType: "WRITING",
    questionText:
      "What's the relationship between employee satisfaction and customer satisfaction, and how would you leverage this?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Strategic Insight",
    timeLimit: 180,
    wordCountMin: 120,
    wordCountMax: 300,
  },
  {
    questionType: "WRITING",
    questionText:
      "Design a training program for new customer service representatives based on your experience. What are the key components?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Program Design",
    timeLimit: 180,
    wordCountMin: 130,
    wordCountMax: 320,
  },
  {
    questionType: "WRITING",
    questionText:
      "How do you measure your own success beyond metrics like call time and resolution rate?",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Self-Assessment",
    timeLimit: 180,
    wordCountMin: 100,
    wordCountMax: 250,
  },
  {
    questionType: "WRITING",
    questionText:
      "Mediate a situation where a customer and another department are both partially right and partially wrong about who's responsible for an issue.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Mediation",
    timeLimit: 180,
    wordCountMin: 120,
    wordCountMax: 300,
  },

  // SPEAKING Questions (91-100)
  {
    questionType: "SPEAKING",
    questionText:
      "How will artificial intelligence and automation change customer service roles in the next 5 years, and how should professionals prepare?",
    speakingPrompt:
      "Please speak for 150-180 seconds analyzing future trends and preparation strategies.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Future Planning",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Explain to a group of engineers why customer feedback should influence product development priorities, even when it conflicts with technical vision.",
    speakingPrompt: "Please speak for 150-180 seconds making this case to engineers.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Cross-functional Influence",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "A customer with a large social media following is publicly criticizing your company in real-time during your interaction. How do you handle this?",
    speakingPrompt: "Please speak for 150-180 seconds explaining your strategy.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Social Media Crisis",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Convince a cost-conscious executive why investing in customer service improvements will increase profitability.",
    speakingPrompt: "Please speak for 150-180 seconds making this business case.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Executive Persuasion",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "How would you communicate bad news about a product discontinuation to customers who depend on it?",
    speakingPrompt: "Please speak for 150-180 seconds explaining your communication strategy.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Change Management",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "What's your biggest weakness in customer-facing situations, and what specific steps are you taking to improve it?",
    speakingPrompt: "Please speak for 150-180 seconds with honest self-reflection.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Self-Awareness",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Describe the most difficult customer interaction you've ever had. What did you learn, and how did it change your approach?",
    speakingPrompt: "Please speak for 150-180 seconds sharing this experience and insights.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Reflective Learning",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "How do you prevent burnout and maintain genuine enthusiasm when dealing with hundreds of customer issues?",
    speakingPrompt: "Please speak for 150-180 seconds sharing your strategies.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Resilience",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "What separates good customer service representatives from exceptional ones, based on your observations?",
    speakingPrompt: "Please speak for 150-180 seconds analyzing this distinction.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Excellence Definition",
    timeLimit: 180,
    speakingDuration: 180,
  },
  {
    questionType: "SPEAKING",
    questionText:
      "Where do you see yourself in 3 years, and how will the skills from customer service roles help you get there?",
    speakingPrompt: "Please speak for 150-180 seconds articulating your career vision.",
    assessmentType: "LANGUAGE",
    cefrLevel: "C2",
    isActive: true,
    skillTested: "Career Vision",
    timeLimit: 180,
    speakingDuration: 180,
  },
];

// =================================================================
// SEED FUNCTION
// =================================================================

export async function seedQuestions() {
  console.log("🌱 Starting question seeding process...\n");

  try {
    // Optional: Clear existing questions (ONLY for development/testing)
    // Uncomment the lines below if you want to start fresh
    // console.log("⚠️  Deleting existing questions...");
    // await prisma.question.deleteMany();
    // console.log("✅ Existing questions deleted\n");

    // =================================================================
    // CHECK FOR EXISTING QUESTIONS TO PREVENT DUPLICATES
    // =================================================================

    console.log("🔍 Checking for existing questions...");
    const existingQuestions = await prisma.question.findMany({
      select: { questionText: true },
    });
    const existingTexts = new Set(existingQuestions.map((q) => q.questionText));
    console.log(`   Found ${existingTexts.size} existing questions in database\n`);

    // =================================================================
    // LANGUAGE ASSESSMENT SEEDING
    // =================================================================

    // Combine all LANGUAGE question arrays
    const allWritingQuestions = [
      ...writingQuestionsA1A2,
      ...writingQuestionsB1B2,
      ...writingQuestionsC1C2,
    ];

    const allSpeakingQuestions = [
      ...speakingQuestionsA1A2,
      ...speakingQuestionsB1B2,
      ...speakingQuestionsC1C2,
    ];

    // Filter out duplicates
    const newWritingQuestions = allWritingQuestions.filter(
      (q) => !existingTexts.has(q.questionText),
    );
    const newSpeakingQuestions = allSpeakingQuestions.filter(
      (q) => !existingTexts.has(q.questionText),
    );

    // Insert writing questions
    if (newWritingQuestions.length > 0) {
      console.log(
        `📝 Inserting ${newWritingQuestions.length} new writing questions (${allWritingQuestions.length - newWritingQuestions.length} already exist)...`,
      );
      const writingResult = await prisma.question.createMany({
        data: newWritingQuestions,
        skipDuplicates: true,
      });
      console.log(`✅ Inserted ${writingResult.count} writing questions\n`);
    } else if (allWritingQuestions.length > 0) {
      console.log(
        `⏭️  Skipping ${allWritingQuestions.length} writing questions (all already exist)\n`,
      );
    }

    // Insert speaking questions
    if (newSpeakingQuestions.length > 0) {
      console.log(
        `🎤 Inserting ${newSpeakingQuestions.length} new speaking questions (${allSpeakingQuestions.length - newSpeakingQuestions.length} already exist)...`,
      );
      const speakingResult = await prisma.question.createMany({
        data: newSpeakingQuestions,
        skipDuplicates: true,
      });
      console.log(`✅ Inserted ${speakingResult.count} speaking questions\n`);
    } else if (allSpeakingQuestions.length > 0) {
      console.log(
        `⏭️  Skipping ${allSpeakingQuestions.length} speaking questions (all already exist)\n`,
      );
    }

    // =================================================================
    // CUSTOMER SERVICE ASSESSMENT SEEDING
    // =================================================================

    // Combine all CUSTOMER_SERVICE question arrays
    const allCustomerServiceQuestions = [
      ...customerServiceLevel1,
      ...customerServiceLevel2,
      ...customerServiceLevel3,
      ...customerServiceLevel4,
    ];

    // Filter out duplicates
    const newCustomerServiceQuestions = allCustomerServiceQuestions.filter(
      (q) => !existingTexts.has(q.questionText),
    );

    // Insert customer service questions
    if (newCustomerServiceQuestions.length > 0) {
      console.log(
        `📞 Inserting ${newCustomerServiceQuestions.length} new customer service questions (${allCustomerServiceQuestions.length - newCustomerServiceQuestions.length} already exist)...`,
      );
      const csResult = await prisma.question.createMany({
        data: newCustomerServiceQuestions,
        skipDuplicates: true,
      });
      console.log(`✅ Inserted ${csResult.count} customer service questions\n`);
    } else if (allCustomerServiceQuestions.length > 0) {
      console.log(
        `⏭️  Skipping ${allCustomerServiceQuestions.length} customer service questions (all already exist)\n`,
      );
    }

    // =================================================================
    // VERIFICATION AND REPORTING
    // =================================================================

    console.log("📊 Verifying question distribution...\n");

    // Get all questions grouped by type and level
    const distribution = await prisma.question.groupBy({
      by: ["assessmentType", "questionType", "cefrLevel"],
      where: {
        isActive: true,
      },
      _count: {
        id: true,
      },
      orderBy: [{ assessmentType: "asc" }, { questionType: "asc" }, { cefrLevel: "asc" }],
    });

    console.log("Current Question Distribution:");
    console.log("┌──────────────────────┬──────────────┬──────────────┬───────┐");
    console.log("│ Assessment Type      │ Question Type│ CEFR/Level   │ Count │");
    console.log("├──────────────────────┼──────────────┼──────────────┼───────┤");

    let totalCount = 0;
    let languageCount = 0;
    let customerServiceCount = 0;

    distribution.forEach((row) => {
      const assessmentType = (row.assessmentType || "").padEnd(20);
      const questionType = (row.questionType || "").padEnd(12);
      const cefrLevel = (row.cefrLevel || "").padEnd(12);
      const count = row._count.id.toString().padStart(5);
      console.log(`│ ${assessmentType} │ ${questionType} │ ${cefrLevel} │ ${count} │`);
      totalCount += row._count.id;

      if (row.assessmentType === "LANGUAGE") {
        languageCount += row._count.id;
      }
    });

    console.log("├──────────────────────┴──────────────┴──────────────┼───────┤");
    console.log(
      `│ TOTAL                                                │ ${totalCount.toString().padStart(5)} │`,
    );
    console.log("└──────────────────────────────────────────────────────┴───────┘\n");

    // Language Assessment Requirements Check
    if (languageCount > 0) {
      console.log("✅ LANGUAGE Assessment Summary:");
      console.log(`   Total Questions: ${languageCount}`);

      if (languageCount < 125) {
        console.log(
          `   ⚠️  WARNING: You have ${languageCount} language questions. Recommended minimum is 125.`,
        );
      }
      console.log("");
    }

    // Customer Service Assessment Check
    const csWritingCount = distribution
      .filter(
        (row) =>
          row.assessmentType === "LANGUAGE" &&
          row.questionType === "WRITING" &&
          (row.cefrLevel === "A1" ||
            row.cefrLevel === "A2" ||
            row.cefrLevel === "B1" ||
            row.cefrLevel === "B2" ||
            row.cefrLevel === "C1" ||
            row.cefrLevel === "C2"),
      )
      .reduce((sum, row) => sum + row._count.id, 0);

    const csSpeakingCount = distribution
      .filter(
        (row) =>
          row.assessmentType === "LANGUAGE" &&
          row.questionType === "SPEAKING" &&
          (row.cefrLevel === "A1" ||
            row.cefrLevel === "A2" ||
            row.cefrLevel === "B1" ||
            row.cefrLevel === "B2" ||
            row.cefrLevel === "C1" ||
            row.cefrLevel === "C2"),
      )
      .reduce((sum, row) => sum + row._count.id, 0);

    const customerServiceTotal = allCustomerServiceQuestions.length;

    if (customerServiceTotal > 0) {
      console.log("✅ CUSTOMER SERVICE Assessment Summary:");
      console.log(`   Total Questions: ${customerServiceTotal}`);
      console.log(`   - WRITING: 60`);
      console.log(`   - SPEAKING: 40`);
      console.log(`   Distribution by Level:`);
      console.log(`   - Level 1 (A1/A2): 25 questions`);
      console.log(`   - Level 2 (B1/B2): 30 questions`);
      console.log(`   - Level 3 (C1): 25 questions`);
      console.log(`   - Level 4 (C2): 20 questions`);
      console.log("");
    }

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding questions:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
seedQuestions()
  .then(() => {
    console.log("\n🎉 Seeding process finished!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });
