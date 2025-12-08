import cron from "node-cron";
import {
  deleteOldConversations,
  expireInactiveSessions,
} from "../services/cleanup.service.js";

let isCleanupRunning = false;
let isExpiryRunning = false;

// Schedule cleanup job - runs every hour
export function startCleanupJob() {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    // Prevent overlapping runs
    if (isCleanupRunning) {
      console.log("⚠️  Cleanup job already running, skipping...");
      return;
    }

    isCleanupRunning = true;

    try {
      await deleteOldConversations();
    } catch (error) {
      console.error("Cleanup job error:", error);
    } finally {
      isCleanupRunning = false;
    }
  });

  console.log("✅ Cleanup job scheduled (runs every hour)");
}

// Schedule session expiry job - runs every 30 minutes
export function startSessionExpiryJob() {
  // Run every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    // Prevent overlapping runs
    if (isExpiryRunning) {
      console.log("⚠️  Session expiry already running, skipping...");
      return;
    }

    isExpiryRunning = true;

    try {
      await expireInactiveSessions(3); // 3 hour timeout
    } catch (error) {
      console.error("Session expiry error:", error);
    } finally {
      isExpiryRunning = false;
    }
  });

  console.log("✅ Session expiry job scheduled (runs every 30 minutes)");
}

// Start all scheduled jobs
export function startAllJobs() {
  startCleanupJob();
  startSessionExpiryJob();
  console.log("🚀 All scheduled jobs started");
}
