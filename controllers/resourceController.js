import { pool } from "../database.js";
import crypto from "crypto";

export const uploadResource = async (req, res) => {
    try {
        const classroomId = Number(req.params.classroomId);
        const { filename, file_content } = req.body;

        if (!filename || !file_content) {
            return res.status(400).json({ message: "Filename and file content are required." });
        }

        const resId = `res_${crypto.randomBytes(4).toString("hex")}`;
        await pool.execute(
            `INSERT INTO classroom_resources (id, classroom_id, filename, file_content) VALUES (?, ?, ?, ?)`,
            [resId, classroomId, filename, file_content]
        );

        return res.status(201).json({
            message: "Lecture resource uploaded successfully.",
            resource: { id: resId, filename }
        });
    } catch (error) {
        console.error("Upload resource error:", error);
        return res.status(500).json({ message: "Server error uploading resource." });
    }
};

export const getResources = async (req, res) => {
    try {
        const classroomId = Number(req.params.classroomId);
        const [rows] = await pool.execute(
            `SELECT id, filename, uploaded_at FROM classroom_resources WHERE classroom_id = ? ORDER BY uploaded_at DESC`,
            [classroomId]
        );
        return res.status(200).json({ resources: rows });
    } catch (error) {
        console.error("Get resources error:", error);
        return res.status(500).json({ message: "Server error fetching resources." });
    }
};