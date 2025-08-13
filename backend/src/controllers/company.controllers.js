import { asyncHandler } from "../utils/asyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Company } from "../models/company.models.js";

// ✅ Helper to check role
const requireRole = (user, role) => {
  if (!user || user.role !== role) {
    throw new ApiError(403, `Only ${role}s can perform this action`);
  }
};

// ✅ Register a company
const registerCompany = asyncHandler(async (req, res) => {
  requireRole(req.user, "organiser");

  const {
    businessId,
    phoneNumber,
    gstNumber,
    aadharNumber,
    accountNumber,
    ifscCode
  } = req.body;

  // Validate required fields
  const requiredFields = {
    businessId,
    phoneNumber,
    gstNumber,
    aadharNumber,
    accountNumber,
    ifscCode
  };

  for (const [field, value] of Object.entries(requiredFields)) {
    if (!value || String(value).trim() === "") {
      throw new ApiError(400, `${field} is required`);
    }
  }

  // Prevent duplicate company for organiser
  const existing = await Company.findOne({
    organiserId: req.user._id,
    $or: [{ businessId }, { gstNumber }]
  });

  if (existing) {
    throw new ApiError(409, "Company already exists for this organiser");
  }

  const company = await Company.create({
    organiserId: req.user._id,
    ...requiredFields,
    verified: true // Auto-verify (you can set false if you want admin approval)
  });

  return res
    .status(201)
    .json(new ApiResponse(201, company, "Company registered successfully"));
});

// ✅ Get all companies (Admin only)
const getCompanies = asyncHandler(async (req, res) => {
  requireRole(req.user, "admin");

  const companies = await Company.find().populate("organiserId", "name email");

  return res
    .status(200)
    .json(new ApiResponse(200, companies, "Companies fetched successfully"));
});

// ✅ Get a company by ID
const getCompanyById = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) throw new ApiError(404, "Company not found");

  if (
    req.user.role !== "admin" &&
    company.organiserId.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "You are not authorized to view this company");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, company, "Company fetched successfully"));
});

// ✅ Update company
const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) throw new ApiError(404, "Company not found");

  if (
    req.user.role !== "admin" &&
    company.organiserId.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "You are not authorized to update this company");
  }

  // Only admin can change verification
  if ("verified" in req.body && req.user.role !== "admin") {
    delete req.body.verified;
  }

  Object.keys(req.body).forEach((key) => {
    if (req.body[key] !== undefined) {
      company[key] = req.body[key];
    }
  });

  await company.save();

  return res
    .status(200)
    .json(new ApiResponse(200, company, "Company updated successfully"));
});

// ✅ Get my company
const getMyCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ organiserId: req.user._id });
  return res
    .status(200)
    .json(new ApiResponse(200, company || null, "My company fetched successfully"));
});

export {
  registerCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  getMyCompany
};
