import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import paymentRoutes from "./routes/paymentRoutes.js";
import googleAuthRouter from "./routes/google.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
import companyRouter from "./routes/company.routes.js";
import eventOrganiserRouter from "./routes/eventOrganiser.routes.js";
import eventRoute from "./routes/event.route.js";
import { errorHandler } from "./middlewares/error.middlewares.js";
import bookingRoutes from "./routes/booking.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";

import dotenv from "dotenv";
import bodyParser from "body-parser";
import Stripe from "stripe";

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Serve static files
app.use(express.static(path.join(process.cwd(), "public")));

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ✅ CORS config for DEV + PROD
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie", "x-access-token"],
  })
);

import { stripeWebhook } from "./controllers/paymentController.js";
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// ✅ Normal body parsing for all other routes
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ✅ Your existing routes
app.use("/api/v1/organiser-events", eventOrganiserRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth", googleAuthRouter);
app.use("/api/v1/companies", companyRouter);
app.use("/api/v1/events", eventRoute);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/payments", paymentRoutes);

// ✅ Global error handler
app.use(errorHandler);

export { app };
