import { sql, poolPromise } from '../config/database.js';

// 1. Lấy danh sách học sinh (kèm thông tin phụ huynh, tuyến, trạm)
export const getAllStudents = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                h.*, 
                p.hoTen as tenPhuHuynh, p.soDienThoai,
                t.tenTuyen,
                d.tenDiemDung as tenDiemDon
            FROM HOCSINH h
            LEFT JOIN PHUHUYNH p ON h.idPhuHuynh = p.idPhuHuynh
            LEFT JOIN TUYENDUONG t ON h.idTuyen = t.idTuyenDuong
            LEFT JOIN DIEMDUNG d ON h.idDiemDon = d.idDiemDung
            ORDER BY h.idHocSinh DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Lấy chi tiết 1 học sinh
export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM HOCSINH WHERE idHocSinh = @id');
        res.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Tạo học sinh mới (Đã xử lý NULL cho khóa ngoại)
export const createStudent = async (req, res) => {
    try {
        const { hoTen, lop, idPhuHuynh, idTuyen, idDiemDon, trangThai } = req.body;
        
        // --- LOGIC QUAN TRỌNG: Chuyển đổi rỗng hoặc 0 thành NULL ---
        // Nếu giá trị gửi lên là "" hoặc 0 -> Lưu NULL vào database
        const valPhuHuynh = (idPhuHuynh && idPhuHuynh != 0) ? parseInt(idPhuHuynh) : null;
        const valTuyen = (idTuyen && idTuyen != 0) ? parseInt(idTuyen) : null;
        const valDiemDon = (idDiemDon && idDiemDon != 0) ? parseInt(idDiemDon) : null;

        const pool = await poolPromise;
        await pool.request()
            .input('hoTen', sql.NVarChar, hoTen)
            .input('lop', sql.VarChar, lop)
            .input('idPhuHuynh', sql.Int, valPhuHuynh)
            .input('idTuyen', sql.Int, valTuyen)
            .input('idDiemDon', sql.Int, valDiemDon)
            .input('trangThai', sql.Int, trangThai || 1)
            .query(`
                INSERT INTO HOCSINH (hoTen, lop, idPhuHuynh, idTuyen, idDiemDon, trangThai) 
                VALUES (@hoTen, @lop, @idPhuHuynh, @idTuyen, @idDiemDon, @trangThai)
            `);
            
        res.json({ success: true, message: 'Thêm học sinh thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Database: " + err.message });
    }
};

// 4. Cập nhật học sinh (Đã xử lý NULL cho khóa ngoại)
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { hoTen, lop, idPhuHuynh, idTuyen, idDiemDon, trangThai } = req.body;

        // --- LOGIC QUAN TRỌNG: Chuyển đổi rỗng hoặc 0 thành NULL ---
        const valPhuHuynh = (idPhuHuynh && idPhuHuynh != 0) ? parseInt(idPhuHuynh) : null;
        const valTuyen = (idTuyen && idTuyen != 0) ? parseInt(idTuyen) : null;
        const valDiemDon = (idDiemDon && idDiemDon != 0) ? parseInt(idDiemDon) : null;

        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('lop', sql.VarChar, lop)
            .input('idPhuHuynh', sql.Int, valPhuHuynh)
            .input('idTuyen', sql.Int, valTuyen)
            .input('idDiemDon', sql.Int, valDiemDon)
            .input('trangThai', sql.Int, trangThai)
            .query(`
                UPDATE HOCSINH 
                SET hoTen = @hoTen, 
                    lop = @lop, 
                    idPhuHuynh = @idPhuHuynh, 
                    idTuyen = @idTuyen, 
                    idDiemDon = @idDiemDon, 
                    trangThai = @trangThai 
                WHERE idHocSinh = @id
            `);

        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Database: " + err.message });
    }
};

// 5. Xóa học sinh (Xóa mềm: chuyển trạng thái = 0)
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .query('UPDATE HOCSINH SET trangThai = 0 WHERE idHocSinh = @id');
            
        res.json({ success: true, message: 'Đã xóa học sinh' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 6. API phụ: Lấy phụ huynh của học sinh (Tránh lỗi route undefined)
export const getParentsForStudent = async (req, res) => {
    try {
        res.json({ success: true, data: [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};