import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../src/config/db.js';

// Ensure .env loads even when running from prisma/ directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Helper: date in N days
function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  await prisma.$connect();
  console.log('Database connected successfully');

  // Create/ensure a sample client
  const client = await prisma.client.upsert({
    where: { email: 'ops@acme-corp.com' },
    update: {},
    create: {
      name: 'Acme Operations',
      email: 'ops@acme-corp.com',
      companyName: 'Acme Corp',
      website: 'https://acme.example.com',
      phone: '+91-90000-00000',
      logo: null,
    },
  });

  // Find project by title (title is not unique), create if missing
  const existingProject = await prisma.project.findFirst({
    where: { title: 'Ops & Leadership Initiatives', clientId: client.id },
  });

  const project = existingProject ?? await prisma.project.create({
    data: {
      title: 'Ops & Leadership Initiatives',
      description: 'BPO, entrepreneurship, business ops, and leadership roles.',
      department: 'BPO', // Industry enum: BPO | CONTENT | TECH | ...
      totalHoursNeeded: 900,
      agentsNeeded: 22,
      skillsRequired: ['Communication', 'CRM', 'Leadership', 'Process Documentation', 'Excel'],
      totalBudget: 220000,
      currency: 'INR',
      projectDeadline: addDays(120),
      status: 'ACTIVE',
      clientId: client.id,
    },
  });

  // Valid enums per schema:
  // ServiceCategory: BPO | CONTENT | TECH
  // ProcessType: INBOUND_CALL | CHAT_SUPPORT | DATA_ANNOTATION | PROMPT_ENGINEERING | TECH_SUPPORT | QA_TESTING | DOCUMENTATION
  // OpportunityStatus: OPEN | IN_PROGRESS | ON_HOLD | CANCELLED | COMPLETED | CLOSED
  // VisibilityLevel: PUBLIC | PRIVATE | DRAFT
  // LanguageProficiency: A1 | A2 | B1 | B2 | C1 | C2
  // PaymentType: FIXED | HOURLY | MILESTONE_BASIS

  const opportunities = [
    // BPO – Voice
    {
      title: 'Customer Care Voice Agent',
      description: 'Handle inbound calls for order tracking and issue resolution.',
      category: 'BPO',
      processType: 'INBOUND_CALL',
      deadline: addDays(12),
      payAmount: 16500,
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      minimumSkills: ['Active Listening', 'Empathy', 'CRM Basics'],
      requiredLanguages: ['English', 'Hindi'],
      minimumQualifications: [{ type: 'BACHELORS', field: 'BUSINESS' }],
      minimumL1Score: 'A2',
      preferredExperience: [
        { experienceMin: 1, experienceMax: 2, industry: 'BPO', vertical: 'INBOUND_CALL' }
      ],
    },
    // BPO – Chat
    {
      title: 'Live Chat Support Specialist',
      description: 'Provide real-time chat assistance and triage tickets.',
      category: 'BPO',
      processType: 'CHAT_SUPPORT',
      deadline: addDays(10),
      payAmount: 18500,
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      minimumSkills: ['Typing', 'Written Communication', 'Ticketing'],
      requiredLanguages: ['English'],
      minimumQualifications: [{ type: 'DIPLOMA', field: 'MEDIA_COMM' }],
      minimumL1Score: 'B1',
      preferredExperience: [
        { experienceMin: 1, experienceMax: 2, industry: 'BPO', vertical: 'CHAT_SUPPORT' }
      ],
    },
    // BPO – Email/Documentation
    {
      title: 'Email Resolution Specialist',
      description: 'Draft clear email responses and maintain knowledge base entries.',
      category: 'BPO',
      processType: 'DOCUMENTATION',
      deadline: addDays(9),
      payAmount: 19000,
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      minimumSkills: ['Writing', 'Documentation', 'Attention to Detail'],
      requiredLanguages: ['English'],
      minimumQualifications: [{ type: 'BACHELORS', field: 'LANGUAGE' }],
      minimumL1Score: 'B1',
      preferredExperience: [
        { experienceMin: 1, experienceMax: 2, industry: 'BPO', vertical: 'DOCUMENTATION' }
      ],
    },
    // Operations – Process documentation
    {
      title: 'Process Improvement Associate',
      description: 'Map processes, identify bottlenecks, and suggest improvements.',
      category: 'TECH',
      processType: 'DOCUMENTATION',
      deadline: addDays(18),
      payAmount: 27000,
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      minimumSkills: ['SOP Writing', 'Excel', 'Stakeholder Communication'],
      requiredLanguages: ['English'],
      minimumQualifications: [{ type: 'BACHELORS', field: 'BUSINESS' }],
      minimumL1Score: 'B1',
      preferredExperience: [
        { experienceMin: 1, experienceMax: 3, industry: 'TECH', vertical: 'DOCUMENTATION' }
      ],
    },
    // Operations – Workforce management (closest: documentation)
    {
      title: 'WFM Scheduler (Entry)',
      description: 'Assist with schedules, adherence, and shift capacity management.',
      category: 'TECH',
      processType: 'DOCUMENTATION',
      deadline: addDays(20),
      payAmount: 30000,
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      minimumSkills: ['Forecasting Basics', 'Excel', 'Coordination'],
      requiredLanguages: ['English'],
      minimumQualifications: [{ type: 'BACHELORS', field: 'FINANCE' }],
      minimumL1Score: 'B2',
      preferredExperience: [
        { experienceMin: 1, experienceMax: 2, industry: 'TECH', vertical: 'DOCUMENTATION' }
      ],
    },
    // Leadership – closest enum mapping: TECH_SUPPORT or QA_TESTING
    {
      title: 'Contact Center Team Lead',
      description: 'Own KPIs, coaching plans, QA reviews, and weekly performance.',
      category: 'TECH',
      processType: 'TECH_SUPPORT',
      deadline: addDays(15),
      payAmount: 39500,
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      minimumSkills: ['Leadership', 'KPI Management', 'Coaching'],
      requiredLanguages: ['English'],
      minimumQualifications: [{ type: 'BACHELORS', field: 'BUSINESS' }],
      minimumL1Score: 'B2',
      preferredExperience: [
        { experienceMin: 2, experienceMax: 4, industry: 'BPO', vertical: 'TECH_SUPPORT' }
      ],
    },
    {
      title: 'Shift Supervisor (Ops)',
      description: 'Monitor shift operations, handle escalations, ensure SLA adherence.',
      category: 'TECH',
      processType: 'TECH_SUPPORT',
      deadline: addDays(11),
      payAmount: 36500,
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      minimumSkills: ['Escalations', 'SLA Management', 'Reporting'],
      requiredLanguages: ['English', 'Hindi'],
      minimumQualifications: [{ type: 'BACHELORS', field: 'BUSINESS' }],
      minimumL1Score: 'B2',
      preferredExperience: [
        { experienceMin: 2, experienceMax: 3, industry: 'BPO', vertical: 'TECH_SUPPORT' }
      ],
    },
    // Entrepreneurship / Business – use CONTENT/TECH with DOCUMENTATION/TRAINING-like tasks
    {
      title: 'Startup Program Facilitator',
      description: 'Coordinate workshops on business models, GTM, and operations.',
      category: 'CONTENT',
      processType: 'DOCUMENTATION',
      deadline: addDays(21),
      payAmount: 41000,
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      minimumSkills: ['Presentation', 'Mentoring', 'Planning'],
      requiredLanguages: ['English'],
      minimumQualifications: [{ type: 'BACHELORS', field: 'BUSINESS' }],
      minimumL1Score: 'B2',
      preferredExperience: [
        { experienceMin: 3, experienceMax: 5, industry: 'CONTENT', vertical: 'DOCUMENTATION' }
      ],
    },
    {
      title: 'Business Ops Analyst (Junior)',
      description: 'Support dashboards, vendor coordination, weekly ops reporting.',
      category: 'TECH',
      processType: 'DOCUMENTATION',
      deadline: addDays(13),
      payAmount: 26000,
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      minimumSkills: ['Excel', 'Process Mapping', 'Communication'],
      requiredLanguages: ['English'],
      minimumQualifications: [{ type: 'DIPLOMA', field: 'FINANCE' }],
      minimumL1Score: 'B1',
      preferredExperience: [
        { experienceMin: 0, experienceMax: 1, industry: 'TECH', vertical: 'DOCUMENTATION' }
      ],
    },
    // QA – BPO quality audits
    {
      title: 'Quality Analyst (Contact Center)',
      description: 'Audit calls/chats, provide feedback, maintain QA scorecards.',
      category: 'BPO',
      processType: 'QA_TESTING',
      deadline: addDays(18),
      payAmount: 28000,
      currency: 'INR',
      paymentType: 'FIXED',
      status: 'OPEN',
      visibility: 'PUBLIC',
      minimumSkills: ['QA Audits', 'Feedback', 'Reporting'],
      requiredLanguages: ['English'],
      minimumQualifications: [{ type: 'BACHELORS', field: 'BUSINESS' }],
      minimumL1Score: 'B2',
      preferredExperience: [
        { experienceMin: 1, experienceMax: 3, industry: 'BPO', vertical: 'QA_TESTING' }
      ],
    },
  ];

  // Create opportunities
  for (const opp of opportunities) {
    await prisma.opportunity.create({
      data: {
        title: opp.title,
        description: opp.description,
        category: opp.category, // ServiceCategory enum
        processType: opp.processType, // ProcessType enum
        deadline: opp.deadline,
        payAmount: opp.payAmount, // Prisma Decimal will accept number
        currency: opp.currency,
        paymentType: opp.paymentType, // PaymentType enum
        status: opp.status, // OpportunityStatus enum
        visibility: opp.visibility, // VisibilityLevel enum
        projectId: project.id,
        minimumSkills: opp.minimumSkills,
        requiredLanguages: opp.requiredLanguages,
        minimumQualifications: opp.minimumQualifications, // JSON array
        minimumL1Score: opp.minimumL1Score, // LanguageProficiency enum
        preferredExperience: opp.preferredExperience, // JSON array
      },
    });
  }

  console.log(`Seeded ${opportunities.length} opportunities under project "${project.title}".`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });