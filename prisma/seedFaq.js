import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (optional - for clean slate)
  console.log("🗑️  Clearing existing data...");
  await prisma.faqQuestion.deleteMany({});
  await prisma.faqCategory.deleteMany({});

  console.log("📝 Creating FAQ categories...");

  // ==================== Category 1: Password & Login ====================
  const passwordCategory = await prisma.faqCategory.create({
    data: {
      name: "Password & Login",
      emoji: "🔐",
      order: 1,
      questions: {
        create: [
          {
            question: "How to reset my password?",
            answer:
              'To reset your password:\n1. Go to Settings > Security\n2. Click "Reset Password"\n3. Enter your email\n4. Check your email for reset link\n5. Create a new password',
            order: 1,
          },
          {
            question: "Can't login to my account",
            answer:
              "If you cannot login:\n1. Clear your browser cache and cookies\n2. Try using incognito/private mode\n3. Check if Caps Lock is on\n4. Reset your password if needed\n5. Contact support if issue persists",
            order: 2,
          },
          {
            question: "Forgot my username",
            answer:
              'To recover your username:\n1. Go to the login page\n2. Click "Forgot Username"\n3. Enter your registered email\n4. Check your email for username reminder\n5. If not received, contact support',
            order: 3,
          },
        ],
      },
    },
  });

  // ==================== Category 2: Payment Issues ====================
  const paymentCategory = await prisma.faqCategory.create({
    data: {
      name: "Payment Issues",
      emoji: "💳",
      order: 2,
      questions: {
        create: [
          {
            question: "My payment was declined",
            answer:
              "If your payment was declined:\n1. Check if your card has sufficient funds\n2. Verify card expiration date\n3. Ensure billing address is correct\n4. Contact your bank for authorization\n5. Try a different payment method",
            order: 1,
          },
          {
            question: "How to update payment method?",
            answer:
              'To update your payment method:\n1. Go to Settings > Billing\n2. Click "Payment Methods"\n3. Click "Add New Card" or "Update"\n4. Enter new card details\n5. Save changes',
            order: 2,
          },
          {
            question: "Didn't receive payment confirmation",
            answer:
              "If you did not receive payment confirmation:\n1. Check your spam/junk folder\n2. Verify email address in your profile\n3. Check transaction history in your account\n4. Wait 24 hours for processing\n5. Contact support with transaction ID",
            order: 3,
          },
        ],
      },
    },
  });

  // ==================== Category 3: Work Related ====================
  const workCategory = await prisma.faqCategory.create({
    data: {
      name: "Work Related",
      emoji: "💼",
      order: 3,
      questions: {
        create: [
          {
            question: "How to submit my timesheet?",
            answer:
              'To submit your timesheet:\n1. Go to Dashboard > Timesheets\n2. Select the week you want to submit\n3. Fill in your hours for each day\n4. Review for accuracy\n5. Click "Submit for Approval"',
            order: 1,
          },
          {
            question: "Where can I view my assignments?",
            answer:
              'To view your assignments:\n1. Login to your account\n2. Go to "My Assignments" in the main menu\n3. You will see all active and upcoming assignments\n4. Click on any assignment for details',
            order: 2,
          },
          {
            question: "How to request time off?",
            answer:
              'To request time off:\n1. Go to Dashboard > Time Off\n2. Click "Request Time Off"\n3. Select dates and type (vacation, sick, etc.)\n4. Add notes if needed\n5. Submit request for manager approval',
            order: 3,
          },
        ],
      },
    },
  });

  // ==================== Category 4: Profile Settings ====================
  const profileCategory = await prisma.faqCategory.create({
    data: {
      name: "Profile Settings",
      emoji: "👤",
      order: 4,
      questions: {
        create: [
          {
            question: "How to update my profile information?",
            answer:
              'To update your profile:\n1. Go to Settings > Profile\n2. Click "Edit Profile"\n3. Update your information (name, email, phone)\n4. Upload new profile photo if desired\n5. Click "Save Changes"',
            order: 1,
          },
          {
            question: "How to change notification settings?",
            answer:
              "To change notifications:\n1. Go to Settings > Notifications\n2. Choose notification preferences:\n   - Email notifications\n   - SMS notifications\n   - Push notifications\n3. Toggle each type on/off\n4. Save your preferences",
            order: 2,
          },
          {
            question: "How to deactivate my account?",
            answer:
              'To deactivate your account:\n1. Go to Settings > Account\n2. Scroll to "Account Management"\n3. Click "Deactivate Account"\n4. Confirm your decision\n5. Note: You can reactivate within 30 days',
            order: 3,
          },
        ],
      },
    },
  });

  // ==================== Category 5: Opportunities ====================
  const opportunitiesCategory = await prisma.faqCategory.create({
    data: {
      name: "Opportunities",
      emoji: "🎯",
      order: 5,
      questions: {
        create: [
          {
            question: "How to browse available opportunities?",
            answer:
              'To browse opportunities:\n1. Go to "Opportunities" in main menu\n2. Use filters to narrow search:\n   - Location\n   - Job type\n   - Skills required\n3. Click on any opportunity for details\n4. Click "Apply" if interested',
            order: 1,
          },
          {
            question: "How to apply for an opportunity?",
            answer:
              'To apply for an opportunity:\n1. Find the opportunity you want\n2. Click "Apply Now"\n3. Upload your resume/CV\n4. Fill in application form\n5. Submit application\n6. You will receive confirmation email',
            order: 2,
          },
          {
            question: "How to track my applications?",
            answer:
              "To track applications:\n1. Go to Dashboard > My Applications\n2. See all your submitted applications\n3. Check status of each:\n   - Pending\n   - Under Review\n   - Accepted\n   - Declined\n4. Click for more details",
            order: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log(`📊 Created ${5} categories`);
  console.log(`📊 Created ${15} questions (3 per category)`);
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
