require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const sequelize = require("./config/database");
const { dbType } = require("./config/database");
const seedAdmin = require("./seeders/admin");
const User = require("./models/User");
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");

// Define model associations
User.hasMany(Conversation, { foreignKey: "userId", as: "conversations" });
Conversation.belongsTo(User, { foreignKey: "userId", as: "user" });

Conversation.hasMany(Message, { foreignKey: "conversationId", as: "messages" });
Message.belongsTo(Conversation, {
  foreignKey: "conversationId",
  as: "conversation",
});

const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
  "http://localhost:3000",
  "https://chat.ncwu.site",
  "https://huashui-ai-frontend.onrender.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

sequelize
  .sync()
  .then(() => {
    console.log(`✓ ${dbType} database connected`);
    return seedAdmin();
  })
  .catch((err) => {
    console.error("✗ Database connection error:", err);
    process.exit(1);
  });

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later.",
});

app.use("/api/", limiter);
// app.use('/api/auth/login', authLimiter);
// app.use('/api/auth/register', authLimiter);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/admin", require("./routes/admin"));
app.use(require("./middleware/errorHandler"));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: dbType,
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "HuaShui AI API Server",
    version: "1.0.0",
    database: dbType,
    endpoints: {
      auth: "/api/auth",
      conversations: "/api/conversations",
      messages: "/api/messages",
      admin: "/api/admin",
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(require("./middleware/errorHandler"));

const connectedUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`✓ User connected: ${socket.userId}`);
  connectedUsers.set(socket.userId, socket.id);

  socket.on("join-conversation", (conversationId) => {
    const roomName = `conversation-${String(conversationId)}`;
    socket.join(roomName);
    console.log(`User ${socket.userId} joined room: ${roomName}`);
  });

  socket.on("leave-conversation", (conversationId) => {
    const roomName = `conversation-${String(conversationId)}`;
    socket.leave(roomName);
    console.log(`User ${socket.userId} left room: ${roomName}`);
  });

  socket.on("typing", (conversationId) => {
    socket.to(`conversation-${conversationId}`).emit("user-typing", {
      userId: socket.userId,
    });
  });

  socket.on("stop-typing", (conversationId) => {
    socket.to(`conversation-${conversationId}`).emit("user-stop-typing", {
      userId: socket.userId,
    });
  });

  socket.on("disconnect", () => {
    console.log(`✗ User disconnected: ${socket.userId}`);
    connectedUsers.delete(socket.userId);
  });
});

app.set("io", io);
app.set("connectedUsers", connectedUsers);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✓ API: http://localhost:${PORT}`);
  console.log(`✓ WebSocket: ws://localhost:${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

module.exports = { app, io };
