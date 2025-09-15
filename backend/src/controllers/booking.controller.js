import mongoose from "mongoose";
import { Booking } from "../models/booking.model.js";
import { Event } from "../models/event.model.js";

// ✅ Create or update a booking
export const createBooking = async (req, res) => {
  try {
    const { eventId, venueId, timingId, userId, seats } = req.body;

    if (!eventId || !venueId || !userId || !Array.isArray(seats) || seats.length === 0)
      return res.status(400).json({ error: "Missing or invalid required fields" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const venue = event.venues.find((v) => v._id.toString() === venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found for this event" });

    let timing = null;
    if (timingId) {
      timing = venue.timings.find((t) => t._id.toString() === timingId);
      if (!timing) return res.status(404).json({ error: "Timing not found for this venue" });
    }

    // ✅ Check seat overlap
    const filter = { eventId, venueId, status: "confirmed" };
    if (timingId) filter.timingId = timingId;

    const existingBooking = await Booking.findOne(filter);
    if (existingBooking) {
      const allBookedSeats = existingBooking.bookings.flatMap((b) => b.seats);
      const overlap = seats.filter((s) => allBookedSeats.includes(s));
      if (overlap.length > 0)
        return res.status(400).json({ error: `These seats are already booked: ${overlap.join(", ")}` });
    }

    // ✅ Add booking
    const updatedBooking = await Booking.findOneAndUpdate(
      filter,
      {
        $push: { bookings: { userId, seats } },
        status: "confirmed",
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      message: "Booking successful",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("💥 [createBooking] Error:", error);
    res.status(500).json({ error: "Failed to create booking", details: error.message });
  }
};

// ✅ Get bookings by user (for reminders)
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.params.userId;

    const bookings = await Booking.find({
      "bookings.userId": userId,
      status: "confirmed",
    }).lean();

    const enriched = [];

    for (let booking of bookings) {
      const event = await Event.findById(booking.eventId).lean();
      const venue = event?.venues.find(
        (v) => v._id.toString() === booking.venueId.toString()
      );
      const timing = booking.timingId
        ? venue?.timings.find(
            (t) => t._id.toString() === booking.timingId.toString()
          )
        : null;

      // ✅ Collect all seats for this user
      const userSeats = booking.bookings
        .filter((b) => b.userId.toString() === userId)
        .flatMap((b) => b.seats);

      enriched.push({
        bookingId: booking._id,
        eventName: event?.eventName || "Unknown Event",
        eventDate: event?.date || "TBD",
        seats: userSeats, // now includes all seats ["A13","D15"]
        venue: venue
          ? {
              location: venue.location,
              ticketPrice: venue.ticketPrice,
              seatMap: venue.seatMap,
            }
          : null,
        timing: timing
          ? {
              fromTime: timing.fromTime,
              toTime: timing.toTime,
              totalSeats: timing.totalSeats,
            }
          : null,
      });
    }

    res.json(enriched);
  } catch (error) {
    console.error("💥 [getUserBookings] Error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch user bookings", details: error.message });
  }
};



// ✅ Get all bookings (Admin)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: "confirmed" }).lean();
    if (bookings.length === 0) return res.json([]);

    const eventIds = bookings.map((b) => b.eventId);
    const events = await Event.find({ _id: { $in: eventIds } }).lean();

    const enriched = bookings.map((booking) => {
      const event = events.find((e) => e._id.toString() === booking.eventId.toString());
      const venue = event?.venues?.find((v) => v._id.toString() === booking.venueId.toString());
      const timing = booking.timingId
        ? venue?.timings?.find((t) => t._id.toString() === booking.timingId.toString())
        : null;

      return {
        ...booking,
        eventId: booking.eventId.toString(),
        venueId: booking.venueId.toString(),
        timingId: booking.timingId?.toString() || null,
        userId: booking.userId.toString(),
        eventName: event?.eventName,
        venue: venue ? { location: venue.location, ticketPrice: venue.ticketPrice, seatMap: venue.seatMap } : null,
        timing: timing ? { fromTime: timing.fromTime, toTime: timing.toTime, totalSeats: timing.totalSeats } : null,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error("💥 [getAllBookings] Error:", error);
    res.status(500).json({ error: "Failed to fetch all bookings", details: error.message });
  }
};

// ✅ Get bookings for a specific event
export const getEventBookings = async (req, res) => {
  try {
    const { eventId, venueId, timingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) return res.status(400).json({ error: "Invalid Event ID" });

    const filter = { eventId, status: "confirmed" };
    if (venueId) filter.venueId = venueId;
    if (timingId) filter.timingId = timingId;

    const bookings = await Booking.find(filter).lean();
    if (bookings.length === 0) return res.json([]);

    const event = await Event.findById(eventId).lean();

    const enriched = bookings.map((booking) => {
      const venue = event?.venues?.find((v) => v._id.toString() === booking.venueId.toString());
      const timing = booking.timingId
        ? venue?.timings?.find((t) => t._id.toString() === booking.timingId.toString())
        : null;

      return {
        ...booking,
        eventId: booking.eventId.toString(),
        venueId: booking.venueId.toString(),
        timingId: booking.timingId?.toString() || null,
        eventName: event?.eventName,
        venue: venue ? { location: venue.location, ticketPrice: venue.ticketPrice, seatMap: venue.seatMap } : null,
        timing: timing ? { fromTime: timing.fromTime, toTime: timing.toTime, totalSeats: timing.totalSeats } : null,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error("💥 [getEventBookings] Error:", error);
    res.status(500).json({ error: "Failed to fetch event bookings", details: error.message });
  }
}; 

