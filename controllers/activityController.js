import { pool } from "../database.js";
import crypto from "crypto";

// Fetch published activities for a specific classroom
export const getClassroomActivities = async (req, res) => {
    try {
        const classroomId = Number(req.params.classroomId);
        const userId = req.user.userId;
        const role = req.user.role;

        // Verify membership if user is a student
        if (role === "student") {
            const [memberCheck] = await pool.execute(
                "SELECT id FROM classroom_members WHERE classroom_id = ? AND student_id = ? LIMIT 1",
                [classroomId, userId]
            );
            if (memberCheck.length === 0) {
                return res.status(403).json({ message: "You are not enrolled in this classroom." });
            }
        }

        const [activities] = await pool.execute(
            "SELECT * FROM activities WHERE classroom_id = ? AND is_published = TRUE ORDER BY created_at DESC",
            [classroomId]
        );

        return res.status(200).json({ activities });
    } catch (error) {
        console.error("Get classroom activities error:", error);
        return res.status(500).json({ message: "Server error fetching activities." });
    }
};

// Instructor creates/publishes a new activity or coding challenge
export const createActivity = async (req, res) => {
    try {
        const classroomId = Number(req.params.classroomId);
        const instructorId = req.user.userId;
        const role = req.user.role;

        if (role !== "instructor" && role !== "admin") {
            return res.status(403).json({ message: "Only instructors can create activities." });
        }

        // Verify instructor owns the classroom (if not admin)
        if (role === "instructor") {
            const [roomCheck] = await pool.execute(
                "SELECT id FROM classrooms WHERE id = ? AND instructor_id = ? LIMIT 1",
                [classroomId, instructorId]
            );
            if (roomCheck.length === 0) {
                return res.status(403).json({ message: "You do not manage this classroom." });
            }
        }

        const { subject, activity_type, title, concept, difficulty, content, test_cases } = req.body;
        if (!subject || !activity_type || !title || !concept || !content) {
            return res.status(400).json({ message: "Missing required activity fields." });
        }

        const activityId = `act_${crypto.randomBytes(4).toString("hex")}`;

        await pool.execute(
            `INSERT INTO activities (id, classroom_id, subject, activity_type, title, concept, difficulty, content, test_cases, is_published) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
                activityId,
                classroomId,
                subject,
                activity_type,
                title,
                concept,
                difficulty || "medium",
                JSON.stringify(content),
                test_cases ? JSON.stringify(test_cases) : null
            ]
        );

        return res.status(201).json({
            message: "Activity created and published successfully",
            activity: { id: activityId, title, activity_type, concept }
        });
    } catch (error) {
        console.error("Create activity error:", error);
        return res.status(500).json({ message: "Server error creating activity." });
    }
};

// Student submits code solution for a challenge
export const submitCodeSolution = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const activityId = req.params.activityId;
        const { code_submitted, score_pct, is_success } = req.body;

        if (!code_submitted) {
            return res.status(400).json({ message: "Code submission cannot be empty." });
        }

        const subId = `sub_${crypto.randomBytes(4).toString("hex")}`;

        await pool.execute(
            `INSERT INTO submissions (id, student_id, activity_id, code_submitted, score_pct, is_success) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [subId, studentId, activityId, code_submitted, score_pct || 0.00, is_success ? 1 : 0]
        );

        return res.status(201).json({
            message: "Solution submitted and recorded successfully",
            submissionId: subId,
            is_success: !!is_success
        });
    } catch (error) {
        console.error("Submit code error:", error);
        return res.status(500).json({ message: "Server error saving submission." });
    }
};