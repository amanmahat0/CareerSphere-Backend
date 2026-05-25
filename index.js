import "dotenv/config";
import http from "http";
import app, { connectDB } from "./src/app.js";
import { initializeSocket } from "./src/socket/socketManager.js";
import startOfferExpiryJob from "./src/jobs/offerExpiry.job.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = initializeSocket(server);
global.io = io;

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
  await connectDB();
  startOfferExpiryJob().catch(err => {
    console.error("Failed to start offer expiry job:", err.message);
  });
});
