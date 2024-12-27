import express from 'express';
import { login, logout, signup, update } from '../controllers/auth.controller.js';
import { protectedRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/signup",signup)

router.post("/login", login)

router.get("/logout",logout)

router.put("/update",protectedRoute, update)

export default router;