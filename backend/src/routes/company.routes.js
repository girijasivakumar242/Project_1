import express from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  registerCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  getMyCompany
} from "../controllers/company.controllers.js";

const router = express.Router();

// Company registration & fetching
router.post("/", verifyJWT, registerCompany);
router.get("/", verifyJWT, getCompanies);
router.get("/my", verifyJWT, getMyCompany);
router.get("/:id", verifyJWT, getCompanyById);
router.put("/:id", verifyJWT, updateCompany);

export default router;
