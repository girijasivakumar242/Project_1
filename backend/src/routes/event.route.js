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

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // store in public/temp
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // keep correct extension
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

// POST — Create event
router.post("/", upload.single("poster"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Poster image is required"
      });
    }

    const event = new Event({
      ...req.body,
      poster: `/temp/${req.file.filename}` // now pointing to /temp instead of /uploads
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event
    });
  } catch (error) {
    console.error("❌ Error creating event:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
});

// GET — Fetch all events (only name + poster for audience dashboard)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().select("eventName poster");
    res.status(200).json(events);
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
