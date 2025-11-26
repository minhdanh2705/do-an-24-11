import { sql, poolPromise } from '../config/database.js';

class Schedule {
    // POST: Tạo lịch trình mới (Đã thêm kiểm tra trạng thái Tài xế/Xe + Trùng lịch)
    static async create(scheduleData) {
        const { idTaiXe, idXe, idTuyen, thoiGianBatDau, thoiGianKetThuc, ngayChay } = scheduleData;
        const pool = await poolPromise;

        // --- BƯỚC 1: KIỂM TRA TRẠNG THÁI HOẠT ĐỘNG CỦA TÀI XẾ VÀ XE ---
        const statusCheck = await pool.request()
            .input('idTaiXe', sql.Int, idTaiXe)
            .input('idXe', sql.Int, idXe)
            .query(`
                SELECT 
                    (SELECT trangThai FROM TAIXE WHERE idTaiXe = @idTaiXe) as trangThaiTaiXe,
                    (SELECT trangThai FROM XEBUS WHERE idXe = @idXe) as trangThaiXe
            `);
        
        const { trangThaiTaiXe, trangThaiXe } = statusCheck.recordset[0] || {};

        if (trangThaiTaiXe === 0) {
            throw new Error("Không thể tạo: Tài xế này đang bị ngưng hoạt động!");
        }
        if (trangThaiXe === 0) {
            throw new Error("Không thể tạo: Xe bus này đang bị ngưng hoạt động!");
        }

        // --- BƯỚC 2: KIỂM TRA TRÙNG LỊCH (Logic cũ) ---
        const checkConflict = await pool.request()
            .input('idTaiXe', sql.Int, idTaiXe)
            .input('idXe', sql.Int, idXe)
            .input('ngayChay', sql.Date, ngayChay || new Date())
            .input('newStart', sql.VarChar(5), thoiGianBatDau)
            .input('newEnd', sql.VarChar(5), thoiGianKetThuc)
            .query(`
                SELECT COUNT(*) as count 
                FROM LICHTRINH 
                WHERE ngayChay = @ngayChay 
                AND (idTaiXe = @idTaiXe OR idXe = @idXe) 
                AND trangThai != 1 -- Bỏ qua các chuyến đã hoàn thành
                AND (
                    (@newStart < thoiGianKetThuc) AND (@newEnd > thoiGianBatDau)
                )
            `);

        if (checkConflict.recordset[0].count > 0) {
            throw new Error("XUNG ĐỘT LỊCH TRÌNH: Tài xế hoặc Xe đã có lịch chạy trong khung giờ này!");
        }

        // --- BƯỚC 3: TẠO LỊCH TRÌNH ---
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 3.1 Insert Lịch trình
            const request = transaction.request()
                .input('idTaiXe', sql.Int, idTaiXe)
                .input('idXe', sql.Int, idXe)
                .input('idTuyen', sql.Int, idTuyen)
                .input('thoiGianBatDau', sql.VarChar(5), thoiGianBatDau)
                .input('thoiGianKetThuc', sql.VarChar(5), thoiGianKetThuc)
                .input('ngayChay', sql.Date, ngayChay || new Date()); 

            const scheduleResult = await request.query(`
                INSERT INTO LICHTRINH (
                    idTaiXe, idXe, idTuyen, 
                    ngayChay, thoiGianBatDau, thoiGianKetThuc, 
                    trangThai, thuTuTramHienTai, trangThaiDiChuyen, idDiemDungHienTai
                )
                OUTPUT INSERTED.idLichTrinh
                VALUES (
                    @idTaiXe, @idXe, @idTuyen, 
                    @ngayChay, @thoiGianBatDau, @thoiGianKetThuc, 
                    0, 1, 0, 
                    (SELECT TOP 1 idDiemDung FROM TUYENDUONG_DIEMDUNG WHERE idTuyenDuong = @idTuyen ORDER BY thuTu ASC)
                )
            `);

            const newScheduleId = scheduleResult.recordset[0].idLichTrinh;
            
            // 3.2 Tạo điểm danh tự động
            await transaction.request()
                .input('idLichTrinh', sql.Int, newScheduleId)
                .input('idTuyen', sql.Int, idTuyen)
                .query(`
                    INSERT INTO DIEMDANH (idLichTrinh, idHocSinh, trangThai)
                    SELECT @idLichTrinh, idHocSinh, 0 
                    FROM HOCSINH 
                    WHERE idTuyen = @idTuyen AND trangThai = 1
                `);

            await transaction.commit();
            return { idLichTrinh: newScheduleId, message: "Tạo lịch trình thành công" };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    // PUT: Cập nhật thông tin lịch trình
    static async update(id, scheduleData) {
        const { idTaiXe, idXe, idTuyen, thoiGianBatDau, thoiGianKetThuc, ngayChay } = scheduleData;
        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('idTaiXe', sql.Int, idTaiXe)
            .input('idXe', sql.Int, idXe)
            .input('idTuyen', sql.Int, idTuyen)
            .input('ngayChay', sql.Date, ngayChay)
            .input('thoiGianBatDau', sql.VarChar(5), thoiGianBatDau)
            .input('thoiGianKetThuc', sql.VarChar(5), thoiGianKetThuc)
            .query(`
                UPDATE LICHTRINH
                SET 
                    idTaiXe = @idTaiXe,
                    idXe = @idXe,
                    idTuyen = @idTuyen,
                    ngayChay = @ngayChay,
                    thoiGianBatDau = @thoiGianBatDau,
                    thoiGianKetThuc = @thoiGianKetThuc
                WHERE idLichTrinh = @id
            `);

        return { message: "Cập nhật thành công" };
    }

    // DELETE: Xóa lịch trình
    static async delete(id) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await transaction.request().input('id', sql.Int, id).query(`DELETE FROM DIEMDANH WHERE idLichTrinh = @id`);
            await transaction.request().input('id', sql.Int, id).query(`DELETE FROM LICHTRINH WHERE idLichTrinh = @id`);
            await transaction.commit();
            return { message: "Xóa thành công" };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    // GET: Lấy tất cả
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                l.idLichTrinh, l.ngayChay, l.trangThai, l.trangThaiDiChuyen,
                CONVERT(varchar(5), l.thoiGianBatDau, 108) as thoiGianBatDau,
                CONVERT(varchar(5), l.thoiGianKetThuc, 108) as thoiGianKetThuc,
                t.tenTuyen, t.idTuyenDuong as idTuyen,
                tx.hoTen as tenTaiXe, tx.idTaiXe,
                x.bienSo as bienSoXe, x.idXe
            FROM LICHTRINH l
            LEFT JOIN TUYENDUONG t ON l.idTuyen = t.idTuyenDuong
            LEFT JOIN TAIXE tx ON l.idTaiXe = tx.idTaiXe
            LEFT JOIN XEBUS x ON l.idXe = x.idXe
            ORDER BY l.ngayChay DESC, l.idLichTrinh DESC
        `);
        return result.recordset;
    }

    // GET: Chi tiết
    static async getById(id) {
        const pool = await poolPromise;
        const scheduleResult = await pool.request().input('id', sql.Int, id).query(`
            SELECT 
                l.idLichTrinh, l.ngayChay, l.trangThai, l.trangThaiDiChuyen,
                CONVERT(varchar(5), l.thoiGianBatDau, 108) as thoiGianBatDau,
                CONVERT(varchar(5), l.thoiGianKetThuc, 108) as thoiGianKetThuc,
                l.thuTuTramHienTai, l.idDiemDungHienTai,
                t.idTuyenDuong, t.tenTuyen,
                tx.idTaiXe, tx.hoTen as tenTaiXe,
                x.idXe, x.bienSo
            FROM LICHTRINH l
            LEFT JOIN TUYENDUONG t ON l.idTuyen = t.idTuyenDuong
            LEFT JOIN TAIXE tx ON l.idTaiXe = tx.idTaiXe
            LEFT JOIN XEBUS x ON l.idXe = x.idXe
            WHERE l.idLichTrinh = @id
        `);

        if (!scheduleResult.recordset[0]) return null;
        const schedule = scheduleResult.recordset[0];

        const attendanceResult = await pool.request().input('id', sql.Int, id).query(`
            SELECT 
                d.idHocSinh, d.trangThai, d.thoiGianDon, d.thoiGianTra,
                h.hoTen, h.lop, h.idPhuHuynh,
                dd.idDiemDung, dd.tenDiemDung, dd.kinhDo, dd.viDo
            FROM DIEMDANH d
            JOIN HOCSINH h ON d.idHocSinh = h.idHocSinh
            LEFT JOIN DIEMDUNG dd ON h.idDiemDon = dd.idDiemDung
            WHERE d.idLichTrinh = @id
        `);

        schedule.danhSachDiemDanh = attendanceResult.recordset;
        return schedule;
    }

    // Update Status
    static async updateStatus(id, status) {
        const pool = await poolPromise;
        let query = 'UPDATE LICHTRINH SET trangThaiDiChuyen = @status ';
        if (Number(status) === 2) { query += ', trangThai = 1 '; }
        query += ' WHERE idLichTrinh = @id';
        await pool.request().input('id', sql.Int, id).input('status', sql.Int, Number(status)).query(query);
        return { message: 'Updated status' };
    }
    
    // Update Attendance
    static async updateAttendance(scheduleId, studentId, status) {
        const pool = await poolPromise;
        let timeUpdate = '';
        if (Number(status) === 1) timeUpdate = ', thoiGianDon = GETDATE() ';
        if (Number(status) === 2) timeUpdate = ', thoiGianTra = GETDATE() ';

        await pool.request()
            .input('scheduleId', sql.Int, scheduleId)
            .input('studentId', sql.Int, studentId)
            .input('status', sql.Int, Number(status))
            .query(`UPDATE DIEMDANH SET trangThai = @status ${timeUpdate} WHERE idLichTrinh = @scheduleId AND idHocSinh = @studentId`);
        return { message: 'Updated attendance' };
    }
}

export default Schedule;