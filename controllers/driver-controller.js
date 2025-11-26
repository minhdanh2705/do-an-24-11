import Driver from '../models/driver-model.js';

export const getAllDrivers = async (req, res) => {
    try {
        const data = await Driver.getAll();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const getDriverById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const driver = await Driver.getById(id);
        if (!driver) return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
        res.json({ success: true, data: driver });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const createDriver = async (req, res) => {
    const { hoTen, taiKhoan, matKhau } = req.body;
    if (!hoTen || !taiKhoan || !matKhau) return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });

    try {
        const newDriver = await Driver.create(req.body);
        res.status(201).json({ success: true, message: 'Tạo tài xế thành công', data: newDriver });
    } catch (err) {
        if (err.message.includes('đã tồn tại')) return res.status(400).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const updateDriver = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updatedDriver = await Driver.update(id, req.body);
        res.json({ success: true, message: 'Cập nhật thành công', data: updatedDriver });
    } catch (err) {
        if (err.message === 'Không tìm thấy tài xế') return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

export const deleteDriver = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await Driver.remove(id);
        res.json({ success: true, message: result.message });
    } catch (err) {
        if (err.message.includes('Không thể vô hiệu hóa')) return res.status(400).json({ success: false, message: err.message });
        if (err.message.includes('Không tìm thấy')) return res.status(404).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};