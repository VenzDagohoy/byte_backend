import "dotenv/config";
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    // TiDB requires SSL/TLS encryption
    ssl: process.env.DB_SSL === "true" ? { 
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true 
    } : undefined
});