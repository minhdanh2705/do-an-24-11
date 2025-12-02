import Driver from '../models/driver-model.js';
import { sql, poolPromise } from '../config/database.js';

// 1. Lấy tất cả tài xế
export const getAllDrivers = async (req, res) => {
    try {
        const data = await Driver.getAll();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// 2. Lấy tài xế theo ID (Hàm bạn đang bị thiếu gây lỗi)
export const getDriverById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const driver = await Driver.getById(id);
        if (!driver) return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
        res.json({ success: true, data: driver });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// 3. Tạo tài xế mới
export const createDriver = async (req, res) => {
    const { hoTen, taiKhoan, matKhau } = req.body;
    if (!hoTen || !taiKhoan || !matKhau) return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });

    try {
        const newDriver = await Driver.create(req.body);
        res.status(201).json({ success: true, message: 'Tạo tài xế thành công', data: newDriver });
    } catch (err) {
        if (err.message.includes('đã tồn tại')) return res.status(400).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// 4. Cập nhật tài xế (Bao gồm cập nhật trạng thái)
export const updateDriver = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { hoTen, soDienThoai, email, trangThai } = req.body;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('soDienThoai', sql.VarChar, soDienThoai)
            .input('email', sql.VarChar, email)
            .input('trangThai', sql.Int, trangThai)
            .query(`
                UPDATE TAIXE 
                SET hoTen = @hoTen, 
                    soDienThoai = @soDienThoai, 
                    email = @email,
                    trangThai = @trangThai
                WHERE idTaiXe = @id
            `);

        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// 5. Xóa tài xế
// driver-controller.js

export const deleteDriver = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await Driver.remove(id);
        res.json({ success: true, message: result.message });
    } catch (err) {
        // --- THÊM ĐOẠN NÀY ĐỂ LỌC LỖI CẢNH BÁO ---
        if (err.message.includes('CẢNH BÁO')) {
            // Trả về 400 (Bad Request) và giữ nguyên thông báo, KHÔNG thêm chữ "Lỗi server"
            return res.status(400).json({ success: false, message: err.message });
        }
        
        // Các lỗi khác thì mới báo lỗi server 500
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};