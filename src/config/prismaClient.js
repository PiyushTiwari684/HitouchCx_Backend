import { PrismaClient } from '@prisma/client';

// Reuse one instance across hot reloads (nodemon)
const g = globalThis;
const prisma = g.prisma || new PrismaClient();
if (!g.prisma) g.prisma = prisma;

export default prisma;