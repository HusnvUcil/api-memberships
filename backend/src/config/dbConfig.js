import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Buat pool koneksi dan gunakan nama dbPool
const dbPool = mysql.createPool({
    host: process.env.DB_HOST, // Host database
    user: process.env.DB_USER, // User database
    password: process.env.DB_PASS, // Password database
    database: process.env.DB_NAME, // Nama database
    // waitForConnections: true, // Tunggu koneksi jika pool penuh
    // connectionLimit: 10, // Batas maksimum koneksi dalam pool
    // queueLimit: 0, // Tidak ada batas antrian
  })
  .promise(); // Gunakan wrapper Promise untuk mendukung async/await

export default dbPool;
