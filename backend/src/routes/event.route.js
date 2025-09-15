import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Event } from "../models/event.model.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import asyncHandler from "express-async-handler";

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

// ✅ GET events by organiser
router.get(
  "/organiser/:organiserId",
  asyncHandler(async (req, res) => {
    const { organiserId } = req.params;
    const events = await Event.find({ organiserId }).lean();
    res.status(200).json({ data: events });
  })
);

// ✅ GET event by ID (merged across organisers)
router.get("/:id", async (req, res) => {
  try {
    // Step 1: find base event
    const baseEvent = await Event.findById(req.params.id).lean();
    if (!baseEvent) return res.status(404).json({ error: "Event not found" });

    // Step 2: find all events with same name + category
    const allEvents = await Event.find({
      eventName: baseEvent.eventName,
      category: baseEvent.category,
    }).lean();

    // Step 3: merge venues + organisers
    let mergedEvent = {
      _id: baseEvent._id, // keep the requested ID as reference
      eventName: baseEvent.eventName,
      category: baseEvent.category,
      poster: baseEvent.poster,
      venues: [],
      organisers: [],
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


// ✅ GET all events (public, merged by eventName + category)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().lean();

    // Group events by eventName + category
    const groupedEvents = {};
    events.forEach((event) => {
      const key = `${event.eventName.toLowerCase()}-${event.category.toLowerCase()}`;
      if (!groupedEvents[key]) {
        groupedEvents[key] = {
          _id: event._id, // pick first id
          eventName: event.eventName,
          category: event.category,
          poster: event.poster,
          venues: [...event.venues],
          organisers: [event.organiserId],
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

// ✅ GET events by category (merged)
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const events = await Event.find({ category: category.toLowerCase() }).lean();

    if (!events.length) {
      return res.status(404).json({ error: "No events found for this category" });
    }

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

// ✅ POST — Create event or add venues (organiser only)
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

    // Parse venues JSON safely
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

    // Check if event exists (same organiser, name, category)
    let event = await Event.findOne({
      eventName,
      category: category.trim().toLowerCase(),
      organiserId: req.user._id,
    });

    if (event) {
      // Add new venues
      event.venues.push(...venues);
      await event.save();
      return res.status(200).json({ message: "Venues added", event });
    } else {
      // Create new event
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

export default router;
