import express from "express";
import {
  createBooking,
  getEventBookings,
  getUserBookings,
  getAllBookings,
  getBookingBySessionId 
} from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/", createBooking);
router.get("/user/:userId", getUserBookings);
router.get("/all", getAllBookings);
// ✅ Get bookings by event
router.get("/session/:sessionId", getBookingBySessionId);
router.get("/:eventId", getEventBookings);

// ✅ Get bookings by event + venue
router.get("/:eventId/:venueId", getEventBookings);

// ✅ Get bookings by event + venue + timing
router.get("/:eventId/:venueId/:timingId", getEventBookings);



export default router;
