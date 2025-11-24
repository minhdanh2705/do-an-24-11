import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import apiRoutes from './router/api.js'; // Import router vừa tạo

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true 
}));
app.use(express.json());

// Session Config (Cho chức năng đăng nhập)
app.use(session({
    secret: 'secret_key_smartbus',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set true nếu dùng HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 1 ngày
    }
}));

// Routes
app.use('/api', apiRoutes);

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});