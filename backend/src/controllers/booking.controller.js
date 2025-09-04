import { Booking } from "../models/booking.model.js";
import { Event } from "../models/event.model.js";

// ✅ Create or update a booking
export const createBooking = async (req, res) => {
  try {
    const { eventId, venueId, timingId, userId, seats } = req.body;

    if (!eventId || !venueId || !timingId || !userId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: "Missing or invalid required fields" });
    }

    // Ensure event exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Find venue by _id
    const venue = event.venues.find(v => v._id.toString() === venueId);
    if (!venue) return res.status(404).json({ error: "Venue not found for this event" });

    // Find timing by _id
    const timing = venue.timings.find(t => t._id.toString() === timingId);
    if (!timing) return res.status(404).json({ error: "Timing not found for this venue" });

    // Prevent double booking
    const alreadyBooked = await Booking.find({
      eventId,
      venueId,
      timingId,
      seats: { $in: seats },
      status: "confirmed",
    });

    if (alreadyBooked.length > 0) {
      const bookedSeats = alreadyBooked.flatMap(b => b.seats);
      const overlap = seats.filter(s => bookedSeats.includes(s));
      if (overlap.length > 0) {
        return res.status(400).json({
          error: `These seats are already booked: ${overlap.join(", ")}`,
        });
      }
    }

    // ✅ Merge booking for same user instead of creating duplicate
    const booking = await Booking.findOneAndUpdate(
      { eventId, venueId, timingId, userId },
      { $addToSet: { seats: { $each: seats } }, status: "confirmed" },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Booking successful", booking });
  } catch (error) {
    console.error("Booking error:", error.message);
    res.status(500).json({ error: "Failed to create booking", details: error.message });
  }
};

// ✅ Get all confirmed bookings (with enriched event/venue/timing details)
export const getEventBookings = async (req, res) => {
  try {
    const { eventId, venueId, timingId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    const filter = { eventId, status: "confirmed" };
    if (venueId) filter.venueId = venueId;
    if (timingId) filter.timingId = timingId;

    // Fetch bookings
    const bookings = await Booking.find(filter).lean();

    // Fetch event with nested venues/timings
    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Enrich bookings
    const enrichedBookings = bookings.map((booking) => {
      const venue = event.venues?.find(v => v._id.toString() === booking.venueId.toString());
      const timing = venue?.timings?.find(t => t._id.toString() === booking.timingId.toString());

      return {
        ...booking,
        eventName: event.eventName,
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
      };
    });

    res.json(enrichedBookings);
  } catch (error) {
    console.error("Fetch bookings error:", error.message);
    res.status(500).json({ error: "Failed to fetch bookings", details: error.message });
  }
};
