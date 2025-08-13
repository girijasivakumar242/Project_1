import { Event } from "../models/event.model.js";

export const createEvent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Poster image is required" });
    }

    const { category, fromTime, toTime, eventName, startDate, endDate, location, ticketPrice } = req.body;

    const newEvent = new Event({
      category,
      fromTime,
      toTime,
      eventName,
      startDate,
      endDate,
      location,
      ticketPrice,
      poster: `/uploads/${req.file.filename}`
    });

    await newEvent.save();
    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("❌ Error creating event:", error);
    res.status(500).json({ error: "Error creating event" });
  }
};
