// controllers/student-controller.js
import Student from '../models/student-model.js'; // Import Class Student

export const getAllStudents = async (req, res) => {
    try {
        // GỌI HÀM TỪ MODEL (Đã sửa đúng SQL ở bước trước)
        const students = await Student.getAll();
        res.json({ success: true, data: students });
    } catch (error) {
        console.error("Lỗi lấy danh sách học sinh:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.getById(id);
        res.json({ success: true, data: student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createStudent = async (req, res) => {
    try {
        const newStudent = await Student.create(req.body);
        res.json({ success: true, message: 'Thêm học sinh thành công', data: newStudent });
    } catch (error) {
        console.error("Lỗi thêm học sinh:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Student.update(id, req.body);
        res.json({ success: true, message: result.message });
    } catch (error) {
        console.error("Lỗi cập nhật học sinh:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Student.remove(id);
        res.json({ success: true, message: result.message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getParentsForStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const parents = await Student.getLinkedParents(id);
        res.json({ success: true, data: parents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};