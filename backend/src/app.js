import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import membershipRoutes from './routes/membershipRoutes.js';

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json()); // Middleware untuk parsing JSON body

// Menyajikan file statis dari folder 'frontend/public'
app.use(express.static(path.resolve('frontend/public')));

// Rute untuk home/welcome, mengirimkan file index.html
app.get('/', (req, res) => {
  res.sendFile(path.resolve('frontend/public', 'index.html'));
});

// Menggunakan membership routes
app.use('/api/memberships', membershipRoutes);

// Mulai server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
