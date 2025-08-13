// models/company.models.js
import mongoose, { Schema } from "mongoose";

const companySchema = new Schema({
  organiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  businessId: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  gstNumber: { type: String, required: true, trim: true },
  aadharNumber: { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  ifscCode: { type: String, required: true, trim: true },
  verified: { // ✅ Always use this name
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const Company = mongoose.model("Company", companySchema);
