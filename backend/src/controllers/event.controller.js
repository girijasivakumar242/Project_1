import { Event } from "../models/event.model.js";

export const createEvent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Poster image is required" });
    }

    const { category, fromTime, toTime, eventName, startDate, endDate, location, ticketPrice } = req.body;

    // ✅ Normalize
    const normalizedCategory = category.trim().toLowerCase();

    // ✅ Check if event already exists
    let event = await Event.findOne({ eventName, category: normalizedCategory });

    if (event) {
      // 👉 If event exists, add new venue to it
      event.venues.push({
        location,
        fromTime,
        toTime,
        startDate,
        endDate,
        ticketPrice
      });

      await event.save();
      return res.status(200).json({ message: "New venue added to existing event", event });
    } else {
      // 👉 If event doesn't exist, create new one
      const newEvent = new Event({
        category: normalizedCategory,
        eventName,
        poster: `/temp/${req.file.filename}`,
        venues: [
          {
            location,
            fromTime,
            toTime,
            startDate,
            endDate,
            ticketPrice
          }
        ]
      });

      await newEvent.save();
      return res.status(201).json({ message: "Event created successfully", event: newEvent });
    }
  } catch (error) {
    console.error("❌ Error creating event:", error);
    res.status(500).json({ error: "Error creating event" });
  }
};
