import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import { createServer } from 'http'; // 1. Import http
import { Server } from 'socket.io';  // 2. Import socket.io
import apiRoutes from './router/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 3. Tạo HTTP Server từ Express
const httpServer = createServer(app);

// 4. Cấu hình Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:3000', // Port của Frontend (Parent/Driver App)
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true 
}));
app.use(express.json());

// Session Config
app.use(session({
    secret: 'secret_key_smartbus',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

// 5. QUAN TRỌNG: Lưu biến io vào app để Controller có thể dùng (req.app.get('io'))
app.set('io', io);

// 6. Debug: Log khi có người kết nối socket
io.on('connection', (socket) => {
    console.log('⚡ Một Client vừa kết nối Socket:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client đã ngắt kết nối:', socket.id);
    });
});

// Routes
app.use('/api', apiRoutes);

// 7. Thay app.listen thành httpServer.listen
httpServer.listen(PORT, () => {
    console.log(`🚀 Server (có Socket.IO) đang chạy tại http://localhost:${PORT}`);
});