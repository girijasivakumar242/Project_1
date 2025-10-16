import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    venueId: { type: mongoose.Schema.Types.ObjectId, required: true },
    timingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    bookings: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        username: { type: String, required: true }, // ✅ Store username
        seats: { type: [String], required: true },
        ticketPrice: { type: Number, required: true }, // ✅ Store ticket price
        showTime: { type: String, required: true }, // ✅ Store timing (e.g., "7:00 PM" or ISO date-time)
        bookedAt: { type: Date, default: Date.now }, // ✅ When the user booked
      },
    ],
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
