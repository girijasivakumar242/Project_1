import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  category: { type: String, required: true },
  fromTime: { type: String, required: true },
  toTime: { type: String, required: true },
  eventName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String, required: true },
  ticketPrice: { type: Number, required: true },
  poster: { 
    type: String, 
    required: [true, "Poster image is required"], 
    validate: {
      validator: function(v) {
        return /\.(jpg|jpeg|png|gif)$/i.test(v);
      },
      message: props => `${props.value} is not a valid image file`
    }
  }
}, { timestamps: true });

export const Event = mongoose.model("Event", eventSchema);
