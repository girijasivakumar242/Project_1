import express from "express";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user.model.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let existingUser = await User.findOne({ email });

    if (!existingUser) {
      // Generate a unique username
      let username = email.split("@")[0];
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${email.split("@")[0]}${counter}`;
        counter++;
      }

      existingUser = await User.create({
        fullname: name,
        username,
        email,
        avatar: picture,
        googleId,
      });
    }

    const accessToken = existingUser.generateAccessToken();
    const refreshToken = existingUser.generateRefreshToken();

    existingUser.refreshToken = refreshToken;
    await existingUser.save();

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false, // set true in production
        sameSite: "Lax",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, // set true in production
        sameSite: "Lax",
      })
      .status(200)
      .json({
        message: "Google login successful",
        user: {
          _id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          avatar: existingUser.avatar,
        },
      });
  } catch (err) {
    console.error("Google login error:", err.message);
    res.status(500).json({ message: "Google login failed" });
  }
});

export default router;
