import "dotenv/config";
import express from "express";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import friendRoute from "./routes/friendRoute.js";
import messageRoute from "./routes/messageRoute.js";
import conversationRoute from "./routes/conversationRoute.js";
import notificationRoute from "./routes/notificationRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import { app, server } from "./socket/index.js";
import { v2 as cloudinary } from "cloudinary";

// const app = express();
const PORT = process.env.PORT || 5001;

import { corsOptionsDelegate } from "./libs/corsConfig.js";

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptionsDelegate));
app.use(
  ["/uploads", "/api/uploads"],
  express.static("uploads", {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".webm")) {
        res.setHeader("Content-Type", "audio/webm");
      } else if (filePath.endsWith(".m4a") || filePath.endsWith(".mp4") || filePath.endsWith(".aac")) {
        res.setHeader("Content-Type", "audio/mp4");
      } else if (filePath.endsWith(".ogg")) {
        res.setHeader("Content-Type", "audio/ogg");
      } else if (filePath.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
      } else if (filePath.endsWith(".wav")) {
        res.setHeader("Content-Type", "audio/wav");
      }
      res.setHeader("Accept-Ranges", "bytes");
    },
  })
);

// CLOUDINARY Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// swagger
const swaggerDocument = JSON.parse(fs.readFileSync("./src/swagger.json", "utf8"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// public routes
import { testEmailDiagnostic } from "./controllers/authController.js";
app.get("/api/test-email", testEmailDiagnostic);
app.use("/api/auth", authRoute);

// health check (used by keep-alive pings)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// private routes
import aiRoute from "./routes/aiRoute.js";

import channelRoute from "./routes/channelRoute.js";

app.use(protectedRoute);
import adminRoute from "./routes/adminRoute.js";

app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/messages", messageRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/groups", conversationRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/ai", aiRoute);
app.use("/api/channels", channelRoute);
app.use("/api/admin", adminRoute);

import { initRedis } from "./config/redis.js";
import { startEmailDigestCron } from "./services/emailDigestCron.js";
import { startScheduledMessageCron } from "./services/scheduledMessageCron.js";
import { startMessageExpiryCron } from "./services/messageExpiryCron.js";

connectDB().then(async () => {
  await initRedis();
  startEmailDigestCron();
  startScheduledMessageCron();
  startMessageExpiryCron();
  server.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);

    // Keep-alive: self-ping every 14 minutes to prevent Render free tier from sleeping
    const SELF_URL = process.env.SERVER_URL || process.env.CLIENT_URL || "";
    if (SELF_URL && SELF_URL.includes("onrender.com")) {
      const pingUrl = `${SELF_URL.replace(/\/$/, "")}/api/health`;
      setInterval(async () => {
        try {
          const res = await fetch(pingUrl);
          console.log(`[Keep-alive] Ping ${pingUrl} → ${res.status}`);
        } catch (err) {
          console.warn(`[Keep-alive] Ping failed:`, err.message);
        }
      }, 14 * 60 * 1000); // every 14 minutes
      console.log(`[Keep-alive] Self-ping started → ${pingUrl}`);
    }
  });
});
