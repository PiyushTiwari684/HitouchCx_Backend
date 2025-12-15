import prisma from '../src/config/db.js';

// Fixed agentId
const AGENT_ID = 'cmi5uzu8w0001o420uoclv9oz';

async function main() {
  // Manually define the skills array
  const skills = [
    'Communication',
    'CRM',
    'Problem Solving',
    'Docker',
    'REST',
    'PostgreSQL',
    'Express',
    'Node.js',
    'LLM',
    'Customer Service',
    'Salesforce',
  ];

  const updated = await prisma.agent.update({
    where: { id: AGENT_ID },
    data: { skills },
    select: { id: true, firstName: true, lastName: true, skills: true, updatedAt: true },
  });

  console.log('Agent skills updated:', updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// ...existing code...