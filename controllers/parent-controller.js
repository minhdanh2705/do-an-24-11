import { sql, poolPromise } from '../config/database.js';

// --- 1. CÁC HÀM CƠ BẢN CHO ADMIN (CRUD) ---

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
        const { hoTen, soDienThoai, email, diaChi } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('hoTen', sql.NVarChar, hoTen)
            .input('soDienThoai', sql.NVarChar, soDienThoai)
            .input('email', sql.NVarChar, email)
            .input('diaChi', sql.NVarChar, diaChi)
            .query('INSERT INTO PHUHUYNH (hoTen, soDienThoai, email, diaChi, trangThai) VALUES (@hoTen, @soDienThoai, @email, @diaChi, 1)');
        res.json({ success: true, message: 'Tạo phụ huynh thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateParent = async (req, res) => {
    try {
        const { id } = req.params;
        const { hoTen, soDienThoai, email, diaChi } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('soDienThoai', sql.NVarChar, soDienThoai)
            .input('email', sql.NVarChar, email)
            .input('diaChi', sql.NVarChar, diaChi)
            .query('UPDATE PHUHUYNH SET hoTen=@hoTen, soDienThoai=@soDienThoai, email=@email, diaChi=@diaChi WHERE idPhuHuynh=@id');
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

// Lấy danh sách con của phụ huynh (SỬA QUAN TRỌNG: Query bảng HOCSINH trực tiếp)
export const getStudentsForParent = async (req, res) => {
    try {
        const { id } = req.params; // idPhuHuynh
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('idPhuHuynh', sql.Int, id)
            .query(`
                SELECT 
                    h.idHocSinh, h.hoTen, h.lop, h.trangThai,
                    t.tenTuyen, x.bienSo as xeBus, tx.hoTen as tenTaiXe, tx.soDienThoai as sdtTaiXe,
                    d.tenDiemDung as tenDiemDon, t.gioBatDau
                FROM HOCSINH h
                LEFT JOIN TUYENDUONG t ON h.idTuyen = t.idTuyenDuong
                LEFT JOIN XEBUS x ON t.idXeBus = x.idXe
                LEFT JOIN (
                    SELECT TOP 1 idTuyen, idTaiXe FROM LICHTRINH ORDER BY idLichTrinh DESC
                ) lt ON t.idTuyenDuong = lt.idTuyen
                LEFT JOIN TAIXE tx ON lt.idTaiXe = tx.idTaiXe
                LEFT JOIN DIEMDUNG d ON h.idDiemDon = d.idDiemDung
                WHERE h.idPhuHuynh = @idPhuHuynh
            `);
            
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Các hàm liên kết (Giữ lại để tránh lỗi route, dù database đã đổi)
export const linkStudentToParent = async (req, res) => {
    try {
        const { id } = req.params; // parentId
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