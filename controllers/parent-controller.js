// --- QUAN TRỌNG: Dòng này phải có ở đầu file ---
import Parent from '../models/parent-model.js'; 
import { sql, poolPromise } from '../config/database.js';

// Hàm lấy danh sách con (Code mới)
export const getStudentsForParent = async (req, res) => {
    try {
        const { id } = req.params; // id phụ huynh
        // Gọi hàm trong Model
        const students = await Parent.getStudentsByParentId(id);
        
        res.json({ success: true, data: students });
    } catch (error) {
        console.error("Lỗi Backend lấy DS con:", error);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
};

// --- CÁC HÀM CŨ GIỮ NGUYÊN (Để không lỗi router) ---

export const getAllParents = async (req, res) => {
    try {
        const pool = await poolPromise;
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
        const { hoTen, soDienThoai, email } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('hoTen', sql.NVarChar, hoTen)
            .input('soDienThoai', sql.VarChar, soDienThoai)
            .input('email', sql.VarChar, email)
            .query('INSERT INTO PHUHUYNH (hoTen, soDienThoai, email, trangThai) VALUES (@hoTen, @soDienThoai, @email, 1)');
        res.status(201).json({ success: true, message: 'Thêm phụ huynh thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateParent = async (req, res) => {
    try {
        const { id } = req.params;
        const { hoTen, soDienThoai, email } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('soDienThoai', sql.VarChar, soDienThoai)
            .input('email', sql.VarChar, email)
            .query('UPDATE PHUHUYNH SET hoTen = @hoTen, soDienThoai = @soDienThoai, email = @email WHERE idPhuHuynh = @id');
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteParent = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request().input('id', sql.Int, id).query('UPDATE PHUHUYNH SET trangThai = 0 WHERE idPhuHuynh = @id');
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Placeholder cho các hàm liên kết cũ (nếu router vẫn gọi)
export const linkStudentToParent = async (req, res) => res.json({success:true});
export const unlinkStudentFromParent = async (req, res) => res.json({success:true});