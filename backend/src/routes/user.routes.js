import express from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  registerAudience, 
  registerOrganiser,
  loginUser,
  logoutUser,
  googleLogin,
  getCurrentUser
} from "../controllers/user.controllers.js";

const router = express.Router();
router.post("/register-audience", registerAudience);
router.post("/register-organiser", registerOrganiser);

// Auth routes
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/google-login", googleLogin);

// Get current user info
router.get("/me", verifyJWT, getCurrentUser);

export default router;
