import express from "express";
import { addToWishlist, removeFromWishlist, getWishlist } from "../controllers/wishlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = express.Router();

// ✅ Add event to wishlist
router.post("/add", verifyJWT, addToWishlist);

// ✅ Remove event from wishlist
router.post("/remove", verifyJWT, removeFromWishlist);

// ✅ Get wishlist by email
router.get("/:email", verifyJWT, getWishlist);

export default router;
