import Route from '../models/route-model.js';

function normalizeTimeStr(t) {
    if (!t) return null;
    const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t.trim());
    if (!m) return null;
    const hh = String(parseInt(m[1], 10)).padStart(2, '0');
    const mm = String(parseInt(m[2], 10)).padStart(2, '0');
    const ss = String(m[3] ? parseInt(m[3], 10) : 0).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

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

export const createRoute = async (req, res) => {
    const { tenTuyen, gioBatDau, gioKetThuc } = req.body || {};
    if (!tenTuyen || !gioBatDau || !gioKetThuc) return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });

    const gioBatDauStr = normalizeTimeStr(gioBatDau);
    const gioKetThucStr = normalizeTimeStr(gioKetThuc);
    if (!gioBatDauStr || !gioKetThucStr) return res.status(400).json({ success: false, message: 'Giờ không hợp lệ' });

    try {
        const newRoute = await Route.create({ ...req.body, gioBatDauStr, gioKetThucStr });
        res.status(201).json({ success: true, message: 'Thêm tuyến thành công!', data: newRoute });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const updateRoute = async (req, res) => {
    const id = parseInt(req.params.id);
    const { gioBatDau, gioKetThuc } = req.body || {};
    let gioBatDauStr = null, gioKetThucStr = null;

    if (gioBatDau) {
        gioBatDauStr = normalizeTimeStr(gioBatDau);
        if (!gioBatDauStr) return res.status(400).json({ success: false, message: 'Giờ bắt đầu không hợp lệ' });
    }
    if (gioKetThuc) {
        gioKetThucStr = normalizeTimeStr(gioKetThuc);
        if (!gioKetThucStr) return res.status(400).json({ success: false, message: 'Giờ kết thúc không hợp lệ' });
    }

    try {
        const updatedRoute = await Route.update(id, { ...req.body, gioBatDauStr, gioKetThucStr });
        res.json({ success: true, message: 'Cập nhật thành công!', data: updatedRoute });
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