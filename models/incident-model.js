import { sql, poolPromise } from '../config/database.js';

class Incident {
    // Tạo báo cáo mới
    static async create(data) {
        const { idTaiXe, idLichTrinh, moTa } = data;
        const pool = await poolPromise;
        
        let tieuDe = 'Sự cố ngoài tuyến';
        if (idLichTrinh) {
            const routeRes = await pool.request().input('id', sql.Int, idLichTrinh).query(`
                SELECT t.tenTuyen FROM LICHTRINH l 
                JOIN TUYENDUONG t ON l.idTuyen = t.idTuyenDuong 
                WHERE l.idLichTrinh = @id
            `);
            if (routeRes.recordset[0]) {
                tieuDe = `Sự cố: ${routeRes.recordset[0].tenTuyen}`;
            }
        }

        await pool.request()
            .input('idTaiXe', sql.Int, idTaiXe)
            .input('idLichTrinh', sql.Int, idLichTrinh || null)
            .input('tieuDe', sql.NVarChar, tieuDe)
            .input('moTa', sql.NVarChar, moTa)
            .query(`
                INSERT INTO SUCO (idTaiXe, idLichTrinh, tieuDe, moTa, thoiGian, trangThai)
                VALUES (@idTaiXe, @idLichTrinh, @tieuDe, @moTa, GETDATE(), 0)
            `);
        
        return { message: 'Gửi báo cáo thành công' };
    }

    // Lấy tất cả báo cáo (SỬA LẠI ĐỂ ĐẢM BẢO CÓ idSuCo)
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                s.idSuCo, -- <--- CHẮC CHẮN LẤY CỘT NÀY
                s.tieuDe, s.moTa, s.thoiGian, s.trangThai,
                s.idTaiXe, s.idLichTrinh,
                tx.hoTen as tenTaiXe,
                t.tenTuyen,
                x.bienSo
            FROM SUCO s
            LEFT JOIN TAIXE tx ON s.idTaiXe = tx.idTaiXe
            LEFT JOIN LICHTRINH l ON s.idLichTrinh = l.idLichTrinh
            LEFT JOIN TUYENDUONG t ON l.idTuyen = t.idTuyenDuong
            LEFT JOIN XEBUS x ON l.idXe = x.idXe
            ORDER BY s.thoiGian DESC
        `);
        return result.recordset;
    }
}

export default Incident;