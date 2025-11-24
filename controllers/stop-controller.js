import Stop from '../models/stop-model.js';

export const getAllStops = async (req, res) => {
    try {
        const data = await Stop.getAll();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const getStopById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const stop = await Stop.getById(id);
        if (!stop) return res.status(404).json({ success: false, message: 'Không tìm thấy điểm dừng' });
        res.json({ success: true, data: stop });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const createStop = async (req, res) => {
    const { idDiemDung, tenDiemDung } = req.body;
    if (idDiemDung === undefined || !tenDiemDung) return res.status(400).json({ success: false, message: 'Thiếu ID hoặc Tên điểm dừng' });

    try {
        const newStop = await Stop.create(req.body);
        res.status(201).json({ success: true, data: newStop });
    } catch (err) {
        if (err.message.includes('PRIMARY KEY')) return res.status(400).json({ success: false, message: 'ID Điểm dừng đã tồn tại' });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const updateStop = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updatedStop = await Stop.update(id, req.body);
        res.json({ success: true, message: 'Cập nhật thành công', data: updatedStop });
    } catch (err) {
        if (err.message === 'Không tìm thấy điểm dừng') return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const deleteStop = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deletedStop = await Stop.remove(id);
        res.json({ success: true, message: 'Xóa thành công', data: deletedStop });
    } catch (err) {
        if (err.message.includes('đang được sử dụng')) return res.status(400).json({ success: false, message: err.message });
        if (err.message === 'Không tìm thấy điểm dừng') return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};