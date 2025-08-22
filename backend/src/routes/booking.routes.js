import express from "express";
import { createBooking, getEventBookings } from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/", createBooking); // POST /api/bookings
router.get("/:eventId", getEventBookings); // GET /api/bookings/:eventId

export default router;
