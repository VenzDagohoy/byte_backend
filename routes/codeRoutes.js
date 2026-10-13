import express from "express";
import { executeAndEvaluateCode } from "../controllers/codeController.js";
import authenticateToken from "../middleware/authenticateToken.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/submit", authenticateToken, requireRole("student"), executeAndEvaluateCode);

export default router;