import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./src/app.js";
import { initializeSocket } from "./src/socket/socketManager.js";
import startOfferExpiryJob from "./src/jobs/offerExpiry.job.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io available globally for notification service
global.io = io;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
  
  // Start scheduled jobs
  startOfferExpiryJob().catch(err => {
    console.error("Failed to start offer expiry job:", err.message);
  });
});
