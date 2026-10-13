import express from "express";
import { createClassroom, joinClassroom, getMyClassrooms } from "../controllers/classroomController.js";
import authenticateToken from "../middleware/authenticateToken.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.post("/create", authenticateToken, requireRole("instructor", "admin"), createClassroom);
router.post("/join", authenticateToken, requireRole("student"), joinClassroom);
router.get("/", authenticateToken, getMyClassrooms);

export default router;