import { Server } from "socket.io";

// Store active socket connections
const userSockets = new Map(); // userId -> socket.id

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 */
export const initializeSocket = (server) => {
  const allowedOrigins = [
    "https://career-sphere-frontend-6aku.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
    transports: ["websocket", "polling"],
  });

  // Middleware: Authenticate socket connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;

      // Allow connection even without userId for debugging
      if (!userId) {
        socket.userId = 'guest-' + socket.id;
        socket.token = token;
        return next();
      }

      socket.userId = userId;
      socket.token = token;
      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(error);
    }
  });

  // Handle new socket connections
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.userId}`);
    userSockets.set(socket.userId, socket.id);

    // Listen for user joining their notification room
    socket.on("join-notifications", (userId) => {
      if (userId === socket.userId || socket.userId.startsWith('guest-')) {
        socket.join(`notifications-${userId}`);
        socket.emit("connected", { 
          message: "Connected to notifications",
          socketId: socket.id,
          room: `notifications-${userId}`
        });
      } else {
        console.warn(`User ID mismatch: ${userId} != ${socket.userId}`);
      }
    });

    // Listen for marking notification as read
    socket.on("mark-notification-read", (notificationId) => {
      // Broadcast to the notification room
      io.to(`notifications-${socket.userId}`).emit("notification-read", {
        notificationId,
        userId: socket.userId,
        timestamp: new Date(),
      });
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      userSockets.delete(socket.userId);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  return io;
};

/**
 * Send notification to a specific user via WebSocket
 * @param {Server} io - Socket.IO server instance
 * @param {string} userId - User ID to notify
 * @param {Object} notification - Notification object
 */
export const emitNotification = (io, userId, notification) => {
  const room = `notifications-${userId}`;
  
  io.to(room).emit("new-notification", {
    _id: notification._id,
    type: notification.type,
    message: notification.message,
    applicationId: notification.applicationId,
    read: notification.read,
    createdAt: notification.createdAt,
  });
};

/**
 * Create room name for user notifications
 * @param {string} userId - User ID
 */
export const getNotificationRoom = (userId) => {
  return `notifications-${userId}`;
};

/**
 * Get all active users
 */
export const getActiveUsers = () => {
  return Array.from(userSockets.keys());
};

/**
 * Check if user is connected
 * @param {string} userId - User ID
 */
export const isUserConnected = (userId) => {
  return userSockets.has(userId);
};

export default {
  initializeSocket,
  emitNotification,
  getNotificationRoom,
  getActiveUsers,
  isUserConnected,
};
