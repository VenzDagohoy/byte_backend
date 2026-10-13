import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../database.js";

const BCRYPT_ROUNDS = 12;

export async function register(req, res) {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }
        const userRole = ["admin", "instructor", "student"].includes(role) ? role : "student";
        const normalizedEmail = email.trim().toLowerCase();

        const [existing] = await pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
        if (existing.length > 0) {
            return res.status(409).json({ message: "Email is already registered" });
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const [result] = await pool.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [name.trim(), normalizedEmail, passwordHash, userRole]
        );

        return res.status(201).json({
            message: "User registered successfully",
            user: { id: result.insertId, name: name.trim(), email: normalizedEmail, role: userRole }
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ message: "Server error during registration" });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const [rows] = await pool.execute("SELECT * FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const accessToken = jwt.sign(
            { userId: user.id, role: user.role, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
        );

        return res.status(200).json({ message: "Login successful", accessToken, role: user.role });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error during login" });
    }
}