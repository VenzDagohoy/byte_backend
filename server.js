import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./database.js";
import authRoutes from "./routes/authRoutes.js";
import classroomRoutes from "./routes/classroomRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ service: "ByteQuest Node API", status: "operational" });
});

// Register API Routes
app.use("/auth", authRoutes);
app.use("/classrooms", classroomRoutes);
app.use("/activities", activityRoutes);

async function startServer() {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to MySQL database successfully.");
        connection.release();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failure:", error.message);
        process.exit(1);
    }
}

startServer();