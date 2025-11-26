import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';
import groupRoutes from './routes/groupRoute.js';
import { connectDB } from './config/db.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// try {
//   await connectDB();
// } catch (error) {
//   console.error('Failed to connect to the database', error);
// }

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});