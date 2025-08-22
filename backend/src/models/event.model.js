import mongoose from "mongoose";

const venueSchema = new mongoose.Schema({
  location: { type: String, required: true },
  fromTime: { type: String, required: true },
  toTime: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  ticketPrice: { type: Number, required: true },
});

const eventSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    eventName: { type: String, required: true },
    poster: {
      type: String,
      required: [true, "Poster image is required"],
      lowercase: true,
      validate: {
        validator: (v) => /\.(jpg|jpeg|png|gif)$/i.test(v),
        message: (props) => `${props.value} is not a valid image file`,
      },
    },
    seatMap: {
      type: String,  // store file path for seat map (can be image/pdf)
      lowercase: true,
      validate: {
        validator: (v) =>
          !v || /\.(jpg|jpeg|png|gif|pdf)$/i.test(v),  // optional, but if present must be valid
        message: (props) => `${props.value} is not a valid seat map file`,
      },
    },
    venues: [venueSchema],
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
