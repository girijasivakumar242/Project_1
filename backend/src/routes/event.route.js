import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Event } from "../models/event.model.js";

const router = express.Router();

// Ensure temp folder exists
const uploadDir = path.join(process.cwd(), "public", "temp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Multer file filter: allow images for poster, and images + pdf for seatMap
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "poster") {
    // Only images for poster
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Poster must be an image file"), false);
    }
  } else if (file.fieldname === "seatMap") {
    // Images or pdf for seatMap
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Seat map must be an image or PDF file"), false);
    }
  } else {
    cb(new Error("Unexpected field"), false);
  }
};

const upload = multer({ storage, fileFilter });

/**
 * POST — Create or Update Event
 */
router.post(
  "/",
  upload.fields([
    { name: "poster", maxCount: 1 },
    { name: "seatMap", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { category, eventName, location, startDate, endDate, ticketPrice } = req.body;

      if (!eventName || !category) {
        return res
          .status(400)
          .json({ success: false, message: "Event name and category are required" });
      }

      // Parse timings (support single or multiple)
      let timings = [];
      if (req.body.timings) {
        timings = Array.isArray(req.body.timings) ? req.body.timings : [req.body.timings];
        timings = timings.map((t) => (typeof t === "string" ? JSON.parse(t) : t));
      } else if (req.body.fromTime && req.body.toTime) {
        timings = [{ fromTime: req.body.fromTime, toTime: req.body.toTime }];
      }

      if (!timings.length) {
        return res
          .status(400)
          .json({ success: false, message: "At least one timing is required" });
      }

      let event = await Event.findOne({ eventName, category: category.trim().toLowerCase() });

      if (event) {
        // Add new venues
        const newVenues = timings.map((t) => ({
          location,
          fromTime: t.fromTime,
          toTime: t.toTime,
          startDate,
          endDate,
          ticketPrice,
        }));

        event.venues.push(...newVenues);

        // Update seatMap if provided in this update
        if (req.files.seatMap && req.files.seatMap.length > 0) {
          event.seatMap = `/temp/${req.files.seatMap[0].filename}`;
        }

        await event.save();

        return res.status(200).json({
          success: true,
          message: "New venue(s) added to existing event",
          data: event,
        });
      } else {
        // Creating new event requires poster
        if (!req.files.poster || req.files.poster.length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "Poster image is required" });
        }

        const newEvent = new Event({
          category: category.trim().toLowerCase(),
          eventName,
          poster: `/temp/${req.files.poster[0].filename}`,
          venues: timings.map((t) => ({
            location,
            fromTime: t.fromTime,
            toTime: t.toTime,
            startDate,
            endDate,
            ticketPrice,
          })),
          seatMap:
            req.files.seatMap && req.files.seatMap.length > 0
              ? `/temp/${req.files.seatMap[0].filename}`
              : undefined,
        });

        await newEvent.save();

        return res.status(201).json({
          success: true,
          message: "Event created successfully",
          data: newEvent,
        });
      }
    } catch (error) {
      console.error("❌ Error creating event:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * GET — All events (unique cards for dashboard)
 */
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().select("eventName poster category");
    res.status(200).json(events);
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET — Category-specific events
 */
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const events = await Event.find({ category: category.trim().toLowerCase() });
    res.status(200).json(events);
  } catch (error) {
    console.error("❌ Error fetching events:", error);
    res.status(500).json({ error: "Error fetching events" });
  }
});

/**
 * GET — Single event by ID (with venues)
 */
router.get("/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json(event);
  } catch (error) {
    console.error("❌ Error fetching event by ID:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
