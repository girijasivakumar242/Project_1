import { Event } from "../models/event.model.js";

// ✅ Create or add venue to existing event
export const createEvent = async (req, res) => {
  try {
    if (!req.file && !req.files?.poster) {
      return res.status(400).json({ error: "Poster image is required" });
    }

    const { category, eventName, location, startDate, endDate, ticketPrice, totalSeats } = req.body;

    if (isNaN(ticketPrice) || isNaN(totalSeats)) {
      return res.status(400).json({
        error: "Ticket price and total seats must be valid numbers",
      });
    }

    let timings = [];
    if (req.body.timings) {
      if (Array.isArray(req.body.timings)) {
        timings = req.body.timings.map((t) => JSON.parse(t));
      } else {
        timings = [JSON.parse(req.body.timings)];
      }
    }

    timings = timings.map((t) => ({
      fromTime: t.fromTime,
      toTime: t.toTime,
      totalSeats: Number(t.totalSeats),
    }));

    const posterPath = req.files?.poster
      ? `/uploads/${req.files.poster[0].filename}`
      : `/uploads/${req.file.filename}`;

    const seatMapPath = req.files?.seatMap
      ? `/uploads/${req.files.seatMap[0].filename}`
      : null;

    const normalizedCategory = category?.trim().toLowerCase();

    let event = await Event.findOne({ eventName, category: normalizedCategory });

    const venueObj = {
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      ticketPrice: Number(ticketPrice),
      totalSeats: Number(totalSeats),
      timings,
      seatMap: seatMapPath,
    };

    if (event) {
      event.venues.push(venueObj);
      await event.save();
      return res.status(200).json({ message: "New venue added to existing event", event });
    } else {
      const newEvent = new Event({
        category: normalizedCategory,
        eventName,
        poster: posterPath,
        venues: [venueObj],
      });
      await newEvent.save();
      return res.status(201).json({ message: "Event created successfully", event: newEvent });
    }
  } catch (error) {
    console.error("❌ Error creating event:", error);
    return res.status(500).json({ error: "Error creating event" });
  }
};
