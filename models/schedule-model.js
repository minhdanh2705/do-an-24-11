import { sql, poolPromise } from '../config/database.js';

class Schedule {
    // POST: Tạo lịch trình mới
    static async create(scheduleData) {
        const { idTaiXe, idXe, idTuyen, thoiGianBatDau, thoiGianKetThuc, ngayChay } = scheduleData;
        const pool = await poolPromise;

        // 1. Kiểm tra Tài xế/Xe có bị khóa không
        const statusCheck = await pool.request()
            .input('idTaiXe', sql.Int, idTaiXe).input('idXe', sql.Int, idXe)
            .query(`SELECT (SELECT trangThai FROM TAIXE WHERE idTaiXe=@idTaiXe) as tx, (SELECT trangThai FROM XEBUS WHERE idXe=@idXe) as xe`);
        if (statusCheck.recordset[0]?.tx === 0) throw new Error("Tài xế đang bị khóa!");
        if (statusCheck.recordset[0]?.xe === 0) throw new Error("Xe đang bị khóa!");

        // 2. Kiểm tra Xung đột giờ giấc
        const checkConflict = await pool.request()
            .input('idTaiXe', sql.Int, idTaiXe).input('idXe', sql.Int, idXe)
            .input('ngayChay', sql.Date, ngayChay || new Date())
            .input('newStart', sql.VarChar(5), thoiGianBatDau).input('newEnd', sql.VarChar(5), thoiGianKetThuc)
            .query(`
                SELECT COUNT(*) as count FROM LICHTRINH 
                WHERE ngayChay = @ngayChay 
                AND (idTaiXe = @idTaiXe OR idXe = @idXe) 
                AND trangThai = 0 
                AND (trangThaiDiChuyen IS NULL OR trangThaiDiChuyen != 2) 
                AND ((@newStart < thoiGianKetThuc) AND (@newEnd > thoiGianBatDau))
            `);

        if (checkConflict.recordset[0].count > 0) throw new Error("XUNG ĐỘT: Tài xế hoặc Xe đang có lịch chạy trùng giờ chưa kết thúc!");

        // 3. Tạo mới
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const req = transaction.request()
                .input('idTaiXe', sql.Int, idTaiXe).input('idXe', sql.Int, idXe).input('idTuyen', sql.Int, idTuyen)
                .input('tg1', sql.VarChar(5), thoiGianBatDau).input('tg2', sql.VarChar(5), thoiGianKetThuc).input('nc', sql.Date, ngayChay || new Date());
            
            const res = await req.query(`INSERT INTO LICHTRINH (idTaiXe, idXe, idTuyen, ngayChay, thoiGianBatDau, thoiGianKetThuc, trangThai, thuTuTramHienTai, trangThaiDiChuyen, idDiemDungHienTai) OUTPUT INSERTED.idLichTrinh VALUES (@idTaiXe, @idXe, @idTuyen, @nc, @tg1, @tg2, 0, 1, 0, (SELECT TOP 1 idDiemDung FROM TUYENDUONG_DIEMDUNG WHERE idTuyenDuong = @idTuyen ORDER BY thuTu ASC))`);
            
            const newId = res.recordset[0].idLichTrinh;
            // Copy học sinh từ Tuyến vào Điểm danh
            await transaction.request().input('lid', sql.Int, newId).input('tid', sql.Int, idTuyen)
                .query(`INSERT INTO DIEMDANH (idLichTrinh, idHocSinh, trangThai) SELECT @lid, idHocSinh, 0 FROM HOCSINH WHERE idTuyen = @tid AND trangThai = 1`);
            
            await transaction.commit();
            return { idLichTrinh: newId };
        } catch (e) { await transaction.rollback(); throw e; }
    }

    // --- HÀM UPDATE (CÓ RÀNG BUỘC) ---
    static async update(id, d) {
        const pool = await poolPromise;
        
        // 1. KIỂM TRA TRẠNG THÁI HIỆN TẠI
        const check = await pool.request().input('id', sql.Int, id)
            .query(`SELECT trangThaiDiChuyen FROM LICHTRINH WHERE idLichTrinh = @id`);
            
        if (!check.recordset[0]) throw new Error('Không tìm thấy lịch trình');
        
        const status = check.recordset[0].trangThaiDiChuyen;
        
        // CHẶN SỬA
        if (status === 1) throw new Error('CẢNH BÁO: Chuyến xe ĐANG CHẠY. Không được phép chỉnh sửa lúc này!');
        if (status === 2) throw new Error('CẢNH BÁO: Chuyến xe ĐÃ KẾT THÚC. Không thể thay đổi lịch sử!');

        // 2. NẾU OK THÌ UPDATE
        await pool.request()
            .input('id', sql.Int, id)
            .input('tx', sql.Int, d.idTaiXe).input('xe', sql.Int, d.idXe).input('t', sql.Int, d.idTuyen)
            .input('nc', sql.Date, d.ngayChay).input('t1', sql.VarChar(5), d.thoiGianBatDau).input('t2', sql.VarChar(5), d.thoiGianKetThuc)
            .query(`UPDATE LICHTRINH SET idTaiXe=@tx, idXe=@xe, idTuyen=@t, ngayChay=@nc, thoiGianBatDau=@t1, thoiGianKetThuc=@t2 WHERE idLichTrinh=@id`);
        
        return { message: "Cập nhật thành công" };
    }

    // --- HÀM DELETE (CÓ RÀNG BUỘC) ---
    static async delete(id) {
        const pool = await poolPromise;
        
        // 1. KIỂM TRA TRẠNG THÁI TRƯỚC
        const check = await pool.request().input('id', sql.Int, id)
            .query(`SELECT trangThaiDiChuyen FROM LICHTRINH WHERE idLichTrinh = @id`);

        if (!check.recordset[0]) throw new Error('Không tìm thấy lịch trình');

        const status = check.recordset[0].trangThaiDiChuyen;

        // CHẶN XÓA
        if (status === 1) throw new Error('CẢNH BÁO: Chuyến xe ĐANG CHẠY. Không thể xóa!');
        if (status === 2) throw new Error('CẢNH BÁO: Chuyến xe ĐÃ KẾT THÚC. Dữ liệu cần được lưu làm lịch sử, không thể xóa!');

        // 2. NẾU OK THÌ XÓA
        const tr = new sql.Transaction(pool); await tr.begin();
        try {
            await tr.request().input('id', sql.Int, id).query(`DELETE FROM SUCO WHERE idLichTrinh = @id`);
            await tr.request().input('id', sql.Int, id).query(`DELETE FROM DIEMDANH WHERE idLichTrinh = @id`);
            await tr.request().input('id', sql.Int, id).query(`DELETE FROM LICHTRINH WHERE idLichTrinh = @id`);
            await tr.commit(); 
            return { message: "Xóa thành công" };
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

    static async updateStatus(id, status) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            let query = 'UPDATE LICHTRINH SET trangThaiDiChuyen = @status ';
            if (Number(status) === 2) { query += ', trangThai = 1 '; }
            query += ' WHERE idLichTrinh = @id';

            await transaction.request().input('id', sql.Int, id).input('status', sql.Int, Number(status)).query(query);

            if (Number(status) === 2) { 
                await transaction.request().input('id', sql.Int, id).query(`UPDATE DIEMDANH SET trangThai = 2, thoiGianTra = GETDATE() WHERE idLichTrinh = @id AND trangThai = 1`);
                await transaction.request().input('id', sql.Int, id).query(`UPDATE DIEMDANH SET trangThai = 3 WHERE idLichTrinh = @id AND trangThai = 0`);
            }
            await transaction.commit();
            return { message: 'OK' };
        } catch (err) { await transaction.rollback(); throw err; }
    }
    
    static async updateAttendance(scheduleId, studentId, status) {
        const pool = await poolPromise;
        let timeUpdate = '';
        if (Number(status) === 1) timeUpdate = ', thoiGianDon = GETDATE() ';
        if (Number(status) === 2) timeUpdate = ', thoiGianTra = GETDATE() ';

        await pool.request().input('scheduleId', sql.Int, scheduleId).input('studentId', sql.Int, studentId).input('status', sql.Int, Number(status))
            .query(`UPDATE DIEMDANH SET trangThai = @status ${timeUpdate} WHERE idLichTrinh = @scheduleId AND idHocSinh = @studentId`);
        return { message: 'OK' };
    }
}
export default Schedule;