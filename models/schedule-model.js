import { sql, poolPromise } from '../config/database.js';

class Schedule {
    // POST: Tạo lịch trình mới
    static async create(scheduleData) {
        // Bỏ idQuanLy vì DB không có cột này
        const { idTaiXe, idXe, idTuyen } = scheduleData;

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Tạo lịch trình (Mặc định ngày hôm nay, status 0: Chưa chạy)
            const scheduleResult = await transaction.request()
                .input('idTaiXe', sql.Int, idTaiXe)
                .input('idXe', sql.Int, idXe)
                .input('idTuyen', sql.Int, idTuyen)
                .query(`
                    INSERT INTO LICHTRINH (idTaiXe, idXe, ngayChay, idTuyen, trangThai, thuTuTramHienTai)
                    OUTPUT INSERTED.idLichTrinh
                    VALUES (@idTaiXe, @idXe, CAST(GETDATE() AS DATE), @idTuyen, 0, 0)
                `);

            const newScheduleId = scheduleResult.recordset[0].idLichTrinh;

            // 2. Lấy học sinh của tuyến
            const students = await transaction.request()
                .input('idTuyen', sql.Int, idTuyen)
                .query(`SELECT idHocSinh FROM HOCSINH WHERE idTuyen = @idTuyen AND trangThai = 1`);

            // 3. Tạo điểm danh (trangThai 0: Vắng/Chưa đón)
            if (students.recordset.length > 0) {
                for (const student of students.recordset) {
                     await transaction.request()
                        .input('idLichTrinh', sql.Int, newScheduleId)
                        .input('idHocSinh', sql.Int, student.idHocSinh)
                        .query(`INSERT INTO DIEMDANH (idLichTrinh, idHocSinh, trangThai) VALUES (@idLichTrinh, @idHocSinh, 0)`);
                }
            }

            await transaction.commit();
            return { idLichTrinh: newScheduleId, soHocSinh: students.recordset.length };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    // GET: Lấy tất cả
    static async getAll() {
        const pool = await poolPromise;
        // Sửa l.gioBatDau -> l.thoiGianBatDau
        const result = await pool.request().query(`
            SELECT 
                l.idLichTrinh, l.ngayChay as ngayThucHien, l.trangThai, l.thoiGianBatDau as gioBatDau,
                t.tenTuyen,
                tx.hoTen as tenTaiXe,
                x.bienSo
            FROM LICHTRINH l
            LEFT JOIN TUYENDUONG t ON l.idTuyen = t.idTuyenDuong
            LEFT JOIN TAIXE tx ON l.idTaiXe = tx.idTaiXe
            LEFT JOIN XEBUS x ON l.idXe = x.idXe
            ORDER BY l.idLichTrinh DESC
        `);
        return result.recordset;
    }

    // GET: Chi tiết
    static async getById(id) {
        const pool = await poolPromise;
        // Sửa l.gioBatDau -> l.thoiGianBatDau
        const scheduleResult = await pool.request().input('id', sql.Int, id).query(`
            SELECT 
                l.idLichTrinh, l.ngayChay, l.trangThai, l.thoiGianBatDau,
                l.thuTuTramHienTai,
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

        // Lấy danh sách điểm danh
        const attendanceResult = await pool.request().input('id', sql.Int, id).query(`
            SELECT 
                d.idHocSinh, d.trangThai,
                h.hoTen, h.lop,
                dd.tenDiemDung as diemDon
            FROM DIEMDANH d
            JOIN HOCSINH h ON d.idHocSinh = h.idHocSinh
            LEFT JOIN DIEMDUNG dd ON h.idDiemDon = dd.idDiemDung
            WHERE d.idLichTrinh = @id
        `);

        schedule.danhSachDiemDanh = attendanceResult.recordset;
        return schedule;
    }

    // Update Status (0 -> 1 -> 2)
    static async updateStatus(id, status) {
        const pool = await poolPromise;
        // Nếu status = 1 (Bắt đầu) -> Update thoiGianBatDau
        // Nếu status = 2 (Kết thúc) -> Update thoiGianKetThuc
        // status truyền vào là INT (0, 1, 2) cho khớp với DB
        let query = 'UPDATE LICHTRINH SET trangThai = @status ';
        if (Number(status) === 1) query += ', thoiGianBatDau = GETDATE() ';
        if (Number(status) === 2) query += ', thoiGianKetThuc = GETDATE() ';
        
        query += ' WHERE idLichTrinh = @id';

        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.Int, Number(status))
            .query(query);
            
        return { message: 'Updated' };
    }
    
    // Update Attendance
    static async updateAttendance(scheduleId, studentId, status) {
        const pool = await poolPromise;
        await pool.request()
            .input('scheduleId', sql.Int, scheduleId)
            .input('studentId', sql.Int, studentId)
            .input('status', sql.Int, Number(status)) // Status là INT (0,1,2)
            .query(`
                UPDATE DIEMDANH SET trangThai = @status
                WHERE idLichTrinh = @scheduleId AND idHocSinh = @studentId
            `);
        return { message: 'Updated' };
    }
}

export default Schedule;