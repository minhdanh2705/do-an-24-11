import { sql, poolPromise } from '../config/database.js';

export const markAttendance = async (req, res) => {
    try {
        const { idLichTrinh, idHocSinh, trangThai, lat, lng } = req.body;

        if (!idLichTrinh || !idHocSinh || !trangThai) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        const pool = await poolPromise;
        
        // 1. Cập nhật bảng DIEMDANH
        let updateField = '';
        if (trangThai === 'DA_DON') updateField = ', thoiGianDon = GETDATE()';
        if (trangThai === 'DA_TRA') updateField = ', thoiGianTra = GETDATE()';

        await pool.request()
            .input('idLichTrinh', sql.Int, idLichTrinh)
            .input('idHocSinh', sql.Int, idHocSinh)
            .input('trangThai', sql.NVarChar, trangThai)
            .query(`
                UPDATE DIEMDANH 
                SET trangThai = @trangThai ${updateField}
                WHERE idLichTrinh = @idLichTrinh AND idHocSinh = @idHocSinh
            `);

        // 2. Lấy thông tin để gửi thông báo
        const infoResult = await pool.request()
            .input('idHocSinh', sql.Int, idHocSinh)
            .query(`
                SELECT hs.hoTen as tenHocSinh, ph.idPhuHuynh, ph.hoTen as tenPhuHuynh
                FROM HOCSINH hs
                JOIN PHUHUYNH_HOCSINH phs ON hs.idHocSinh = phs.idHocSinh
                JOIN PHUHUYNH ph ON phs.idPhuHuynh = ph.idPhuHuynh
                WHERE hs.idHocSinh = @idHocSinh
            `);

        // 3. Gửi Socket IO
        const io = req.app.get('io');
        
        for (const record of infoResult.recordset) {
            let title = 'Thông báo điểm danh';
            let message = `Trạng thái điểm danh của em ${record.tenHocSinh} đã được cập nhật: ${trangThai}`;

            if (trangThai === 'DA_DON') {
                title = 'Học sinh đã lên xe';
                message = `Em ${record.tenHocSinh} đã được đón lên xe an toàn.`;
            } else if (trangThai === 'DA_TRA') {
                title = 'Học sinh đã về nhà';
                message = `Em ${record.tenHocSinh} đã được trả tại điểm trả.`;
            } else if (trangThai === 'VANG') {
                title = 'Thông báo vắng mặt';
                message = `Em ${record.tenHocSinh} được đánh dấu vắng mặt.`;
            }

            // Lưu vào DB (Bảng THONGBAO - nhớ tạo bảng này trong SQL trước nếu chưa có)
            try {
                await pool.request()
                    .input('idPhuHuynh', sql.Int, record.idPhuHuynh)
                    .input('tieuDe', sql.NVarChar, title)
                    .input('noiDung', sql.NVarChar, message)
                    .input('loai', sql.NVarChar, 'DIEM_DANH')
                    .query(`
                        INSERT INTO THONGBAO (idPhuHuynh, tieuDe, noiDung, loai, daXem, thoiGian)
                        VALUES (@idPhuHuynh, @tieuDe, @noiDung, @loai, 0, GETDATE())
                    `);
            } catch (e) {
                console.log('Chưa có bảng THONGBAO hoặc lỗi lưu thông báo:', e.message);
            }

            // Bắn socket
            if (io) {
                console.log(`[Socket] Gửi tới phụ huynh ${record.idPhuHuynh}`);
                io.emit(`notification:parent:${record.idPhuHuynh}`, {
                    title,
                    message,
                    type: 'DIEM_DANH',
                    studentId: idHocSinh,
                    timestamp: new Date()
                });
            }
        }

        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('[Attendance] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};