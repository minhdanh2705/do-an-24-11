import { sql, pool } from '../config/database.js';

class Parent {
    static async getAll() {
        const db = await pool;
        const result = await db.request().query(`
            SELECT p.idPhuHuynh, p.hoTen, p.soDienThoai, p.email, p.trangThai, tk.taiKhoan 
            FROM PHUHUYNH p JOIN TAIKHOAN tk ON p.idPhuHuynh = tk.idPhuHuynh WHERE p.trangThai = 1
        `);
        return result.recordset;
    }

    static async getById(id) {
        const db = await pool;
        const result = await db.request().input('id', sql.Int, id).query(`
            SELECT p.*, tk.taiKhoan FROM PHUHUYNH p LEFT JOIN TAIKHOAN tk ON p.idPhuHuynh = tk.idPhuHuynh WHERE p.idPhuHuynh = @id
        `);
        return result.recordset[0];
    }

    static async create(parentData) {
        const { hoTen, soDienThoai, email, taiKhoan, matKhau } = parentData;
        const db = await pool;
        const transaction = new sql.Transaction(db);
        await transaction.begin();

        try {
            const checkUser = await transaction.request().input('taiKhoan', sql.NVarChar, taiKhoan)
                .query('SELECT COUNT(*) as count FROM TAIKHOAN WHERE taiKhoan = @taiKhoan');
            if (checkUser.recordset[0].count > 0) throw new Error('Username đã tồn tại');

            const parentResult = await transaction.request()
                .input('hoTen', sql.NVarChar, hoTen).input('soDienThoai', sql.NVarChar, soDienThoai)
                .input('email', sql.NVarChar, email).input('trangThai', sql.Int, 1)
                .query(`INSERT INTO PHUHUYNH (hoTen, soDienThoai, email, trangThai) OUTPUT INSERTED.idPhuHuynh VALUES (@hoTen, @soDienThoai, @email, @trangThai)`);
            const newId = parentResult.recordset[0].idPhuHuynh;

            const accResult = await transaction.request()
                .input('taiKhoan', sql.NVarChar, taiKhoan).input('matKhau', sql.NVarChar, matKhau)
                .input('trangThai', sql.Int, 1).input('vaiTro', sql.NVarChar, 'PHU_HUYNH').input('idPhuHuynh', sql.Int, newId)
                .query(`INSERT INTO TAIKHOAN (taiKhoan, matKhau, trangThai, vaiTro, idPhuHuynh) OUTPUT INSERTED.* VALUES (@taiKhoan, @matKhau, @trangThai, @vaiTro, @idPhuHuynh)`);

            await transaction.commit();
            return { idPhuHuynh: newId, taiKhoan: accResult.recordset[0].taiKhoan };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async getLinkedStudents(parentId) {
        const db = await pool;
        const result = await db.request().input('parentId', sql.Int, parentId).query(`
            SELECT h.*, t.tenTuyen, dd.tenDiemDung 
            FROM HOCSINH h 
            JOIN PHUHUYNH_HOCSINH ph ON h.idHocSinh = ph.idHocSinh
            LEFT JOIN TUYENDUONG t ON h.idTuyen = t.idTuyenDuong
            LEFT JOIN DIEMDUNG dd ON h.diemDon = dd.idDiemDung
            WHERE ph.idPhuHuynh = @parentId AND h.trangThai = 1
        `);
        return result.recordset;
    }

    static async linkStudent(parentId, studentId) {
        const db = await pool;
        const check = await db.request().input('parentId', sql.Int, parentId).input('studentId', sql.Int, studentId)
            .query('SELECT COUNT(*) as count FROM PHUHUYNH_HOCSINH WHERE idPhuHuynh = @parentId AND idHocSinh = @studentId');
        if (check.recordset[0].count > 0) throw new Error('Đã liên kết');

        await db.request().input('parentId', sql.Int, parentId).input('studentId', sql.Int, studentId)
            .query('INSERT INTO PHUHUYNH_HOCSINH (idPhuHuynh, idHocSinh) VALUES (@parentId, @studentId)');
        return { message: 'Liên kết thành công' };
    }

    static async unlinkStudent(parentId, studentId) {
        const db = await pool;
        const result = await db.request().input('parentId', sql.Int, parentId).input('studentId', sql.Int, studentId)
            .query('DELETE FROM PHUHUYNH_HOCSINH WHERE idPhuHuynh = @parentId AND idHocSinh = @studentId');
        if (result.rowsAffected[0] === 0) throw new Error('Không tìm thấy liên kết');
        return { message: 'Hủy liên kết thành công' };
    }
}
export default Parent;