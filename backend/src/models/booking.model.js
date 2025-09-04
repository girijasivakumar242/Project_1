import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    venueId: { type: mongoose.Schema.Types.ObjectId, required: true },   // must exist in event.venues
    timingId: { type: mongoose.Schema.Types.ObjectId, required: true },  // must exist in venue.timings
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seats: { type: [String], required: true }, // Example: ["A1", "A2"]
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
