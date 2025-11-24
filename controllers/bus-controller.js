import Bus from '../models/bus-model.js';

export const getAllBuses = async (req, res) => {
    try {
        const data = await Bus.getAll();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const getBusById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const bus = await Bus.getById(id);
        if (!bus) return res.status(404).json({ success: false, message: 'Không tìm thấy xe bus' });
        res.json({ success: true, data: bus });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const createBus = async (req, res) => {
    const { bienSo, sucChua } = req.body || {};
    if (!bienSo || !sucChua) return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });

    try {
        const newBus = await Bus.create({ bienSo, sucChua });
        res.status(201).json({ success: true, message: 'Thêm xe bus thành công!', data: newBus });
    } catch (err) {
        if (err.message === 'Biển số xe đã tồn tại') return res.status(400).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const updateBus = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updatedData = await Bus.update(id, req.body);
        if (updatedData.message) return res.json({ success: true, message: updatedData.message });
        res.json({ success: true, message: 'Cập nhật xe bus thành công!', data: updatedData });
    } catch (err) {
        if (err.message === 'Không tìm thấy xe bus') return res.status(404).json({ success: false, message: err.message });
        if (err.message === 'Biển số xe đã tồn tại') return res.status(400).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const deleteBus = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deletedBus = await Bus.remove(id);
        res.json({ success: true, message: 'Đã vô hiệu hóa xe bus thành công!', data: deletedBus });
    } catch (err) {
        if (err.message.includes('Không tìm thấy')) return res.status(404).json({ success: false, message: err.message });
        if (err.message.includes('đang được sử dụng')) return res.status(400).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};