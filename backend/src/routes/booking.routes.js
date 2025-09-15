import express from "express";
import {
  createBooking,
  getEventBookings,
  getUserBookings,
  getAllBookings
} from "../controllers/booking.controller.js";

const router = express.Router();

// ✅ Create a booking
router.post("/", createBooking);

// ✅ Get bookings by user (⚡ keep this BEFORE :eventId)
router.get("/user/:userId", getUserBookings);

// ✅ Get all bookings (Admin view)
router.get("/all", getAllBookings);

// ✅ Get bookings by event
router.get("/:eventId", getEventBookings);

// ✅ Get bookings by event + venue
router.get("/:eventId/:venueId", getEventBookings);

// ✅ Get bookings by event + venue + timing
router.get("/:eventId/:venueId/:timingId", getEventBookings);

export default router;
