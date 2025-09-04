import mongoose from "mongoose";

const timingSchema = new mongoose.Schema(
  {
    fromTime: { type: String, required: true },
    toTime: { type: String, required: true },
    totalSeats: { type: Number },
    seatMap: { type: String },
  },
  { _id: true }
);

const venueSchema = new mongoose.Schema(
  {
    location: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    ticketPrice: { type: Number, required: true, min: 1 },
    timings: { type: [timingSchema], required: true },
    seatMap: { type: String },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    organiserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    eventName: { type: String, required: true },
    category: { type: String, required: true },
    poster: { type: String },
    venues: [venueSchema],
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
