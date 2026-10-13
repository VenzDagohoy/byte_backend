import { pool } from "../database.js";
import crypto from "crypto";

export const createClassroom = async (req, res) => {
    try {
        const instructorId = req.user.userId;
        const { title, subject } = req.body;
        if (!title || !subject) {
            return res.status(400).json({ message: "Title and subject are required" });
        }
        const joinCode = crypto.randomBytes(3).toString("hex").toUpperCase();

        const [result] = await pool.execute(
            "INSERT INTO classrooms (instructor_id, title, subject, join_code) VALUES (?, ?, ?, ?)",
            [instructorId, title, subject, joinCode]
        );

        return res.status(201).json({
            message: "Classroom created",
            classroom: { id: result.insertId, title, subject, joinCode }
        });
    } catch (error) {
        console.error("Create classroom error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const joinClassroom = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { joinCode } = req.body;
        if (!joinCode) {
            return res.status(400).json({ message: "Join code is required" });
        }

        const [rooms] = await pool.execute("SELECT * FROM classrooms WHERE join_code = ? LIMIT 1", [joinCode.trim().toUpperCase()]);
        if (rooms.length === 0) {
            return res.status(404).json({ message: "Invalid join code" });
        }
        const classroom = rooms[0];

        const [existing] = await pool.execute(
            "SELECT id FROM classroom_members WHERE classroom_id = ? AND student_id = ? LIMIT 1",
            [classroom.id, studentId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: "Already joined this classroom" });
        }

        await pool.execute("INSERT INTO classroom_members (classroom_id, student_id) VALUES (?, ?)", [classroom.id, studentId]);
        return res.status(200).json({ message: "Successfully joined classroom", classroom });
    } catch (error) {
        console.error("Join classroom error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getMyClassrooms = async (req, res) => {
    try {
        const { userId, role } = req.user;
        let classrooms = [];
        if (role === "instructor") {
            const [rows] = await pool.execute("SELECT * FROM classrooms WHERE instructor_id = ? ORDER BY created_at DESC", [userId]);
            classrooms = rows;
        } else if (role === "student") {
            const [rows] = await pool.execute(
                `SELECT c.* FROM classrooms c JOIN classroom_members m ON c.id = m.classroom_id WHERE m.student_id = ?`,
                [userId]
            );
            classrooms = rows;
        } else {
            // Admin sees all classrooms
            const [rows] = await pool.execute("SELECT * FROM classrooms ORDER BY created_at DESC");
            classrooms = rows;
        }
        return res.status(200).json({ classrooms });
    } catch (error) {
        console.error("Get classrooms error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};