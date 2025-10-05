import express from "express";
import { addFriend, getFriends, removeFriend } from "../controllers/friends.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protectedRoute);

// Add friend by email
router.post("/add", addFriend);

// Get friends list
router.get("/", getFriends);

// Remove friend
router.delete("/:friendId", removeFriend);

export default router;
