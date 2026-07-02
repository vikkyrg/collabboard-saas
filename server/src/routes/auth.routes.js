import express from "express";
import { signup, login, googleAuth, getMe } from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleAuth);
router.get("/me", protect, getMe);

export default router;
