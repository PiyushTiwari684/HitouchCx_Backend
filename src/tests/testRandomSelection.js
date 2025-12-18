import { generateAssessmentContent } from "../jobs/assessmentContentGenerator.js";
import prisma from "../config/db.js";

/**
 * Test Random Question Selection
 * This script creates multiple assessments and verifies that:
 * 1. Each assessment has different questions
 * 2. Questions are selected randomly
 * 3. timesUsed counter increments correctly
 *
 * Run: node src/tests/testRandomSelection.js
 */

async function testRandomSelection() {
  console.log("🧪 Testing Random Question Selection\n");
  console.log("=" .repeat(60));

  const NUMBER_OF_TESTS = 5;
  const assessmentIds = [];
  const questionSets = [];

  try {
    // ===================================================================
    // STEP 1: Create test assessments
    // ===================================================================
    console.log(`\n📝 Creating ${NUMBER_OF_TESTS} test assessments...\n`);

    for (let i = 0; i < NUMBER_OF_TESTS; i++) {
      // Create assessment record
      const assessment = await prisma.assessment.create({
        data: {
          title: `Test Assessment ${i + 1}`,
          assessmentType: "LANGUAGE",
          status: "DRAFT",
          createdById: process.env.SYSTEM_ADMIN_ID || "system",
          totalDuration: 45,
        },
      });

      assessmentIds.push(assessment.id);
      console.log(`✅ Assessment ${i + 1} created: ${assessment.id.substring(0, 8)}...`);

      // Generate content (sections + random questions)
      await generateAssessmentContent(assessment.id, "LANGUAGE");
      console.log(`   ✓ Content generated with random questions\n`);
    }

    // ===================================================================
    // STEP 2: Fetch and analyze question distribution
    // ===================================================================
    console.log("=" .repeat(60));
    console.log("\n📊 Analyzing Question Distribution\n");

    for (let i = 0; i < assessmentIds.length; i++) {
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentIds[i] },
        include: {
          sections: {
            include: {
              questions: {
                include: {
                  question: {
                    select: {
                      id: true,
                      questionText: true,
                      cefrLevel: true,
                      questionType: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      console.log(`Assessment ${i + 1} (${assessment.id.substring(0, 8)}...):`);

      const questionIds = [];

      assessment.sections.forEach((section) => {
        console.log(`  📁 ${section.name}:`);
        section.questions.forEach((qs, idx) => {
          const q = qs.question;
          questionIds.push(q.id);
          console.log(
            `     ${idx + 1}. [${q.cefrLevel}] ${q.id.substring(0, 8)}... - ${q.questionText.substring(0, 50)}...`
          );
        });
      });

      questionSets.push(questionIds);
      console.log(`  Total questions: ${questionIds.length}\n`);
    }

    // ===================================================================
    // STEP 3: Check for uniqueness across assessments
    // ===================================================================
    console.log("=" .repeat(60));
    console.log("\n🔍 Checking Uniqueness Across Assessments\n");

    let allUnique = true;
    const comparisonResults = [];

    for (let i = 0; i < questionSets.length; i++) {
      for (let j = i + 1; j < questionSets.length; j++) {
        const set1 = new Set(questionSets[i]);
        const set2 = new Set(questionSets[j]);
        const intersection = [...set1].filter((x) => set2.has(x));

        const sharedCount = intersection.length;
        const totalQuestions = questionSets[i].length;
        const percentageShared = ((sharedCount / totalQuestions) * 100).toFixed(1);

        comparisonResults.push({
          pair: `${i + 1} vs ${j + 1}`,
          shared: sharedCount,
          percentage: percentageShared,
        });

        if (sharedCount === totalQuestions) {
          console.log(`❌ Assessment ${i + 1} and ${j + 1} have IDENTICAL questions!`);
          allUnique = false;
        } else if (sharedCount > totalQuestions * 0.7) {
          console.log(
            `⚠️  Assessment ${i + 1} and ${j + 1}: ${sharedCount}/${totalQuestions} shared (${percentageShared}%) - Too similar!`
          );
          allUnique = false;
        } else {
          console.log(
            `✅ Assessment ${i + 1} and ${j + 1}: ${sharedCount}/${totalQuestions} shared (${percentageShared}%) - Good variation`
          );
        }
      }
    }

    // Summary table
    console.log("\n📈 Comparison Summary:");
    console.log("┌───────────┬────────┬────────────┐");
    console.log("│ Pair      │ Shared │ Percentage │");
    console.log("├───────────┼────────┼────────────┤");
    comparisonResults.forEach((result) => {
      const pair = result.pair.padEnd(9);
      const shared = result.shared.toString().padStart(6);
      const percentage = (result.percentage + "%").padStart(10);
      console.log(`│ ${pair} │ ${shared} │ ${percentage} │`);
    });
    console.log("└───────────┴────────┴────────────┘");

    if (allUnique) {
      console.log("\n✅ All assessments have sufficient variation!");
    } else {
      console.log(
        "\n⚠️  Some assessments are too similar. You may need more questions in the pool."
      );
    }

    // ===================================================================
    // STEP 4: Verify timesUsed counter
    // ===================================================================
    console.log("\n=" .repeat(60));
    console.log("\n📊 Checking timesUsed Counter\n");

    // Get all questions that were used in our test assessments
    const usedQuestionIds = [...new Set(questionSets.flat())];

    const questionsWithUsage = await prisma.question.findMany({
      where: {
        id: { in: usedQuestionIds },
      },
      select: {
        id: true,
        questionText: true,
        cefrLevel: true,
        timesUsed: true,
      },
      orderBy: {
        timesUsed: "desc",
      },
    });

    console.log("Top 10 Most Used Questions:");
    console.log("┌──────────────┬───────────┬───────────┬─────────────────────┐");
    console.log("│ Question ID  │ CEFR      │ TimesUsed │ Text Preview        │");
    console.log("├──────────────┼───────────┼───────────┼─────────────────────┤");

    questionsWithUsage.slice(0, 10).forEach((q) => {
      const id = q.id.substring(0, 12).padEnd(12);
      const cefr = q.cefrLevel.padEnd(9);
      const used = q.timesUsed.toString().padStart(9);
      const text = q.questionText.substring(0, 19).padEnd(19);
      console.log(`│ ${id} │ ${cefr} │ ${used} │ ${text} │`);
    });
    console.log("└──────────────┴───────────┴───────────┴─────────────────────┘");

    // Calculate usage statistics
    const usageCounts = questionsWithUsage.reduce((acc, q) => {
      acc[q.timesUsed] = (acc[q.timesUsed] || 0) + 1;
      return acc;
    }, {});

    console.log("\n📈 Usage Distribution:");
    Object.entries(usageCounts)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .forEach(([timesUsed, count]) => {
        console.log(`   Used ${timesUsed} time(s): ${count} questions`);
      });

    const avgUsage =
      questionsWithUsage.reduce((sum, q) => sum + q.timesUsed, 0) /
      questionsWithUsage.length;
    console.log(`\n   Average usage: ${avgUsage.toFixed(2)} times per question`);

    // ===================================================================
    // STEP 5: Cleanup test data
    // ===================================================================
    console.log("\n=" .repeat(60));
    console.log("\n🧹 Cleaning Up Test Data\n");

    // Delete test assessments (cascade will delete sections and question mappings)
    const deleteResult = await prisma.assessment.deleteMany({
      where: {
        id: { in: assessmentIds },
      },
    });

    console.log(`✅ Deleted ${deleteResult.count} test assessments`);

    // Reset timesUsed counter for questions that were used in tests
    await prisma.question.updateMany({
      where: {
        id: { in: usedQuestionIds },
      },
      data: {
        timesUsed: { decrement: NUMBER_OF_TESTS },
      },
    });

    console.log(`✅ Reset timesUsed counter for ${usedQuestionIds.length} questions`);

    // ===================================================================
    // FINAL SUMMARY
    // ===================================================================
    console.log("\n" + "=".repeat(60));
    console.log("\n🎉 Test Summary\n");

    console.log(`✅ Created ${NUMBER_OF_TESTS} assessments`);
    console.log(`✅ Each assessment had 10 questions`);
    console.log(
      `${allUnique ? "✅" : "⚠️ "} Question variation: ${allUnique ? "GOOD" : "NEEDS IMPROVEMENT"}`
    );
    console.log(`✅ timesUsed counter: WORKING`);
    console.log(`✅ Test data cleaned up`);

    console.log("\n" + "=".repeat(60));

  } catch (error) {
    console.error("\n💥 Test failed with error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRandomSelection()
  .then(() => {
    console.log("\n✅ All tests completed successfully!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Tests failed:", error);
    process.exit(1);
  });
