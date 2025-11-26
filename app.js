// FILE: app.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import cors from 'cors'; // Cần cài npm install cors nếu chưa có
import dotenv from 'dotenv';

// Import kết nối DB
import { sql, connectDB } from './config/database.js';

// Import Routers
import busRouter from './router/bus-router.js';
import routeRouter from './router/route-router.js';
import studentRouter from './router/student-router.js';
import authRouter from './router/auth-router.js';
import stopRouter from './router/stop-router.js';
import driverRouter from './router/driver-router.js';
import parentRouter from './router/parent-router.js';
import scheduleRouter from './router/schedule-router.js';
import trackingRouter from './router/tracking-router.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 5000;

// --- CẤU HÌNH CORS CHUẨN ---
app.use(cors({
    origin: 'http://localhost:3000', // Chỉ cho phép frontend React
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // Cho phép gửi cookie/session
}));

app.use(express.json());

// Session Config
app.use(session({
    secret: 'secret_key_smartbus',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Để false khi chạy localhost (http)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 ngày
    }
}));

// Kết nối Router
app.use('/api/auth', authRouter);
app.use('/api/buses', busRouter);
app.use('/api/routes', routeRouter);
app.use('/api/students', studentRouter);
app.use('/api/stops', stopRouter);
app.use('/api/drivers', driverRouter);
app.use('/api/parents', parentRouter);
app.use('/api/schedules', scheduleRouter);
app.use('/api/tracking', trackingRouter);

// Socket.io Config
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000', // Phải khớp với frontend
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware gán io vào req để dùng trong controller (nếu cần)
app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    socket.on('driver:updateLocation', (data) => {
        console.log(`[Socket] Location update:`, data);
        io.emit('bus:locationUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] User disconnected: ${socket.id}`);
    });
});

// Route test
app.get('/', (req, res) => {
    res.json({ message: 'SSB Backend is running...' });
});

// Khởi động server
server.listen(PORT, async () => {
    await connectDB(); // Đảm bảo kết nối DB thành công trước khi log
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});