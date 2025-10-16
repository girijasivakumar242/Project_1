import express from "express";
import { createCheckoutSession } from "../controllers/paymentController.js";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();
router.post("/create-checkout-session", createCheckoutSession);

router.get("/stripe-key", (req, res) => {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    return res.status(500).json({ error: "Stripe publishable key not set in backend" });
  }
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});
export default router;
