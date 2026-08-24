import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

import { registerCallHandlers } from "./callHandler.js";

import { socketCorsOriginDelegate } from "../libs/corsConfig.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: socketCorsOriginDelegate,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map(); // {userId: socketId}

io.on("connection", async (socket) => {
  const user = socket.user;

  // console.log(`${user.displayName} online với socket ${socket.id}`);

  onlineUsers.set(user._id, socket.id);

  io.emit("online-users", Array.from(onlineUsers.keys()));

  const conversationIds = await getUserConversationsForSocketIO(user._id);
  conversationIds.forEach((id) => {
    socket.join(id);
  });

  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
  });

  socket.join(user._id.toString());

  registerCallHandlers(io, socket, user);

  socket.on("typing", ({ conversationId }) => {
    socket.to(conversationId).emit("user-typing", {
      conversationId,
      user: {
        _id: user._id,
        displayName: user.displayName,
      },
    });
  });

  socket.on("stop-typing", ({ conversationId }) => {
    socket.to(conversationId).emit("user-stop-typing", {
      conversationId,
      userId: user._id,
    });
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(user._id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
    /* console.log(`socket disconnected: ${socket.id}`); */
  });
});

export { io, app, server };
