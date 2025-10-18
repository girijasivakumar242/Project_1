import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    venueId: { type: mongoose.Schema.Types.ObjectId, required: true },
    timingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    bookings: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        username: { type: String, required: true },
        seats: { type: [String], required: true },
        ticketPrice: { type: Number, required: true },
        showTime: { type: String, required: true },
        bookedAt: { type: Date, default: Date.now },

        // ✅ Payment info added
        paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
        paymentSessionId: { type: String },   // Stripe session ID
        amountPaid: { type: Number },         // Total amount paid
        currency: { type: String },           // e.g., "inr"
      },
    ],
    status: { type: String, enum: ["confirmed", "pending","cancelled"], default: "confirmed" },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
