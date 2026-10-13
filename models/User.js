// Import the database connection pool
import { pool } from "../database.js";

// Define the User class for database operations
class User {
    // Find a user in the database by their email
    static async findByEmail(email) {
        // Execute a query to select the user data
        const [rows] = await pool.execute(
            "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1",
            [email]
        );
        // Return the first row or null if not found
        return rows[0] ?? null;
    }

    // Find a user in the database by their id
    static async findById(id) {
        // Execute a query to select the user data without the password
        const [rows] = await pool.execute(
            "SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1",
            [id]
        );
        // Return the first row or null if not found
        return rows[0] ?? null;
    }

    // Create a new user record in the database
    static async create({ name, email, passwordHash }) {
        // Execute an insert query with the user details
        const [result] = await pool.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            [name, email, passwordHash]
        );
        // Return the newly created user data including the generated id
        return {
            id: result.insertId,
            name,
            email
        };
    }
}

// Export the User class for use in other files
export default User;