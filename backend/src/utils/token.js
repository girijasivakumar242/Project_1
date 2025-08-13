import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"; // adjust path if needed

export const generateAccessAndRefreshToken = async (userId) => {
  try {
    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      { _id: userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h" } // default 1h if not set
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      { _id: userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" } // default 7d if not set
    );

    // Save refresh token in DB
    await User.findByIdAndUpdate(
      userId,
      { refreshToken },
      { new: true }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new Error("Token generation failed");
  }
};
