import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Room from "../models/Room.js";
import RoomMember from "../models/RoomMember.js";
import RemovedMember from "../models/RemovedMember.js";
import BoardOp from "../models/BoardOp.js";
import ChatMessage from "../models/ChatMessage.js";
import User from "../models/User.js";

const CURSOR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

const roomPresence = new Map();
const activeCalls = new Map();
const activeScreenShares = new Map();
// ── NEW: Separate audio call state ───────────────────────────────────────────────────
const activeAudioCalls = new Map();
// ───────────────────────────────────────────────────────────────────────

// --- Moderation Maps ---
// userId (string) → socket.id — updated on every connect/disconnect
const userSockets = new Map();
// key: `${roomId}:${userId}` → { socketId, userName, roomId, userId, token }
// Holds rejoin requests waiting for host approval
const pendingRejoinRequests = new Map();

const getPresence = (roomId) => {
  if (!roomPresence.has(roomId)) {
    roomPresence.set(roomId, new Map());
  }
  return roomPresence.get(roomId);
};

const colorForUser = (userId, index) =>
  CURSOR_COLORS[index % CURSOR_COLORS.length];

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Invalid token"));
  }
};

const nextSeq = async (roomId) => {
  const room = await Room.findByIdAndUpdate(
    roomId,
    { $inc: { opCounter: 1 } },
    { new: true, projection: { opCounter: 1 } }
  );
  return room?.opCounter ?? 1;
};

const persistOp = async ({ roomId, userId, opType, payload, seq }) => {
  return BoardOp.create({ roomId, userId, opType, payload, seq });
};

let ioInstance = null;

