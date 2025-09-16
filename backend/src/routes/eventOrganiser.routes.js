// routes/event.routes.js
import express from "express";
import { checkOrganiserVerified } from "../middlewares/checkOrganiser.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.post(
  "/create-event-landing",
  verifyJWT,                // 1️⃣ Make sure user is logged in
  checkOrganiserVerified,   // 2️⃣ Ensure organiser role + verified
  (req, res) => {
    res.json({ message: "Event created successfully" });
  }
);

export default router;
