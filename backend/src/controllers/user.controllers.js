import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Company } from "../models/company.models.js";
import { generateAccessAndRefreshToken } from "../utils/token.js";
import jwt from "jsonwebtoken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
};

// ✅ Register Audience
const registerAudience = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  if (!fullname || !username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, "Email already registered");

  const user = await User.create({
    fullname,
    username,
    email,
    password,
    role: "audience",
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const respUser = {
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    username: user.username,
    role: user.role,
  };

  return res.status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(201, respUser, "Audience registered successfully"));
});

// ✅ Register Organiser
const registerOrganiser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  if (!fullname || !username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, "Email already registered");

  const user = await User.create({
    fullname,
    username,
    email,
    password,
    role: "organiser",
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const respUser = {
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    username: user.username,
    role: user.role,
  };

  return res.status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(201, respUser, "Organiser registered successfully"));
});

// ✅ Login User (Updated with Verified Update)
// ✅ Login User (Corrected - No auto verification)

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  // Check if organiser has a verified company
  let companyVerified = false;
  if (user.role === "organiser") {
    const company = await Company.findOne({ organiserId: user._id }).lean();
    companyVerified = !!company?.verified;
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { _id: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { _id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Return role + companyVerified at top level
  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .status(200)
    .json(
      new ApiResponse(200, {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        companyVerified,
        accessToken,
        refreshToken,
      }, "Login successful")
    );
});




// ✅ Google Login Placeholder
const googleLogin = asyncHandler(async (req, res) => {
  return res.status(501).json(new ApiResponse(501, {}, "Google login not implemented yet"));
});

// ✅ Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

  const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decoded?._id);
  if (!user || incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

// ✅ Logout User
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });

  return res.status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// ✅ Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
});

export {
  registerAudience,
  registerOrganiser,
  loginUser,
  googleLogin,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
};
