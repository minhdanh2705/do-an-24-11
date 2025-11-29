import { sql, poolPromise } from '../config/database.js';
import Parent from '../models/parent-model.js';

// --- 1. CÁC HÀM CƠ BẢN CHO ADMIN (CRUD) ---

export const getAllParents = async (req, res) => {
    try {
        const pool = await poolPromise;
        // Lấy tất cả (Không dùng WHERE trangThai = 1 để Admin thấy được hết)
        const result = await pool.request().query('SELECT * FROM PHUHUYNH');
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
            .input('soDienThoai', sql.NVarChar, soDienThoai)
            .input('email', sql.NVarChar, email)
            .query('INSERT INTO PHUHUYNH (hoTen, soDienThoai, email, trangThai) VALUES (@hoTen, @soDienThoai, @email, 1)');
        res.json({ success: true, message: 'Tạo phụ huynh thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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