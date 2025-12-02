import { sql, poolPromise } from '../config/database.js';
import Parent from '../models/parent-model.js';

// --- 1. CÁC HÀM CƠ BẢN CHO ADMIN (CRUD) ---

export const getAllParents = async (req, res) => {
    try {
        const pool = await poolPromise;
        // Lấy tất cả (Không dùng WHERE trangThai = 1 để Admin thấy được hết)
        const result = await pool.request().query('SELECT * FROM PHUHUYNH WHERE trangThai = 1');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getParentById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM PHUHUYNH WHERE idPhuHuynh = @id');
        res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createParent = async (req, res) => {
    try {
        // Gọi hàm create từ Model
        const result = await Parent.create(req.body);
        res.status(201).json({ success: true, message: result.message });
    } catch (err) {
        // Các lỗi trùng lặp do mình throw new Error bên Model
        if (err.message.includes('đã được sử dụng') || err.message.includes('đã tồn tại')) {
            return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const updateParent = async (req, res) => {
    try {
        const { id } = req.params;
        const { hoTen, soDienThoai, email, trangThai } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('soDienThoai', sql.NVarChar, soDienThoai)
            .input('email', sql.NVarChar, email)
            .input('trangThai', sql.Int, trangThai)
            .query('UPDATE PHUHUYNH SET hoTen=@hoTen, soDienThoai=@soDienThoai, email=@email, trangThai=@trangThai WHERE idPhuHuynh=@id');
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// controllers/parent-controller.js

export const deleteParent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Parent.remove(id);
        res.json({ success: true, message: result.message });
    } catch (err) {
        console.error("Lỗi xóa phụ huynh:", err.message);

        // Bắt lỗi Cảnh báo từ Model
        if (err.message.includes('CẢNH BÁO')) {
             return res.status(400).json({ success: false, message: err.message });
        }
        
        // Lỗi không tìm thấy
        if (err.message.includes('Không tìm thấy')) {
             return res.status(404).json({ success: false, message: err.message });
        }

        // Lỗi hệ thống khác
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// --- 2. CÁC HÀM CHO PHỤ HUYNH (APP) ---
export const getStudentsForParent = async (req, res) => {
    try {
        const { id } = req.params;
        const students = await Parent.getStudentsByParentId(id);
        res.json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
};

export const linkStudentToParent = async (req, res) => {
    try {
        const { id } = req.params; 
        const { studentId } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('pid', sql.Int, id)
            .input('sid', sql.Int, studentId)
            .query('UPDATE HOCSINH SET idPhuHuynh = @pid WHERE idHocSinh = @sid');
        res.json({ success: true, message: 'Liên kết thành công' });
    } catch (e) { res.status(500).json({success: false, message: e.message}); }
};

export const unlinkStudentFromParent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('sid', sql.Int, studentId)
            .query('UPDATE HOCSINH SET idPhuHuynh = NULL WHERE idHocSinh = @sid');
        res.json({ success: true, message: 'Hủy liên kết thành công' });
    } catch (e) { res.status(500).json({success: false, message: e.message}); }
};
// --- THÊM VÀO CUỐI FILE parent-controller.js ---

export const getNotifications = async (req, res) => {
    try {
        const { id } = req.params; // idPhuHuynh
        const pool = await poolPromise;
        
        // Lấy thông báo của phụ huynh này, sắp xếp mới nhất lên đầu
        const result = await pool.request()
            .input('pid', sql.Int, id)
            .query(`
                SELECT * FROM THONGBAO 
                WHERE idPhuHuynh = @pid 
                ORDER BY thoiGian DESC
            `);
            
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};