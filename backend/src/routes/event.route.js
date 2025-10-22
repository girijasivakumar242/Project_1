import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Event } from "../models/event.model.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";


const router = express.Router();

// Upload folder setup
const uploadDir = path.join(process.cwd(), "public", "temp");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    ),
});

const upload = multer({ storage });

/**
 * ===============================
 *        EVENT ROUTES
 * ===============================
 */

// GET events by organiser
router.get(
  "/organiser/:organiserId",
  asyncHandler(async (req, res) => {
    const { organiserId } = req.params;
    const events = await Event.find({ organiserId }).lean();
    res.status(200).json({ data: events });
  })
);

// GET event by ID
router.get("/:id", async (req, res) => {
  try {
    const baseEvent = await Event.findById(req.params.id).lean();
    if (!baseEvent) return res.status(404).json({ error: "Event not found" });

    const allEvents = await Event.find({
      eventName: baseEvent.eventName,
      category: baseEvent.category,
    }).lean();

    let mergedEvent = {
      _id: baseEvent._id,
      eventName: baseEvent.eventName,
      category: baseEvent.category,
      poster: baseEvent.poster,
      venues: [],
      organisers: [],
      createdAt: baseEvent.createdAt, // Include createdAt for frontend delete logic
    };

    allEvents.forEach((ev) => {
      mergedEvent.venues.push(...(ev.venues || []));
      mergedEvent.organisers.push(ev.organiserId);
    });

    res.status(200).json(mergedEvent);
  } catch (error) {
    console.error("❌ Error fetching merged event by id:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// GET all events (public)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().lean();
    const groupedEvents = {};
    events.forEach((event) => {
      const key = `${event.eventName.toLowerCase()}-${event.category.toLowerCase()}`;
      if (!groupedEvents[key]) {
        groupedEvents[key] = {
          _id: event._id,
          eventName: event.eventName,
          category: event.category,
          poster: event.poster,
          venues: [...event.venues],
          organisers: [event.organiserId],
          createdAt: event.createdAt,
        };
      } else {
        groupedEvents[key].venues.push(...event.venues);
        groupedEvents[key].organisers.push(event.organiserId);
      }
    });

    res.status(200).json(Object.values(groupedEvents));
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET events by category (merged)
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const events = await Event.find({ category: category.toLowerCase() }).lean();
    if (!events.length)
      return res.status(404).json({ error: "No events found for this category" });

    const groupedEvents = {};
    events.forEach((event) => {
      const key = `${event.eventName.toLowerCase()}-${event.category.toLowerCase()}`;
      if (!groupedEvents[key]) {
        groupedEvents[key] = {
          _id: event._id,
          eventName: event.eventName,
          category: event.category,
          poster: event.poster,
          venues: [...event.venues],
          organisers: [event.organiserId],
          createdAt: event.createdAt,
        };
      } else {
        groupedEvents[key].venues.push(...event.venues);
        groupedEvents[key].organisers.push(event.organiserId);
      }
    });

    res.status(200).json(Object.values(groupedEvents));
  } catch (error) {
    console.error("❌ Error fetching events by category:", error);
    res.status(500).json({ error: "Failed to fetch events by category" });
  }
});

// POST — Create event or add venues (organiser only)
router.post(
  "/",
  verifyJWT,
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "seatMap", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const { category, eventName } = req.body;
    if (!category || !eventName)
      return res.status(400).json({ error: "Event name and category are required" });
    if (!req.files.poster?.length)
      return res.status(400).json({ error: "Poster image is required" });
    if (!req.body.venues)
      return res.status(400).json({ error: "At least one venue is required" });

    let venues = JSON.parse(req.body.venues);
    venues = venues.map((v) => ({
      location: v.location,
      startDate: new Date(v.startDate),
      endDate: new Date(v.endDate),
      ticketPrice: Number(v.ticketPrice),
      timings: v.timings.map((t) => ({
        fromTime: t.fromTime,
        toTime: t.toTime,
        totalSeats: Number(t.totalSeats),
      })),
      seatMap: req.files.seatMap?.length
        ? `/temp/${req.files.seatMap[0].filename}`
        : undefined,
    }));

    const posterPath = `/temp/${req.files.poster[0].filename}`;

    let event = await Event.findOne({
      eventName,
      category: category.trim().toLowerCase(),
      organiserId: req.user._id,
    });

    if (event) {
      event.venues.push(...venues);
      await event.save();
      return res.status(200).json({ message: "Venues added", event });
    } else {
      const newEvent = new Event({
        category: category.trim().toLowerCase(),
        eventName,
        poster: posterPath,
        venues,
        organiserId: req.user._id,
      });
      await newEvent.save();
      return res.status(201).json({ message: "Event created", event: newEvent });
    }
  })
);

// ✅ DELETE event (organiser only, by ID)
router.delete("/:id", verifyJWT, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  const event = await Event.findById(id);
  if (!event) return res.status(404).json({ error: "Event not found" });

  if (event.organiserId.toString() !== req.user._id.toString())
    return res.status(403).json({ error: "Unauthorized to delete this event" });

  const createdAt = new Date(event.createdAt);
  const now = new Date();
  if (now - createdAt > 10 * 60 * 1000)
    return res.status(400).json({ error: "Delete window expired" });

  await Event.findByIdAndDelete(id);
  res.status(200).json({ message: "Event deleted successfully" });
}));


export default router;
