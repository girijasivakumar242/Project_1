// middlewares/checkOrganiser.js
import { ApiError } from "../utils/ApiError.js";
import { Company } from "../models/company.models.js";

// middlewares/checkOrganiser.js
export const checkOrganiserVerified = async (req, res, next) => {
  try {
    const { user } = req;

    if (!user) throw new ApiError(401, "Unauthorized");
    if (user.role !== "organiser") throw new ApiError(403, "Not an organiser");

    const company = await Company.findOne({ organiserId: user._id }).lean();
    const isVerified = company?.verified || false;

    if (!isVerified) {
      throw new ApiError(403, "Access denied: Company not verified");
    }

    next();
  } catch (error) {
    next(error);
  }
};
