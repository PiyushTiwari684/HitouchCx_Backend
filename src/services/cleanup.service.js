import prisma from "../config/db.js";
import { saveDailyAnalytics } from "./analytics.service.js";

// Delete conversations closed for more than 6 hours
export async function deleteOldConversations() {
  try {
    console.log("🧹 Starting cleanup job...");

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    // Find conversations to delete
    const conversationsToDelete = await prisma.conversation.findMany({
      where: {
        isClosed: true,
        closedAt: {
          not: null,
          lt: sixHoursAgo,
        },
      },
      select: {
        id: true,
        closedAt: true,
      },
    });

    if (conversationsToDelete.length === 0) {
      console.log("✅ No conversations to delete");
      return { deleted: 0 };
    }

    console.log(
      `📊 Found ${conversationsToDelete.length} conversations to delete`
    );

    // Save analytics before deleting (for yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await saveDailyAnalytics(yesterday);

    // Delete conversations (cascade will delete messages, custom questions, etc.)
    const deleted = await prisma.conversation.deleteMany({
      where: {
        id: {
          in: conversationsToDelete.map((c) => c.id),
        },
      },
    });

    console.log(`✅ Deleted ${deleted.count} conversations`);

    return { deleted: deleted.count };
  } catch (error) {
    console.error("❌ Cleanup job failed:", error);
    throw new Error(`Cleanup failed: ${error.message}`);
  }
}

// Expire inactive sessions (timeout after 3 hours)
export async function expireInactiveSessions(timeoutHours = 3) {
  try {
    console.log("⏰ Checking for inactive sessions...");

    const timeoutTime = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

    const expired = await prisma.conversation.updateMany({
      where: {
        isClosed: false,
        lastActivityAt: {
          lt: timeoutTime,
        },
      },
      data: {
        isClosed: true,
        closedAt: new Date(),
      },
    });

    if (expired.count > 0) {
      console.log(`✅ Expired ${expired.count} inactive sessions`);
    } else {
      console.log("✅ No inactive sessions to expire");
    }

    return { expired: expired.count };
  } catch (error) {
    console.error("❌ Session expiry failed:", error);
    throw new Error(`Session expiry failed: ${error.message}`);
  }
}
