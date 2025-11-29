import { sql, poolPromise } from '../config/database.js';

class Schedule {
    // POST: Tạo lịch trình mới
    static async create(scheduleData) {
        const { idTaiXe, idXe, idTuyen, thoiGianBatDau, thoiGianKetThuc, ngayChay } = scheduleData;
        const pool = await poolPromise;

        const statusCheck = await pool.request()
            .input('idTaiXe', sql.Int, idTaiXe).input('idXe', sql.Int, idXe)
            .query(`SELECT (SELECT trangThai FROM TAIXE WHERE idTaiXe=@idTaiXe) as tx, (SELECT trangThai FROM XEBUS WHERE idXe=@idXe) as xe`);
        if (statusCheck.recordset[0]?.tx === 0) throw new Error("Tài xế đang bị khóa!");
        if (statusCheck.recordset[0]?.xe === 0) throw new Error("Xe đang bị khóa!");

        const checkConflict = await pool.request()
            .input('idTaiXe', sql.Int, idTaiXe).input('idXe', sql.Int, idXe)
            .input('ngayChay', sql.Date, ngayChay || new Date())
            .input('newStart', sql.VarChar(5), thoiGianBatDau).input('newEnd', sql.VarChar(5), thoiGianKetThuc)
            .query(`SELECT COUNT(*) as count FROM LICHTRINH WHERE ngayChay = @ngayChay AND (idTaiXe = @idTaiXe OR idXe = @idXe) AND trangThai = 0 AND (trangThaiDiChuyen IS NULL OR trangThaiDiChuyen != 2) AND ((@newStart < thoiGianKetThuc) AND (@newEnd > thoiGianBatDau))`);

        if (checkConflict.recordset[0].count > 0) throw new Error("XUNG ĐỘT: Tài xế hoặc Xe đang có lịch chạy chưa kết thúc!");

        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const req = transaction.request()
                .input('idTaiXe', sql.Int, idTaiXe).input('idXe', sql.Int, idXe).input('idTuyen', sql.Int, idTuyen)
                .input('tg1', sql.VarChar(5), thoiGianBatDau).input('tg2', sql.VarChar(5), thoiGianKetThuc).input('nc', sql.Date, ngayChay || new Date());
            
            const res = await req.query(`INSERT INTO LICHTRINH (idTaiXe, idXe, idTuyen, ngayChay, thoiGianBatDau, thoiGianKetThuc, trangThai, thuTuTramHienTai, trangThaiDiChuyen, idDiemDungHienTai) OUTPUT INSERTED.idLichTrinh VALUES (@idTaiXe, @idXe, @idTuyen, @nc, @tg1, @tg2, 0, 1, 0, (SELECT TOP 1 idDiemDung FROM TUYENDUONG_DIEMDUNG WHERE idTuyenDuong = @idTuyen ORDER BY thuTu ASC))`);
            
            const newId = res.recordset[0].idLichTrinh;
            await transaction.request().input('lid', sql.Int, newId).input('tid', sql.Int, idTuyen)
                .query(`INSERT INTO DIEMDANH (idLichTrinh, idHocSinh, trangThai) SELECT @lid, idHocSinh, 0 FROM HOCSINH WHERE idTuyen = @tid AND trangThai = 1`);
            
            await transaction.commit();
            return { idLichTrinh: newId };
        } catch (e) { await transaction.rollback(); throw e; }
    }

    static async update(id, d) {
        const pool = await poolPromise;
        await pool.request().input('id', sql.Int, id).input('tx', sql.Int, d.idTaiXe).input('xe', sql.Int, d.idXe).input('t', sql.Int, d.idTuyen).input('nc', sql.Date, d.ngayChay).input('t1', sql.VarChar(5), d.thoiGianBatDau).input('t2', sql.VarChar(5), d.thoiGianKetThuc)
            .query(`UPDATE LICHTRINH SET idTaiXe=@tx, idXe=@xe, idTuyen=@t, ngayChay=@nc, thoiGianBatDau=@t1, thoiGianKetThuc=@t2 WHERE idLichTrinh=@id`);
        return { message: "Updated" };
    }

    static async delete(id) {
        const pool = await poolPromise;
        const tr = new sql.Transaction(pool); await tr.begin();
        try {
            await tr.request().input('id', sql.Int, id).query(`DELETE FROM SUCO WHERE idLichTrinh = @id`);
            await tr.request().input('id', sql.Int, id).query(`DELETE FROM DIEMDANH WHERE idLichTrinh = @id`);
            await tr.request().input('id', sql.Int, id).query(`DELETE FROM LICHTRINH WHERE idLichTrinh = @id`);
            await tr.commit(); return { message: "Deleted" };
        } catch (e) { await tr.rollback(); throw e; }
    }

    static async getAll() {
        const pool = await poolPromise;
        const res = await pool.request().query(`SELECT l.idLichTrinh, l.ngayChay, l.trangThai, l.trangThaiDiChuyen, CONVERT(varchar(5), l.thoiGianBatDau, 108) as thoiGianBatDau, CONVERT(varchar(5), l.thoiGianKetThuc, 108) as thoiGianKetThuc, t.tenTuyen, t.idTuyenDuong as idTuyen, tx.hoTen as tenTaiXe, tx.idTaiXe, x.bienSo as bienSoXe, x.idXe FROM LICHTRINH l LEFT JOIN TUYENDUONG t ON l.idTuyen = t.idTuyenDuong LEFT JOIN TAIXE tx ON l.idTaiXe = tx.idTaiXe LEFT JOIN XEBUS x ON l.idXe = x.idXe ORDER BY l.ngayChay DESC, l.idLichTrinh DESC`);
        return res.recordset;
    }

    static async getById(id) {
        const pool = await poolPromise;
        const r1 = await pool.request().input('id', sql.Int, id).query(`SELECT DISTINCT l.*, CONVERT(varchar(5), l.thoiGianBatDau, 108) as thoiGianBatDau, CONVERT(varchar(5), l.thoiGianKetThuc, 108) as thoiGianKetThuc, t.tenTuyen, tx.hoTen as tenTaiXe, x.bienSo FROM LICHTRINH l LEFT JOIN TUYENDUONG t ON l.idTuyen=t.idTuyenDuong LEFT JOIN TAIXE tx ON l.idTaiXe=tx.idTaiXe LEFT JOIN XEBUS x ON l.idXe=x.idXe WHERE l.idLichTrinh=@id`);
        if (!r1.recordset[0]) return null;
        const s = r1.recordset[0];
        const r2 = await pool.request().input('id', sql.Int, id).query(`SELECT DISTINCT d.*, h.hoTen, h.lop, h.idPhuHuynh, h.idDiemDon, dd.tenDiemDung FROM DIEMDANH d JOIN HOCSINH h ON d.idHocSinh=h.idHocSinh LEFT JOIN DIEMDUNG dd ON h.idDiemDon=dd.idDiemDung WHERE d.idLichTrinh=@id`);
        s.danhSachDiemDanh = r2.recordset;
        return s;
    }

    // --- HÀM CẬP NHẬT TRẠNG THÁI (ĐÃ SỬA: CHỈ 1->2, CÒN LẠI LÀ 3) ---
    static async updateStatus(id, status) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Cập nhật trạng thái chuyến xe
            let query = 'UPDATE LICHTRINH SET trangThaiDiChuyen = @status ';
            if (Number(status) === 2) { 
                 query += ', trangThai = 1 '; 
            }
            query += ' WHERE idLichTrinh = @id';

            await transaction.request()
                .input('id', sql.Int, id)
                .input('status', sql.Int, Number(status))
                .query(query);

            // 2. LOGIC CHỐT SỔ CHẶT CHẼ
            if (Number(status) === 2) { 
                // a. Chỉ những bé "Đã lên xe" (1) -> Mới được chuyển thành "Đã trả" (2)
                await transaction.request()
                    .input('id', sql.Int, id)
                    .query(`
                        UPDATE DIEMDANH 
                        SET trangThai = 2, thoiGianTra = GETDATE() 
                        WHERE idLichTrinh = @id AND trangThai = 1
                    `);

                // b. Những bé còn lại "Chờ" (0) -> Chuyển thành "Vắng" (3)
                await transaction.request()
                    .input('id', sql.Int, id)
                    .query(`
                        UPDATE DIEMDANH 
                        SET trangThai = 3 
                        WHERE idLichTrinh = @id AND trangThai = 0
                    `);
            }

            await transaction.commit();
            return { message: 'OK' };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
    
    // Hàm điểm danh lẻ
    static async updateAttendance(scheduleId, studentId, status) {
        const pool = await poolPromise;
        let timeUpdate = '';
        if (Number(status) === 1) timeUpdate = ', thoiGianDon = GETDATE() ';
        if (Number(status) === 2) timeUpdate = ', thoiGianTra = GETDATE() ';

        await pool.request()
            .input('scheduleId', sql.Int, scheduleId)
            .input('studentId', sql.Int, studentId)
            .input('status', sql.Int, Number(status))
            .query(`
                UPDATE DIEMDANH 
                SET trangThai = @status ${timeUpdate} 
                WHERE idLichTrinh = @scheduleId AND idHocSinh = @studentId
            `);
        return { message: 'OK' };
    }
}

export default Schedule;