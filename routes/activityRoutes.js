import express from "express";
import { 
    getClassroomActivities, 
    createActivity, 
    submitCodeSolution 
} from "../controllers/activityController.js";
import authenticateToken from "../middleware/authenticateToken.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Get published activities for a classroom
router.get("/classroom/:classroomId", authenticateToken, getClassroomActivities);

// Instructor creates an activity inside a classroom
router.post("/classroom/:classroomId", authenticateToken, requireRole("instructor", "admin"), createActivity);

// Student submits solution for an activity
router.post("/submit/:activityId", authenticateToken, requireRole("student"), submitCodeSolution);

export default router;