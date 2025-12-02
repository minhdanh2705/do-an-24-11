import { sql, poolPromise } from '../config/database.js';
import Parent from '../models/parent-model.js';

export const getAllParents = async (req, res) => {
    try {
        const result = await Parent.getAll(); // Gọi qua Model để có logic lọc trangThai=1
        res.json({ success: true, data: result });
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
        const result = await Parent.create(req.body);
        res.status(201).json({ success: true, message: result.message });
    } catch (err) {
        if (err.message.includes('đã được sử dụng') || err.message.includes('đã tồn tại')) {
            return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const updateParent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Parent.update(id, req.body);
        res.json({ success: true, message: result.message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteParent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Parent.remove(id);
        res.json({ success: true, message: result.message });
    } catch (err) {
        if (err.message.includes('CẢNH BÁO')) {
             return res.status(400).json({ success: false, message: err.message });
        }
        if (err.message.includes('Không tìm thấy')) {
             return res.status(404).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// ... Các hàm phụ khác giữ nguyên (getStudentsForParent, linkStudentToParent, unlinkStudentFromParent, getNotifications) ...
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
        await pool.request().input('pid', sql.Int, id).input('sid', sql.Int, studentId).query('UPDATE HOCSINH SET idPhuHuynh = @pid WHERE idHocSinh = @sid');
        res.json({ success: true, message: 'Liên kết thành công' });
    } catch (e) { res.status(500).json({success: false, message: e.message}); }
};

export const unlinkStudentFromParent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const pool = await poolPromise;
        await pool.request().input('sid', sql.Int, studentId).query('UPDATE HOCSINH SET idPhuHuynh = NULL WHERE idHocSinh = @sid');
        res.json({ success: true, message: 'Hủy liên kết thành công' });
    } catch (e) { res.status(500).json({success: false, message: e.message}); }
};

export const getNotifications = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request().input('pid', sql.Int, id).query(`SELECT * FROM THONGBAO WHERE idPhuHuynh = @pid ORDER BY thoiGian DESC`);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};