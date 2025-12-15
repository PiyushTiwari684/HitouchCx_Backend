import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import db from "./src/config/db.js";
import { APP_CONFIG } from "./src/config/constants.js";
import { initializeUploadDirectories } from "./src/utils/file-storage.js";
import { startEmailRetryJob } from "./src/jobs/emailRetry.job.js";

const { PORT } = APP_CONFIG;

async function startServer() {
  try {
    //connect to database
    await db.$connect();
    console.log("Connect to supabase PostgreSQL");

    // Initialize KYC upload directories
    initializeUploadDirectories();

    //Server listening at port
    const server = app.listen(PORT, () => {
      console.log(`Server running at https://localhost:${PORT}`);
    });

    // Start email retry cron job for agreements
    startEmailRetryJob();

    //SIGINT -> IT catches when we stop the server
    //SIGTERM -> It catches when the system or cloud asks your to stop
    //Prevents data loss, broken connections, or unfinished API requests during shutdown
    process.on("SIGINT", async () => {
      console.log("Shutting down...");
      await db.$disconnect();
      server.close(() => process.exit(0));
    });
    process.on("SIGTERM", async () => {
      console.log("Recieved a termination Signal...");
      await db.$disconnect();
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.log("Database Connection failed", error);
    process.exit(1);
  }
}

startServer();
