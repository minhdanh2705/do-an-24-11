import Student from '../models/student-model.js'; // Chỉ import 1 lần duy nhất ở đây

// 1. Lấy danh sách học sinh (Đã lọc trangThai = 1 trong Model)
export const getAllStudents = async (req, res) => {
    try {
        const data = await Student.getAll();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Lấy chi tiết 1 học sinh
export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.getById(id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });
        }
        res.json({ success: true, data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Tạo học sinh mới
export const createStudent = async (req, res) => {
    try {
        const newStudent = await Student.create(req.body);
        res.status(201).json({ success: true, message: 'Thêm học sinh thành công', data: newStudent });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi Database: " + err.message });
    }
};

// 4. Cập nhật học sinh
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Student.update(id, req.body);
        res.json({ success: true, message: result.message });
    } catch (err) {
        if (err.message === 'Không tìm thấy học sinh') {
            return res.status(404).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: "Lỗi Database: " + err.message });
    }
};

// 5. Xóa học sinh (Gọi Model để kiểm tra ràng buộc trước khi xóa mềm)
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Student.remove(id);
        res.json({ success: true, message: result.message });
    } catch (err) {
        console.error("Lỗi xóa học sinh:", err.message);

        // Bắt lỗi CẢNH BÁO (Ràng buộc dữ liệu) -> Trả về 400
        if (err.message.includes('CẢNH BÁO') || err.message.includes('REFERENCE')) {
             return res.status(400).json({ success: false, message: err.message });
        }
        
        // Lỗi không tìm thấy -> Trả về 404
        if (err.message.includes('Không tìm thấy')) {
             return res.status(404).json({ success: false, message: err.message });
        }

        // Các lỗi khác -> Trả về 500
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// 6. Lấy phụ huynh của học sinh (Nếu cần dùng)
export const getParentsForStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const parents = await Student.getLinkedParents(id);
        res.json({ success: true, data: parents });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};