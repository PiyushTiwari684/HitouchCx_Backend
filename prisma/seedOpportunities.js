import prisma from '../src/config/db.js';


function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  // Ensure a sample client and project exist
  const client = await prisma.client.create({
    data: {
      name: 'Sample Client',
      email: `sample.client.${Date.now()}@example.com`,
      companyName: 'Sample Co',
    },
  });

  const project = await prisma.project.create({
    data: {
      title: 'Sample Support & Tech Project',
      description: 'Sample project for seeding opportunities',
      department: 'TECH',
      totalHoursNeeded: 300,
      agentsNeeded: 5,
      skillsRequired: ['Communication', 'CRM', 'Problem Solving'],
      totalBudget: '150000.00',
      currency: 'INR',
      projectDeadline: addDays(60),
      status: 'ACTIVE',
      clientId: client.id,
    },
  });

  // Common fields
  const preferredExperience = [
  { "industry": "TECH", "experienceMin": 1, "experienceMax": 5, "vertical": "PROMPT_ENGINEERING" },
  { "industry": "BPO",  "experienceMin": 1, "experienceMax": 3, "vertical": "CHAT_SUPPORT" },
  { "industry": "TECH", "experienceMin": 0, "experienceMax": 2, "vertical": "DOCUMENTATION" }
];
  const minimumQualifications = [
  { "type": "BACHELORS", "field": "CS_IT" },
  { "type": "CERTIFICATION", "field": "DATA_AI" },
  { "type": "CERTIFICATION", "field": "SOFTWARE_TESTING" }
];

  const sampleOpps = [
    {
      title: 'Chat Support Associate',
      description: 'Handle customer queries via live chat.',
      category: 'BPO',
      processType: 'CHAT_SUPPORT',
      deadline: addDays(25),
      payAmount: '18000.00',
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      projectId: project.id,
      minimumSkills: [
        'Communication',
        'Chat Handling',
        'Problem Solving',
        'Email Support',
        'CRM',
      ],
      requiredLanguages: ['English'],
      minimumQualifications:minimumQualifications[0],
      minimumL1Score: 'C1',
      preferredExperience:preferredExperience[0],
    },
    {
      title: 'Prompt Engineering Assistant',
      description: 'Craft and refine prompts for internal LLM tools.',
      category: 'TECH',
      processType: 'PROMPT_ENGINEERING',
      deadline: addDays(30),
      payAmount: '32000.00',
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      projectId: project.id,
      minimumSkills: [
        'English Comprehension',
        'Attention to Detail',
        'Problem Solving',
        'Node.js',
        'REST',
      ],
      requiredLanguages: ['English'],
      minimumQualifications:minimumQualifications[1],
      minimumL1Score: 'C1',
      preferredExperience:preferredExperience[1],
    },
    {
      title: 'Documentation Writer',
      description: 'Write and maintain help center articles and FAQs.',
      category: 'CONTENT',
      processType: 'DOCUMENTATION',
      deadline: addDays(28),
      payAmount: '26000.00',
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      projectId: project.id,
      minimumSkills: [
        'English Comprehension',
        'Attention to Detail',
        'Reporting',
        'Customer Service',
      ],
      requiredLanguages: ['English'],
      minimumQualifications:minimumQualifications[2],
      minimumL1Score: 'C1',
      preferredExperience:preferredExperience[2],
    },
    {
      title: 'Tech Support Specialist',
      description: 'Resolve basic technical queries and ticket triage.',
      category: 'TECH',
      processType: 'TECH_SUPPORT',
      deadline: addDays(35),
      payAmount: '30000.00',
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      projectId: project.id,
      minimumSkills: ['Communication', 'Problem Solving', 'Server', 'CRM'],
      requiredLanguages: ['English'],
      minimumQualifications:minimumQualifications[0],
      minimumL1Score: 'C1',
      preferredExperience:preferredExperience[1],
    },
    {
      title: 'QA Testing Assistant',
      description: 'Assist in test case execution and reporting.',
      category: 'TECH',
      processType: 'QA_TESTING',
      deadline: addDays(20),
      payAmount: '28000.00',
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      projectId: project.id,
      minimumSkills: [
        'Attention to Detail',
        'Problem Solving',
        'Reporting',
        'Database',
      ],
      requiredLanguages: ['English'],
      minimumQualifications:minimumQualifications[1],
      minimumL1Score: 'C1',
      preferredExperience:preferredExperience[2],
    },
    {
      title: 'Email Support Executive',
      description: 'Respond to customer emails and maintain SLAs.',
      category: 'BPO',
      processType: 'CHAT_SUPPORT',
      deadline: addDays(22),
      payAmount: '20000.00',
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      projectId: project.id,
      minimumSkills: ['Email Support', 'Communication', 'CRM', 'Reporting'],
      requiredLanguages: ['English'],
      minimumQualifications:minimumQualifications[2],
      minimumL1Score: 'C1',
      preferredExperience:preferredExperience[0],
    },
  ];

  // Insert opportunities
  for (const opp of sampleOpps) {
    await prisma.opportunity.create({ data: opp });
  }

  console.log(`Seeded ${sampleOpps.length} opportunities under project ${project.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });