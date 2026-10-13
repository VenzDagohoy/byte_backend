import { pool } from "../database.js";
import crypto from "crypto";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export const uploadResourceFile = async (req, res) => {
    try {
        const classroomId = Number(req.params.classroomId);
        const { filename, file_base64, file_type } = req.body;

        if (!filename || !file_base64) {
            return res.status(400).json({ message: "Filename and file payload are required." });
        }

        const buffer = Buffer.from(file_base64, "base64");
        let extractedText = "";

        // Parse file text based on extension / mime type
        if (filename.endsWith(".pdf") || file_type === "application/pdf") {
            const parsedPdf = await pdfParse(buffer);
            extractedText = parsedPdf.text;
        } else if (filename.endsWith(".docx") || file_type.includes("wordprocessingml")) {
            const parsedDocx = await mammoth.extractRawText({ buffer: buffer });
            extractedText = parsedDocx.value;
        } else {
            // Fallback for plain text or markdown files
            extractedText = buffer.toString("utf-8");
        }

        const resId = `res_${crypto.randomBytes(4).toString("hex")}`;
        await pool.execute(
            `INSERT INTO classroom_resources (id, classroom_id, filename, file_content) VALUES (?, ?, ?, ?)`,
            [resId, classroomId, filename, extractedText]
        );

        return res.status(201).json({
            message: "Lecture file successfully parsed, indexed into RAG, and stored.",
            resource: { id: resId, filename }
        });
    } catch (error) {
        console.error("File upload & parse error:", error);
        return res.status(500).json({ message: "Server error parsing uploaded document." });
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