import {Server} from "socket.io";
import http from "http";
import express from "express"

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", process.env.FRONTEND_URL]
    }
  });
  
export function getReceiverSocketId (userId) {
    return userSocketMap[userId];
}

const userSocketMap = {};

// Store graffiti sessions and drawing data
const graffitiSessions = new Set();
const drawingHistory = [];
const graffitiUserMap = {};

//trying to listen to incoming connections
io.on("connection",(socket)=>{
    console.log("a user connected ",socket.id);

    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;
    }

    //send events to all connected clients
    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("disconnect",()=>{
        console.log("a user disconnected ",socket.id);
        delete userSocketMap[userId];

        // Remove from graffiti sessions if present
        graffitiSessions.forEach(sessionId => {
            if (graffitiUserMap[sessionId] === socket.id) {
                graffitiSessions.delete(sessionId);
                delete graffitiUserMap[sessionId];
            }
        });

        io.emit("getOnlineUsers ",Object.keys(userSocketMap));
        io.emit("user-count", graffitiSessions.size);
    })

    // Graffiti Wall Events
    socket.on("join-graffiti", (data) => {
        const { sessionId } = data;
        graffitiSessions.add(sessionId);
        graffitiUserMap[sessionId] = socket.id;

        // Send current drawing history to new user
        socket.emit("canvas-history", drawingHistory);

        // Broadcast updated user count
        io.emit("user-count", graffitiSessions.size);

        console.log(`User ${sessionId} joined graffiti wall. Total users: ${graffitiSessions.size}`);
    });

    socket.on("drawing-stroke", (strokeData) => {
        // Add stroke to history
        drawingHistory.push(strokeData);

        // Limit history size to prevent memory issues (keep last 1000 strokes)
        if (drawingHistory.length > 1000) {
            drawingHistory.shift();
        }

        // Broadcast stroke to all other users (not the sender)
        socket.broadcast.emit("drawing-stroke", strokeData);
    });

    socket.on("cursor-move", (cursorData) => {
        // Find the session ID for this socket
        let sessionId = null;
        Object.keys(graffitiUserMap).forEach(key => {
            if (graffitiUserMap[key] === socket.id) {
                sessionId = key;
            }
        });

        if (sessionId) {
            // Broadcast cursor position to all other users
            socket.broadcast.emit("live-cursor", {
                sessionId,
                x: cursorData.x,
                y: cursorData.y,
                color: cursorData.color
            });
        }
    });

    socket.on("clear-canvas", () => {
        // Canvas clearing disabled to preserve collaborative artwork
        console.log('Clear canvas request ignored - preserving community art');
    });
})

export {io,app,server}