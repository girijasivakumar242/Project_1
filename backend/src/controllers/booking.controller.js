// 📁 booking.controller.js
import mongoose from "mongoose";
import { Booking } from "../models/booking.model.js";
import { Event } from "../models/event.model.js";
import { User } from "../models/user.model.js";

// ✅ Create Booking with pending status
export const createBooking = async (req, res) => {
  try {
    const { eventId, venueId, timingId, userId, seats, showTime } = req.body;

    if (!eventId || !venueId || !userId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const venue = event.venues.find((v) => v._id.toString() === venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Check conflicts only with paid bookings
    const existingBookings = await Booking.find({
      eventId,
      venueId,
      timingId,
      status: "confirmed",
      "bookings.paymentStatus": "paid",
    });

    for (let b of existingBookings) {
      const alreadyBooked = b.bookings.flatMap((s) => s.seats);
      const conflict = seats.filter((s) => alreadyBooked.includes(s));
      if (conflict.length > 0) {
        return res.status(400).json({ error: `Seats already booked: ${conflict.join(", ")}` });
      }
    }

    // ✅ Create booking in pending state
    const newBooking = await Booking.create({
      eventId,
      venueId,
      timingId,
      bookings: [
        {
          userId,
          username: user.username,
          seats,
          ticketPrice: venue.ticketPrice,
          showTime,
          paymentStatus: "pending", // 👈 Important
        },
      ],
      status: "pending",
    });

    res.status(201).json({
      message: "Booking created (pending payment)",
      bookingId: newBooking._id,
    });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ User Bookings – only confirmed + paid
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.params.userId;

    const bookings = await Booking.find({
      "bookings.userId": userId,
      status: "confirmed",
      "bookings.paymentStatus": "paid",
    }).lean();

    if (!bookings.length) return res.json([]);

    const enriched = [];
    for (let booking of bookings) {
      const event = await Event.findById(booking.eventId).lean();
      if (!event || !event.venues) continue;

      const venue = event.venues.find(
        (v) => v._id && v._id.toString() === booking.venueId.toString()
      );
      if (!venue) continue;

      for (let b of booking.bookings) {
        if (b.userId?.toString() === userId && b.paymentStatus === "paid") {
          enriched.push({
            bookingId: b._id?.toString(),
            eventName: event.eventName,
            eventDate: venue.startDate,
            seats: b.seats,
            venue: {
              _id: venue._id,
              location: venue.location,
              ticketPrice: b.ticketPrice,
              seatMap: venue.seatMap,
            },
            showTime: b.showTime,
            status: "confirmed",
            createdAt: b.createdAt || booking.createdAt,
            updatedAt: b.updatedAt || booking.updatedAt,
          });
        }
      }
    }

    res.json(enriched);
  } catch (error) {
    console.error("💥 [getUserBookings] Error:", error);
    res.status(500).json({
      error: "Failed to fetch user bookings",
      details: error.message,
    });
  }
};

// ✅ Admin All Bookings – confirmed only
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: "confirmed",
      "bookings.paymentStatus": "paid",
    }).lean();

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
        eventName: event?.eventName,
        venue: venue
          ? { location: venue.location, ticketPrice: venue.ticketPrice, seatMap: venue.seatMap }
          : null,
        timing: timing
          ? { fromTime: timing.fromTime, toTime: timing.toTime, totalSeats: timing.totalSeats }
          : null,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error("💥 [getAllBookings] Error:", error);
    res.status(500).json({ error: "Failed to fetch all bookings", details: error.message });
  }
};

// ✅ Event Bookings – confirmed + paid
export const getEventBookings = async (req, res) => {
  try {
    const { eventId, venueId, timingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) return res.status(400).json({ error: "Invalid Event ID" });

    const filter = {
      eventId,
      status: "confirmed",
      "bookings.paymentStatus": "paid",
    };
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
        eventName: event?.eventName,
        venue: venue
          ? { location: venue.location, ticketPrice: venue.ticketPrice, seatMap: venue.seatMap }
          : null,
        timing: timing
          ? { fromTime: timing.fromTime, toTime: timing.toTime, totalSeats: timing.totalSeats }
          : null,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error("💥 [getEventBookings] Error:", error);
    res.status(500).json({ error: "Failed to fetch event bookings", details: error.message });
  }
};
