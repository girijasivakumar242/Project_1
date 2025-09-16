import Wishlist from "../models/Wishlist.model.js";
import {User} from "../models/user.model.js";
import {Event} from "../models/event.model.js";

export const addToWishlist = async (req, res) => {
  try {
    const { userEmail, eventId } = req.body;
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    let wishlist = await Wishlist.findOne({ user: user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: user._id, events: [] });
    }

    if (!wishlist.events.includes(eventId)) {
      wishlist.events.push(eventId);
    }

    await wishlist.save();
    res.status(200).json({ success: true, wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const { userEmail, eventId } = req.body;
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    let wishlist = await Wishlist.findOne({ user: user._id });
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    wishlist.events = wishlist.events.filter((id) => id.toString() !== eventId);
    await wishlist.save();

    res.status(200).json({ success: true, wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const wishlist = await Wishlist.findOne({ user: user._id }).populate("events");
    if (!wishlist) return res.json([]);

    res.json(wishlist.events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
