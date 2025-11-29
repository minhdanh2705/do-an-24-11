import Incident from '../models/incident-model.js';
import { sql, poolPromise } from '../config/database.js';

export const createIncident = async (req, res) => {
    try {
        await Incident.create(req.body);
        res.status(201).json({ success: true, message: 'Đã gửi báo cáo sự cố' });
    } catch (err) {
        console.error("Lỗi tạo sự cố:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getAllIncidents = async (req, res) => {
    try {
        const data = await Incident.getAll();
        res.json({ success: true, data });
    } catch (err) {
        console.error("Lỗi lấy danh sách:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- HÀM XỬ LÝ SỰ CỐ & GỬI THÔNG BÁO ---
export const updateIncidentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { trangThai } = req.body;
        const pool = await poolPromise;
        const io = req.app.get('io'); // Lấy socket instance

        console.log(`[Incident] Cập nhật sự cố ID: ${id} -> Trạng thái: ${trangThai}`);

        // 1. Cập nhật trạng thái trong DB
        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.Int, trangThai)
            .query('UPDATE SUCO SET trangThai = @status WHERE idSuCo = @id');

        // 2. GỬI THÔNG BÁO (Chỉ khi Đã xử lý = 1)
        if (Number(trangThai) === 1) {
            
            // Lấy thông tin sự cố để biết nó thuộc chuyến xe nào
            const incidentRes = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT idLichTrinh, tieuDe, moTa FROM SUCO WHERE idSuCo = @id');
            
            const incident = incidentRes.recordset[0];

            if (incident && incident.idLichTrinh) {
                console.log(`[Incident] Sự cố thuộc Lịch trình ID: ${incident.idLichTrinh}`);

                // Tìm tất cả phụ huynh có con đi chuyến này
                const parentsRes = await pool.request()
                    .input('lid', sql.Int, incident.idLichTrinh)
                    .query(`
                        SELECT DISTINCT h.idPhuHuynh 
                        FROM DIEMDANH d 
                        JOIN HOCSINH h ON d.idHocSinh = h.idHocSinh 
                        WHERE d.idLichTrinh = @lid AND h.idPhuHuynh IS NOT NULL
                    `);

                const parents = parentsRes.recordset;
                console.log(`[Incident] Tìm thấy ${parents.length} phụ huynh cần báo tin.`);

                const title = "Sự cố đã được khắc phục";
                const message = `Sự cố: "${incident.tieuDe}" đã được xử lý xong. Chuyến xe hoạt động bình thường.`;

                // Gửi cho từng phụ huynh
                for (const p of parents) {
                    // A. Lưu vào Database (Bảng THONGBAO)
                    await pool.request()
                        .input('pid', sql.Int, p.idPhuHuynh)
                        .input('title', sql.NVarChar, title)
                        .input('msg', sql.NVarChar, message)
                        .query(`
                            INSERT INTO THONGBAO (idPhuHuynh, tieuDe, noiDung, loai, daXem, thoiGian) 
                            VALUES (@pid, @title, @msg, 'SUCCESS', 0, GETDATE())
                        `);
                    
                    // B. Bắn Socket Realtime
                    if (io) {
                        const eventName = `notification:parent:${p.idPhuHuynh}`;
                        console.log(`[Socket] Emitting to: ${eventName}`);
                        io.emit(eventName, { 
                            title: title, 
                            message: message, 
                            type: 'SUCCESS' 
                        });
                    } else {
                        console.error("[Socket] LỖI: Không tìm thấy biến IO (Socket chưa khởi tạo?)");
                    }
                }
            } else {
                console.log("[Incident] Sự cố này không gắn với lịch trình cụ thể (Hoặc idLichTrinh = NULL), không gửi thông báo.");
            }
        }

        res.json({ success: true, message: 'Đã cập nhật trạng thái và gửi thông báo.' });

    } catch (err) {
        console.error("[Incident] Lỗi cập nhật:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};