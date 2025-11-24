import Route from '../models/route-model.js';
import { sql, poolPromise } from '../config/database.js';

// --- HÀM HELPER CŨ KHÔNG CÒN CẦN THIẾT NỮA ---
// (Bạn có thể xóa normalizeTimeStr đi hoặc để đó nếu nơi khác dùng)

export const getAllRoutes = async (req, res) => {
    try {
        const data = await Route.getAll();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const getRouteById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const route = await Route.getById(id);
        if (!route) return res.status(404).json({ success: false, message: 'Không tìm thấy tuyến xe' });
        res.json({ success: true, data: route });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// --- SỬA LOGIC TẠO TUYẾN MỚI ---
export const createRoute = async (req, res) => {
    // 1. Nhận đúng các trường từ Frontend gửi lên (tenTuyen, moTa, khoangCach, thoiGianDuKien)
    const { tenTuyen, moTa, khoangCach, thoiGianDuKien } = req.body || {};

    // 2. Chỉ kiểm tra tenTuyen là bắt buộc (các trường khác có thể null hoặc default)
    if (!tenTuyen) {
        return res.status(400).json({ success: false, message: 'Tên tuyến là bắt buộc' });
    }

    try {
        // 3. Gọi Model create (Không cần xử lý giờ giấc nữa)
        const newRoute = await Route.create({ 
            tenTuyen, 
            moTa, 
            khoangCach, 
            thoiGianDuKien 
        });
        
        res.status(201).json({ success: true, message: 'Thêm tuyến thành công!', data: newRoute });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// --- SỬA LOGIC CẬP NHẬT TUYẾN ---
export const updateRoute = async (req, res) => {
    const id = parseInt(req.params.id);
    // Nhận dữ liệu mới
    const { tenTuyen, moTa, khoangCach, thoiGianDuKien } = req.body || {};

    try {
        // Model chưa có hàm update, bạn cần thêm vào file route-model.js nếu muốn chức năng Sửa hoạt động.
        // Tạm thời nếu Model chưa có update, ta sẽ báo lỗi hoặc giả lập
        if (Route.update) {
             const updatedRoute = await Route.update(id, { tenTuyen, moTa, khoangCach, thoiGianDuKien });
             res.json({ success: true, message: 'Cập nhật thành công!', data: updatedRoute });
        } else {
             // Fallback nếu chưa viết hàm update trong Model
             res.status(501).json({ success: false, message: 'Chức năng cập nhật chưa được cài đặt trong Model' });
        }
    } catch (err) {
        if (err.message === 'Không tìm thấy tuyến xe') return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const deleteRoute = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deletedRoute = await Route.remove(id);
        res.json({ success: true, message: 'Xóa thành công!', data: deletedRoute });
    } catch (err) {
        if (err.message.includes('đang được sử dụng')) return res.status(400).json({ success: false, message: err.message });
        if (err.message === 'Tuyến xe không tồn tại') return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const getStopsByRoute = async (req, res) => {
    try {
        const { id } = req.params; // idTuyen
        const pool = await poolPromise;
        const result = await pool.request()
            .input('idTuyen', sql.Int, id)
            .query(`
                SELECT d.idDiemDung, d.tenDiemDung, d.kinhDo, d.viDo, tdd.thuTu
                FROM TUYENDUONG_DIEMDUNG tdd
                JOIN DIEMDUNG d ON tdd.idDiemDung = d.idDiemDung
                WHERE tdd.idTuyenDuong = @idTuyen
                ORDER BY tdd.thuTu ASC
            `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};