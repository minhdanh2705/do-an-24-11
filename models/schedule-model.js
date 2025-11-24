import { sql, poolPromise } from '../config/database.js';

class Schedule {
    // POST: Tạo lịch trình mới
    static async create(scheduleData) {
        const { idTaiXe, idXe, idTuyen, thoiGianBatDau, thoiGianKetThuc, ngayChay } = scheduleData;

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Tạo lịch trình (Giữ nguyên)
            const request = transaction.request()
                .input('idTaiXe', sql.Int, idTaiXe)
                .input('idXe', sql.Int, idXe)
                .input('idTuyen', sql.Int, idTuyen)
                .input('thoiGianBatDau', sql.VarChar, thoiGianBatDau)
                .input('thoiGianKetThuc', sql.VarChar, thoiGianKetThuc)
                .input('ngayChay', sql.Date, ngayChay || null); 

            // Cần thêm logic lấy ID điểm dừng đầu tiên vào đây nếu chưa có trong code của bạn
            // ... (Phần INSERT LICHTRINH giữ nguyên) ...
            
            const scheduleResult = await request.query(`
                INSERT INTO LICHTRINH (
                    idTaiXe, idXe, idTuyen, 
                    ngayChay, thoiGianBatDau, thoiGianKetThuc, 
                    trangThai, thuTuTramHienTai, trangThaiDiChuyen, idDiemDungHienTai
                )
                OUTPUT INSERTED.idLichTrinh
                VALUES (
                    @idTaiXe, @idXe, @idTuyen, 
                    COALESCE(@ngayChay, CAST(GETDATE() AS DATE)), @thoiGianBatDau, @thoiGianKetThuc, 
                    0, 1, 0, 
                    (SELECT TOP 1 idDiemDung FROM TUYENDUONG_DIEMDUNG WHERE idTuyenDuong = @idTuyen ORDER BY thuTu ASC)
                )
            `);

            const newScheduleId = scheduleResult.recordset[0].idLichTrinh;
            
            // --- 2. TỐI ƯU HÓA: TẠO ĐIỂM DANH HÀNG LOẠT (Thay thế 2 bước SELECT và FOR LOOP) ---
            await transaction.request()
                .input('idLichTrinh', sql.Int, newScheduleId)
                .input('idTuyen', sql.Int, idTuyen)
                .query(`
                    INSERT INTO DIEMDANH (idLichTrinh, idHocSinh, trangThai)
                    -- Lấy tất cả học sinh thuộc tuyến và tạo dòng điểm danh
                    SELECT @idLichTrinh, idHocSinh, 0 
                    FROM HOCSINH 
                    WHERE idTuyen = @idTuyen AND trangThai = 1
                `);
            // ---------------------------------------------------------------------------------

            await transaction.commit();
            return { idLichTrinh: newScheduleId, message: "Tạo lịch trình thành công" };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async update(id, scheduleData) {
        const { idTaiXe, idXe, idTuyen, thoiGianBatDau, thoiGianKetThuc, ngayChay } = scheduleData;
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .input('idTaiXe', sql.Int, idTaiXe)
            .input('idXe', sql.Int, idXe)
            .input('idTuyen', sql.Int, idTuyen)
            .input('ngayChay', sql.Date, ngayChay)
            .input('thoiGianBatDau', sql.VarChar, thoiGianBatDau)
            .input('thoiGianKetThuc', sql.VarChar, thoiGianKetThuc)
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
            // Xóa khóa ngoại ở bảng DIEMDANH trước
            await transaction.request()
                .input('id', sql.Int, id)
                .query(`DELETE FROM DIEMDANH WHERE idLichTrinh = @id`);

            // Xóa Lịch trình
            await transaction.request()
                .input('id', sql.Int, id)
                .query(`DELETE FROM LICHTRINH WHERE idLichTrinh = @id`);

            await transaction.commit();
            return { message: "Xóa thành công" };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    // GET: Lấy tất cả (Cho Admin Dashboard)
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
    SELECT 
        l.idLichTrinh, 
        l.ngayChay, 
        l.trangThai, 
        l.trangThaiDiChuyen,
        
        -- SỬA Ở ĐÂY: Dùng CONVERT để lấy chuỗi HH:mm chuẩn
        CONVERT(varchar(5), l.thoiGianBatDau, 108) as thoiGianBatDau,
        CONVERT(varchar(5), l.thoiGianKetThuc, 108) as thoiGianKetThuc,

        t.tenTuyen,
        t.idTuyenDuong as idTuyen,
        tx.hoTen as tenTaiXe,
        tx.idTaiXe,
        x.bienSo as bienSoXe,
        x.idXe
    FROM LICHTRINH l
            LEFT JOIN TUYENDUONG t ON l.idTuyen = t.idTuyenDuong
            LEFT JOIN TAIXE tx ON l.idTaiXe = tx.idTaiXe
            LEFT JOIN XEBUS x ON l.idXe = x.idXe
            ORDER BY l.ngayChay DESC, l.idLichTrinh DESC
        `);
        return result.recordset;
    }

    // GET: Chi tiết (Cho App Tài xế / Phụ huynh)
    static async getById(id) {
        const pool = await poolPromise;
        const scheduleResult = await pool.request().input('id', sql.Int, id).query(`
            SELECT 
        l.idLichTrinh, l.ngayChay, l.trangThai, l.trangThaiDiChuyen,
        
        -- SỬA Ở ĐÂY LUÔN
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

        // Lấy danh sách điểm danh
        const attendanceResult = await pool.request().input('id', sql.Int, id).query(`
            SELECT 
                d.idHocSinh, d.trangThai, d.thoiGianDon, d.thoiGianTra,
                h.hoTen, h.lop, h.idPhuHuynh,
                dd.idDiemDung, dd.tenDiemDung, dd.kinhDo, dd.viDo
            FROM DIEMDANH d
            JOIN HOCSINH h ON d.idHocSinh = h.idHocSinh
            -- Join lấy thông tin điểm đón (Logic cũ: theo idDiemDon của HS)
            LEFT JOIN DIEMDUNG dd ON h.idDiemDon = dd.idDiemDung
            WHERE d.idLichTrinh = @id
        `);

        schedule.danhSachDiemDanh = attendanceResult.recordset;
        return schedule;
    }

    // Update Status (Dành cho Tài xế bấm nút Bắt đầu / Kết thúc)
    static async updateStatus(id, status) {
        const pool = await poolPromise;
        
        // Cập nhật trạng thái di chuyển
        // Lưu ý: Không nên overwrite thoiGianBatDau (Giờ dự kiến) bằng Giờ hiện tại ở đây
        // Trừ khi bạn muốn lưu "Giờ thực tế bắt đầu" vào cột khác.
        // Ở đây ta chỉ update trạng thái di chuyển.
        
        let query = 'UPDATE LICHTRINH SET trangThaiDiChuyen = @status ';
        
        // Nếu muốn đánh dấu hoàn thành chuyến đi
        if (Number(status) === 2) {
             query += ', trangThai = 1 '; // 1: Đã hoàn thành
        }

        query += ' WHERE idLichTrinh = @id';

        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.Int, Number(status))
            .query(query);
            
        return { message: 'Updated status' };
    }
    
    // Update Attendance (Điểm danh từng học sinh)
    static async updateAttendance(scheduleId, studentId, status) {
        const pool = await poolPromise;
        
        // Nếu status = 1 (Đã đón) -> Lưu thời gian đón
        // Nếu status = 2 (Đã trả) -> Lưu thời gian trả
        
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
        return { message: 'Updated attendance' };
    }
}

export default Schedule;