import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import friendsRoutes from "./routes/friends.route.js";
import dotenv from "dotenv";
import { connectDb } from "./lib/dbConnect.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./lib/socket.js";

dotenv.config();
const PORT = process.env.PORT || 5001; // Changed to 5001 to match your usage
const allowedOrigins = [
  "https://realtime-chat-app-delta-flame.vercel.app",
  "http://localhost:5173", // Keep for local development,
  "https://chat-app-backend-8oyh.onrender.com"
];

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      const msg = `The CORS policy for this site does not allow access from ${origin}`;
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req,res) => {  // Fixed: added req parameter
    res.send("Hello welcome to real time chat app");
});

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/friends", friendsRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`); // Dynamic port logging
    connectDb();
});