export const cleanupRoomSocketState = (roomId) => {
  if (!roomId) return;
  const roomIdStr = roomId.toString();

  // Clear in-memory Maps
  activeCalls.delete(roomIdStr);
  activeScreenShares.delete(roomIdStr);
  roomPresence.delete(roomIdStr);
  // ── NEW: clear audio call state ──
  activeAudioCalls.delete(roomIdStr);
  // ──────────────────────────────

  for (const [key] of pendingRejoinRequests.entries()) {
    if (key.startsWith(`${roomIdStr}:`)) {
      pendingRejoinRequests.delete(key);
    }
  }

  // Notify connected sockets & disconnect them from room
  if (ioInstance) {
    ioInstance.to(roomIdStr).emit("room_deleted", {
      roomId: roomIdStr,
      message: "The room has been deleted.",
    });

    ioInstance.to(roomIdStr).emit("call_ended");
    ioInstance.to(roomIdStr).emit("screen_share_stopped");
    // ── NEW: notify audio call end on room deletion ──
    ioInstance.to(roomIdStr).emit("audio_call_ended");
    // ──────────────────────────────────────────────────

    ioInstance.in(roomIdStr).socketsLeave(roomIdStr);
  }
};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
  });
  ioInstance = io;

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    let currentRoomId = null;

    // Track this socket so moderation handlers can send targeted messages
    userSockets.set(socket.user.id, socket.id);

    socket.on("join_room", async ({ roomId, token }, callback) => {
      try {
        const room = await Room.findById(roomId).lean();
        if (!room) {
          return callback?.({ success: false, message: "Room not found" });
        }

        // --- MODERATION CHECK ---
        // If this user was previously removed by the host from this room,
        // intercept the join and route them to the approval waiting state.
        const wasRemoved = await RemovedMember.findOne({
          roomId,
          userId: socket.user.id,
        }).lean();

        if (wasRemoved) {
          const user = await User.findById(socket.user.id).select("name").lean();
          const userName = user?.name || "User";
          const pendingKey = `${roomId}:${socket.user.id}`;

          // Store the waiting socket info so the approval handler can find it
          pendingRejoinRequests.set(pendingKey, {
            socketId: socket.id,
            userName,
            roomId,
            userId: socket.user.id,
            token,
          });

          // Tell this socket to show the waiting screen
          socket.emit("rejoin_request_pending", { roomId, userName });

          // Find the host's socket and send the approval dialog
          const presence = getPresence(roomId);
          for (const [presUserId, presUser] of presence.entries()) {
            if (presUser.role === "host") {
              const hostSocketId = userSockets.get(presUserId);
              if (hostSocketId) {
                const hostSocket = io.sockets.sockets.get(hostSocketId);
                if (hostSocket) {
                  hostSocket.emit("rejoin_request", {
                    roomId,
                    userId: socket.user.id,
                    userName,
                  });
                }
              }
            }
          }

          // Acknowledge without granting room access
          return callback?.({ success: false, removed: true, message: "Waiting for host approval" });
        }
        // --- END MODERATION CHECK ---

        const membership = await RoomMember.findOne({
          roomId,
          userId: socket.user.id,
        }).lean();

        if (!membership) {
          if (room.inviteToken !== token) {
            return callback?.({ success: false, message: "Invalid invite token" });
          }
          await RoomMember.create({
            roomId,
            userId: socket.user.id,
            role: room.ownerId.toString() === socket.user.id ? "host" : "member",
          });
        }

        if (currentRoomId) {
          socket.leave(currentRoomId);
          getPresence(currentRoomId).delete(socket.user.id);
        }

        currentRoomId = roomId;
        socket.join(roomId);

        const user = await User.findById(socket.user.id).select("name").lean();
        const presence = getPresence(roomId);
        const colorIndex = presence.size;

        const userRole = membership?.role || (room.ownerId.toString() === socket.user.id ? "host" : "member");

        presence.set(socket.user.id, {
          userId: socket.user.id,
          userName: user?.name || "User",
          name: user?.name || "User",
          role: userRole,
          color: colorForUser(socket.user.id, colorIndex),
          x: 0,
          y: 0,
        });

        const users = Array.from(presence.values());

        socket.to(roomId).emit("user_joined", {
          userId: socket.user.id,
          userName: user?.name,
          name: user?.name || "User",
          role: userRole,
          color: presence.get(socket.user.id).color,
        });

        callback?.({ success: true, users, role: membership?.role || "member", callActive: activeCalls.has(roomId), });
      } catch (error) {
        console.error("Error in join_room:", error);
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("cursor_move", ({ roomId, x, y }) => {
      const presence = getPresence(roomId);
      const user = presence.get(socket.user.id);
      if (user) {
        user.x = x;
        user.y = y;
        socket.to(roomId).emit("cursor_moved", {
          userId: socket.user.id,
          userName: user?.userName,
          color: user?.color,
          x,
          y,
        });
      }
    });

    socket.on("pencil_start", (data) => {
      socket.to(data.roomId).emit("pencil_start", data);
    });

    socket.on("pencil_stream", (data) => {
      socket.to(data.roomId).emit("pencil_stream", data);
    });

    socket.on("pencil_complete", async (data, callback) => {
      try {
        const { roomId, path } = data;
        const seq = await nextSeq(roomId);
        const payload = { objectId: path.objectId, path };
        await persistOp({ roomId, userId: socket.user.id, opType: "freehand", payload, seq });
        socket.to(roomId).emit("pencil_complete", { path, userId: socket.user.id, seq });
        callback?.({ success: true, seq });
      } catch (error) {
        console.error("Error in shape_complete:", error);
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("shape_create", (data) => {
      socket.to(data.roomId).emit("shape_create", data);
    });

    socket.on("shape_update", (data) => {
      socket.to(data.roomId).emit("shape_update", data);
    });

    socket.on("shape_complete", async (data, callback) => {
      try {
        const { roomId, objectId, type, x, y, width, height, radius, color, fill, angle, scaleX, scaleY } = data;
        const seq = await nextSeq(roomId);
        const payload = { objectId, type, x, y, width, height, radius, color, fill, angle, scaleX, scaleY };
        await persistOp({ roomId, userId: socket.user.id, opType: "shape", payload, seq });
        socket.to(roomId).emit("shape_complete", { ...payload, userId: socket.user.id, seq });
        callback?.({ success: true, seq });
      } catch (error) {
        console.error("Error in shape_complete:", error);
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("text_create", async (data, callback) => {
      try {
        const { roomId, objectId, x, y, color, fontSize } = data;
        const seq = await nextSeq(roomId);
        const payload = { objectId, text: "", x, y, color, fontSize };
        await persistOp({ roomId, userId: socket.user.id, opType: "text", payload, seq });
        socket.to(roomId).emit("text_create", { ...data, userId: socket.user.id, seq });
        callback?.({ success: true, seq });
      } catch (error) {
        console.error("Error in shape_complete:", error);
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("text_edit", (data) => {
      socket.to(data.roomId).emit("text_edit", data);
    });

    // Handle generic live transformations and style updates
    const handleLiveObjectEvent = (eventName) => {
      socket.on(eventName, async (data, callback) => {
        if (!data || !data.roomId || !data.objectId) {
          return callback?.({ success: false, message: "Invalid payload: missing roomId or objectId" });
        }
        if (data.final) {
          try {
            const seq = await nextSeq(data.roomId);
            await persistOp({
              roomId: data.roomId,
              userId: socket.user.id,
              opType: "move", // We use "move" broadly for any modification to an existing object
              payload: data,
              seq,
            });
            socket.to(data.roomId).emit(eventName, { ...data, userId: socket.user.id, seq });
            callback?.({ success: true, seq });
          } catch (error) {
            callback?.({ success: false, message: error.message });
          }
        } else {
          // Live broadcast, no persistence
          socket.to(data.roomId).emit(eventName, { ...data, userId: socket.user.id });
        }
      });
    };

    handleLiveObjectEvent("object_transform_start");
    handleLiveObjectEvent("object_transform_update");
    handleLiveObjectEvent("object_transform_end");
    handleLiveObjectEvent("object_style_update");
    handleLiveObjectEvent("text_update");
    handleLiveObjectEvent("text_style_update");

    const handleLiveGroupTransformEvent = (eventName) => {
      socket.on(eventName, async (data, callback) => {
        if (!data || !data.roomId || !Array.isArray(data.objects)) {
          return callback?.({ success: false, message: "Invalid payload: missing roomId or objects array" });
        }
        if (data.final) {
          try {
            const seq = await nextSeq(data.roomId);
            await persistOp({
              roomId: data.roomId,
              userId: socket.user.id,
              opType: "move",
              payload: data,
              seq,
            });
            socket.to(data.roomId).emit(eventName, { ...data, userId: socket.user.id, seq });
            callback?.({ success: true, seq });
          } catch (error) {
            callback?.({ success: false, message: error.message });
          }
        } else {
          socket.to(data.roomId).emit(eventName, { ...data, userId: socket.user.id });
        }
      });
    };

    handleLiveGroupTransformEvent("object_group_transform_start");
    handleLiveGroupTransformEvent("object_group_transform_update");
    handleLiveGroupTransformEvent("object_group_transform_end");

    socket.on("object_delete", async (data, callback) => {
      try {
        const { roomId, objectId } = data;
        if (!roomId || !objectId) {
          return callback?.({ success: false, message: "Invalid payload: missing roomId or objectId" });
        }
        const seq = await nextSeq(roomId);
        const payload = { objectId };
        await persistOp({ roomId, userId: socket.user.id, opType: "delete", payload, seq });
        io.to(roomId).emit("object_delete", { objectId, seq });
        callback?.({ success: true, seq });
      } catch (error) {
        console.error("Error in object_delete:", error);
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("text_delete", async (data, callback) => {
      try {
        const { roomId, objectId } = data;
        if (!roomId || !objectId) {
          return callback?.({ success: false, message: "Invalid payload: missing roomId or objectId" });
        }
        const seq = await nextSeq(roomId);
        const payload = { objectId };
        await persistOp({ roomId, userId: socket.user.id, opType: "delete", payload, seq });
        io.to(roomId).emit("text_delete", { objectId, seq });
        callback?.({ success: true, seq });
      } catch (error) {
        console.error("Error in text_delete:", error);
        callback?.({ success: false, message: error.message });
      }
    });


    socket.on("delete_op", async (data, callback) => {
      try {
        const { roomId, opId, seq: clientSeq } = data;
        const seq = clientSeq ?? (await nextSeq(roomId));
        const payload = { opId };
        await persistOp({ roomId, userId: socket.user.id, opType: "delete", payload, seq });
        io.to(roomId).emit("op_deleted", { opId, userId: socket.user.id, seq });
        callback?.({ success: true, seq });
      } catch (error) {
        console.error("Error in shape_complete:", error);
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("manual_restore", ({ roomId }) => {
      socket.to(roomId).emit("manual_restore");
    });

    socket.on("move_cursor", ({ roomId, x, y }) => {
      const presence = getPresence(roomId);
      const user = presence.get(socket.user.id);
      if (user) {
        user.x = x;
        user.y = y;
        socket.to(roomId).emit("cursor_moved", {
          userId: socket.user.id,
          userName: user?.userName,
          color: user?.color,
          x,
          y,
        });
      }
    });

    socket.on("chat_msg", async (data, callback) => {
      try {
        const { roomId, text } = data;
        if (!text?.trim()) return;

        const user = await User.findById(socket.user.id).select("name").lean();
        const message = await ChatMessage.create({
          roomId,
          userId: socket.user.id,
          text: text.trim(),
        });

        io.to(roomId).emit("chat_new", {
          messageId: message._id,
          userId: socket.user.id,
          userName: user?.name,
          text: message.text,
          ts: message.createdAt,
        });

        callback?.({ success: true, messageId: message._id });
      } catch (error) {
        console.error("Error in shape_complete:", error);
        callback?.({ success: false, message: error.message });
      }
    });
    // ================= VIDEO CALL =================

    socket.on("start_call", ({ roomId }) => {
      if (activeCalls.has(roomId)) return;

      activeCalls.set(roomId, {
        startedBy: socket.user.id,
      });

      io.to(roomId).emit("call_started", {
        startedBy: socket.user.id,
      });
    });

    socket.on("join_call", ({ roomId }) => {
      socket.join(`${roomId}-call`);

      io.to(roomId).emit("user_joined_call", {
        userId: socket.user.id,
      });
    });

    socket.on("leave_call", ({ roomId }) => {
      socket.leave(`${roomId}-call`);

      io.to(roomId).emit("user_left_call", {
        userId: socket.user.id,
      });
    });

    socket.on("end_call", async ({ roomId }) => {
      const member = await RoomMember.findOne({
        roomId,
        userId: socket.user.id,
      });

      if (!member || member.role !== "host") {
        return;
      }

      activeCalls.delete(roomId);

      io.to(roomId).emit("call_ended");
    });

    socket.on("get_call_status", ({ roomId }, callback) => {
      callback?.({
        active: activeCalls.has(roomId),
      });
    });
    // ================= SCREEN SHARE =================

    socket.on("start_screen_share", ({ roomId, uid }) => {
      const current = activeScreenShares.get(roomId);

      // Stop previous presenter
      if (current) {
        io.to(roomId).emit("screen_share_stopped", current);
      }

      activeScreenShares.set(roomId, {
        userId: socket.user.id,
        uid,
      });

      io.to(roomId).emit("screen_share_started", {
        userId: socket.user.id,
        uid,
      });
    });

    socket.on("stop_screen_share", ({ roomId }) => {
      activeScreenShares.delete(roomId);

      io.to(roomId).emit("screen_share_stopped");
    });

    socket.on("get_screen_share_status", ({ roomId }, callback) => {
      callback?.({
        presenter: activeScreenShares.get(roomId) || null,
      });
    });

    // ================= END SCREEN SHARE =================
    // ================= END VIDEO CALL =================

    // ================= NEW: AUDIO CALL =================

    socket.on("start_audio_call", ({ roomId }) => {
      // Idempotent: do nothing if already active
      if (activeAudioCalls.has(roomId)) return;

      activeAudioCalls.set(roomId, {
        startedBy: socket.user.id,
        participants: new Set([socket.user.id]),
      });

      // Notify entire room (including host) so all clients can show "Join Audio"
      io.to(roomId).emit("audio_call_started", {
        startedBy: socket.user.id,
      });
    });

    socket.on("join_audio_call", ({ roomId }) => {
      const call = activeAudioCalls.get(roomId);
      if (call) {
        call.participants.add(socket.user.id);
      }

      io.to(roomId).emit("user_joined_audio_call", {
        userId: socket.user.id,
      });
    });

    socket.on("leave_audio_call", ({ roomId }) => {
      const call = activeAudioCalls.get(roomId);
      if (call) {
        call.participants.delete(socket.user.id);
      }

      io.to(roomId).emit("user_left_audio_call", {
        userId: socket.user.id,
      });
    });

    socket.on("end_audio_call", async ({ roomId }) => {
      // Only the host may end the call for everyone
      const member = await RoomMember.findOne({
        roomId,
        userId: socket.user.id,
      });

      if (!member || member.role !== "host") {
        return;
      }

      activeAudioCalls.delete(roomId);

      io.to(roomId).emit("audio_call_ended");
    });

    socket.on("get_audio_call_status", ({ roomId }, callback) => {
      callback?.({
        active: activeAudioCalls.has(roomId),
      });
    });

    // ================= END NEW: AUDIO CALL =================
    // ================= HOST MODERATION =================

    socket.on("host_remove_user", async ({ roomId, userId }, callback) => {
      try {
        // Verify caller is host
        const callerMembership = await RoomMember.findOne({
          roomId,
          userId: socket.user.id,
        }).lean();

        if (!callerMembership || callerMembership.role !== "host") {
          return callback?.({ success: false, message: "Only the host can remove users" });
        }

        if (userId === socket.user.id) {
          return callback?.({ success: false, message: "Host cannot remove themselves" });
        }

        // Persist the removal (upsert so re-removing is idempotent)
        await RemovedMember.findOneAndUpdate(
          { roomId, userId },
          { roomId, userId },
          { upsert: true }
        );

        // Delete the RoomMember record so getRoomById won't show them
        await RoomMember.findOneAndDelete({ roomId, userId, role: "member" });

        // Remove from room presence
        const presence = getPresence(roomId);
        const removedUser = presence.get(userId);
        presence.delete(userId);

        // Notify the removed user's socket directly
        const targetSocketId = userSockets.get(userId);
        if (targetSocketId) {
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            targetSocket.emit("you_were_removed", { roomId });
            targetSocket.leave(roomId);
          }
        }

        // Broadcast user_left so all clients clean up presence/member list
        io.to(roomId).emit("user_left", { userId });

        callback?.({ success: true });
      } catch (error) {
        console.error("Error in host_remove_user:", error);
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("host_approve_rejoin", async ({ roomId, userId }, callback) => {
      try {
        // Verify caller is host
        const callerMembership = await RoomMember.findOne({
          roomId,
          userId: socket.user.id,
        }).lean();

        if (!callerMembership || callerMembership.role !== "host") {
          return callback?.({ success: false, message: "Only the host can approve requests" });
        }

        const pendingKey = `${roomId}:${userId}`;
        const pending = pendingRejoinRequests.get(pendingKey);

        if (!pending) {
          return callback?.({ success: false, message: "No pending request found" });
        }

        pendingRejoinRequests.delete(pendingKey);

        // Clear the removed flag so future joins work normally
        await RemovedMember.findOneAndDelete({ roomId, userId });

        // Restore RoomMember record (upsert with member role)
        const room = await Room.findById(roomId).lean();
        const role = room?.ownerId?.toString() === userId ? "host" : "member";
        await RoomMember.findOneAndUpdate(
          { roomId, userId },
          { roomId, userId, role },
          { upsert: true }
        );

        const approvedUser = await User.findById(userId).select("name").lean();
        const approvedUserName = approvedUser?.name || "User";

        // Find and fully re-admit the waiting socket
        const targetSocketId = pending.socketId;
        const targetSocket = io.sockets.sockets.get(targetSocketId);

        if (targetSocket) {
          // Add to room
          targetSocket.join(roomId);

          const presence = getPresence(roomId);
          const colorIndex = presence.size;
          presence.set(userId, {
            userId,
            userName: approvedUserName,
            name: approvedUserName,
            role,
            color: colorForUser(userId, colorIndex),
            x: 0,
            y: 0,
          });

          const users = Array.from(presence.values());

          // Tell the approved user they're in
          targetSocket.emit("you_were_approved", {
            roomId,
            users,
            role,
            callActive: activeCalls.has(roomId),
          });

          // Broadcast to room so member list updates
          targetSocket.to(roomId).emit("user_joined", {
            userId,
            userName: approvedUserName,
            name: approvedUserName,
            role,
            color: presence.get(userId)?.color,
          });
        }

        callback?.({ success: true });
      } catch (error) {
        console.error("Error in host_approve_rejoin:", error);
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("host_reject_rejoin", async ({ roomId, userId }, callback) => {
      try {
        // Verify caller is host
        const callerMembership = await RoomMember.findOne({
          roomId,
          userId: socket.user.id,
        }).lean();

        if (!callerMembership || callerMembership.role !== "host") {
          return callback?.({ success: false, message: "Only the host can reject requests" });
        }

        const pendingKey = `${roomId}:${userId}`;
        const pending = pendingRejoinRequests.get(pendingKey);

        pendingRejoinRequests.delete(pendingKey);

        // RemovedMember record stays — user remains banned until next approval
        // Notify the waiting user
        if (pending) {
          const targetSocket = io.sockets.sockets.get(pending.socketId);
          if (targetSocket) {
            targetSocket.emit("you_were_rejected", { roomId });
          }
        }

        callback?.({ success: true });
      } catch (error) {
        console.error("Error in host_reject_rejoin:", error);
        callback?.({ success: false, message: error.message });
      }
    });

    // ================= END HOST MODERATION =================

    socket.on("leave_room", ({ roomId }) => {
      socket.leave(roomId);
      const presence = getPresence(roomId);
      presence.delete(socket.user.id);
      socket.to(roomId).emit("user_left", { userId: socket.user.id });
      if (currentRoomId === roomId) currentRoomId = null;
    });

    socket.on("disconnect", () => {
      // Remove from socket tracker
      if (userSockets.get(socket.user.id) === socket.id) {
        userSockets.delete(socket.user.id);
      }
      // Clean up presence but keep the active call alive so a refresh does not end it
      if (currentRoomId) {
        getPresence(currentRoomId).delete(socket.user.id);
        socket.to(currentRoomId).emit("user_left", { userId: socket.user.id });
      }
      if (
        currentRoomId &&
        activeScreenShares.get(currentRoomId)?.userId === socket.user.id
      ) {
        activeScreenShares.delete(currentRoomId);

        io.to(currentRoomId).emit("screen_share_stopped");
      }
    });
  });

  return io;
};

export default initSocket;
