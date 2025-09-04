import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandlers.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!accessToken) {
    throw new ApiError(401, "Unauthorized: No token provided");
  }

  try {
    // ✅ Verify access token normally
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select("-password -refreshToken");

    if (!user) throw new ApiError(401, "Unauthorized: User not found");

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.warn("Access token expired");

      const refreshToken =
        req.cookies?.refreshToken || req.header("x-refresh-token");

      if (!refreshToken) {
        throw new ApiError(401, "Unauthorized: Token expired & no refresh token");
      }

      try {
        const decodedRefresh = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedRefresh._id);
        if (!user || user.refreshToken !== refreshToken) {
          throw new ApiError(401, "Unauthorized: Invalid refresh token");
        }

        // ✅ Generate a new access token
        const newAccessToken = jwt.sign(
          { _id: user._id },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
        );

        // Store in cookie for backend use
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });

        // ALSO send in response header so frontend can update localStorage
        res.setHeader("x-access-token", newAccessToken);

        req.user = user;
        return next();
      } catch (refreshError) {
        throw new ApiError(
          401,
          "Unauthorized: Refresh token invalid or expired"
        );
      }
    }

    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Unauthorized: Invalid token format");
    }

    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
