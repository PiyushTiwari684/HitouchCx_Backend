// import dotenv from "dotenv";
// dotenv.config();

// import app from './app.js'
// import {db} from "./src/config/db.js";

// const PORT = process.env.PORT || 5000


// async function startServer(){
//     try {
//         // connect to database
//         await db.$connect();
//         console.log('Connect to supabase PostgreSQL');
        
//         // Server listening at port 
//         const server = app.listen(PORT,()=>{
//             console.log(`Server running at https://localhost:${PORT}`);
//         })

//     const shutdown = async (signal) => {
//       console.log(`\n${signal} received. Shutting down gracefully...`);
//       await db.$disconnect();
//       server.close(() => {
//         console.log("🛑 Server closed. Database disconnected.");
//         process.exit(0);
//       });
//     };
        
//         //SIGINT -> IT catches when we stop the server 
//         //SIGTERM -> It catches when the system or cloud asks your to stop
//         //Prevents data loss, broken connections, or unfinished API requests during shutdown
//         process.on('SIGINT',async() =>{
//             console.log('Shutting down...');
//             await db.$disconnect();
//             server.close(()=>process.exit(0));
//         });
//         process.on('SIGTERM',async() =>{
//             console.log('Recieved a termination Signal...');
//             await db.$disconnect();
//             server.close(()=>process.exit(0));
//         });


//     } catch (error) {
//         console.log('Database Connection failed',error);
//         process.exit(1);
//     }
// }

// startServer();


// server.js  (or index.js)
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import db from "./src/config/db.js"; // 🟢 ensure named import matches your db export

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // ✅ Connect to database
    await db.$connect();
    console.log("✅ Connected to Supabase PostgreSQL");

    // ✅ Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

    // ✅ Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      await db.$disconnect();
      server.close(() => {
        console.log("🛑 Server closed. Database disconnected.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));   // Ctrl + C in terminal
    process.on("SIGTERM", () => shutdown("SIGTERM")); // Cloud/server stop signal
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
