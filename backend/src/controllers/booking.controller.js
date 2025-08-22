import { Booking } from "../models/booking.model.js";
import { Event } from "../models/event.model.js";

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const { eventId, userId, seats } = req.body;

    if (!eventId || !userId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: "Missing or invalid required fields" });
    }

    // Check if any requested seats are already booked
    const existingBookings = await Booking.find({
      eventId,
      seats: { $in: seats },
      status: "confirmed",
    });

    if (existingBookings.length > 0) {
      const bookedSeats = existingBookings.flatMap((b) => b.seats);
      const overlappingSeats = seats.filter((s) => bookedSeats.includes(s));
      return res.status(400).json({
        error: `These seats are already booked: ${overlappingSeats.join(", ")}`,
      });
    }

    // Save booking
    const booking = new Booking({ eventId, userId, seats, status: "confirmed" });
    await booking.save();

    res.status(201).json({ message: "Booking successful", booking });
  } catch (error) {
    console.error("Booking error:", error.message);
    res.status(500).json({ error: "Failed to create booking", details: error.message });
  }
};

// Get all confirmed bookings for a specific event
export const getEventBookings = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) return res.status(400).json({ error: "Event ID is required" });

    const bookings = await Booking.find({ eventId, status: "confirmed" });

    res.json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error.message);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};
