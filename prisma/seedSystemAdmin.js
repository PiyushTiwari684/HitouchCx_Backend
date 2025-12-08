import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting System SuperAdmin seed...");

  // Check if system admin already exists
  const existingAdmin = await prisma.superAdmin.findUnique({
    where: { email: "system@hitouchcx.internal" },
  });

  if (existingAdmin) {
    console.log("✅ System SuperAdmin already exists!");
    console.log(`📋 ID: ${existingAdmin.id}`);
    console.log(`📧 Email: ${existingAdmin.email}`);
    console.log("\n🔑 Add this to your .env file:");
    console.log(`SYSTEM_ADMIN_ID=${existingAdmin.id}`);
    return;
  }

  // Create system admin
  console.log("🔧 Creating System SuperAdmin...");

  // Hash a placeholder password (this account won't be used for login)
  const passwordHash = await bcrypt.hash("SYSTEM_GENERATED_DO_NOT_USE", 10);

  const systemAdmin = await prisma.superAdmin.create({
    data: {
      email: "system@hitouchcx.internal",
      passwordHash: passwordHash,
      firstName: "System",
      lastName: "Generated",
    },
  });

  console.log("✅ System SuperAdmin created successfully!");
  console.log(`📋 ID: ${systemAdmin.id}`);
  console.log(`📧 Email: ${systemAdmin.email}`);
  console.log(`👤 Name: ${systemAdmin.firstName} ${systemAdmin.lastName}`);
  console.log("\n🔑 IMPORTANT: Add this to your .env file:");
  console.log(`SYSTEM_ADMIN_ID=${systemAdmin.id}`);
  console.log("\n📝 This admin is used for system-generated assessments.");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
