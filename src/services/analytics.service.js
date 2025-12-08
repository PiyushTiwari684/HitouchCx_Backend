import prisma from "../config/db.js";

// Save daily analytics summary
export async function saveDailyAnalytics(date = new Date()) {
  try {
    // Set date to start of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get conversations for the day
    const conversations = await prisma.conversation.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        messages: true,
      },
    });

    if (conversations.length === 0) {
      console.log("No conversations to analyze for", startOfDay.toDateString());
      return null;
    }

    // Calculate metrics
    const totalConversations = conversations.length;
    const tier1Resolved = conversations.filter(
      (c) => c.isResolved && c.currentTier === 1
    ).length;
    const tier2Resolved = conversations.filter(
      (c) => c.isResolved && c.currentTier === 2
    ).length;
    const tier3Escalated = conversations.filter(
      (c) => c.currentTier === 3
    ).length;

    // Calculate average resolution times (in seconds)
    const calculateAvgTime = (tier) => {
      const resolved = conversations.filter(
        (c) => c.isResolved && c.currentTier === tier
      );
      if (resolved.length === 0) return null;

      const totalTime = resolved.reduce((sum, c) => {
        const timeMs = c.closedAt
          ? c.closedAt.getTime() - c.createdAt.getTime()
          : 0;
        return sum + timeMs;
      }, 0);

      return Math.round(totalTime / resolved.length / 1000); // Convert to seconds
    };

    const avgResolutionTimeTier1 = calculateAvgTime(1);
    const avgResolutionTimeTier2 = calculateAvgTime(2);
    const avgResolutionTimeTier3 = calculateAvgTime(3);

    // Get top FAQ questions for the day
    const topFaqQuestions = await prisma.faqQuestion.findMany({
      orderBy: {
        viewCount: "desc",
      },
      take: 10,
      select: {
        id: true,
        question: true,
        viewCount: true,
      },
    });

    // Get top custom questions for the day
    const topCustomQuestions = await prisma.customQuestion.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        similarCount: "desc",
      },
      take: 10,
      select: {
        question: true,
        similarCount: true,
      },
    });

    // Check if analytics for this date already exists
    const existing = await prisma.analyticsSummary.findUnique({
      where: {
        date: startOfDay,
      },
    });

    // Create or update analytics
    const analytics = existing
      ? await prisma.analyticsSummary.update({
          where: { date: startOfDay },
          data: {
            totalConversations,
            tier1Resolved,
            tier2Resolved,
            tier3Escalated,
            avgResolutionTimeTier1,
            avgResolutionTimeTier2,
            avgResolutionTimeTier3,
            topFaqQuestions: JSON.stringify(topFaqQuestions.map((q) => q.id)),
            topCustomQuestions: JSON.stringify(
              topCustomQuestions.map((q) => q.question)
            ),
          },
        })
      : await prisma.analyticsSummary.create({
          data: {
            date: startOfDay,
            totalConversations,
            tier1Resolved,
            tier2Resolved,
            tier3Escalated,
            avgResolutionTimeTier1,
            avgResolutionTimeTier2,
            avgResolutionTimeTier3,
            topFaqQuestions: JSON.stringify(topFaqQuestions.map((q) => q.id)),
            topCustomQuestions: JSON.stringify(
              topCustomQuestions.map((q) => q.question)
            ),
          },
        });

    console.log("✅ Analytics saved for", startOfDay.toDateString());
    return analytics;
  } catch (error) {
    console.error("Error saving analytics:", error);
    throw new Error(`Failed to save analytics: ${error.message}`);
  }
}

// Get analytics for a date range
export async function getAnalytics(startDate, endDate) {
  try {
    const analytics = await prisma.analyticsSummary.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return analytics;
  } catch (error) {
    throw new Error(`Failed to fetch analytics: ${error.message}`);
  }
}
