import prisma from '../src/config/db.js';

async function main() {
  try {
    // Simple query against a small table (User exists in your schema)
    const count = await prisma.user.count();
    console.log('DB connected. User count:', count);
  } catch (err) {
    console.error('Prisma DB connection failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();