import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


import googleAuthRouter from "./routes/google.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
import companyRouter from "./routes/company.routes.js";
import eventRouter from "./routes/event.routes.js";
import districtsRouter from "./routes/districts.routes.js"; // ✅ changed to import
import eventRoute from "./routes/event.route.js";
import { errorHandler } from "./middlewares/error.middlewares.js";

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ✅ CORS config for DEV + PROD
app.use(cors({
  origin: CLIENT_URL,
  credentials: true, // Allow cookies
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie", "x-access-token"], // Allow frontend to read tokens in headers
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));
app.use("/temp", express.static("public/temp"));
// Routes
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/auth", googleAuthRouter);
app.use("/api/v1/companies", companyRouter);
app.use("/api/districts", districtsRouter);
app.use("/api/v1/events", eventRoute);
// Global error handler
app.use(errorHandler);

export { app };
