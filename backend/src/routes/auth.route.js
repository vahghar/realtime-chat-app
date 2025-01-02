import express from 'express';
import { checkAuth, forgotPass, forgotPassLink, login, logout, signup, update } from '../controllers/auth.controller.js';
import { protectedRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/signup",signup)

router.post("/login", login)

router.get("/logout",logout)

router.put("/update",protectedRoute, update)

router.get("/check",protectedRoute,checkAuth)

router.post("/forgot-password-link",forgotPassLink);

router.put("/reset-password/:token",forgotPass);

export default router;