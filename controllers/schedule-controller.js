import Schedule from '../models/schedule-model.js';
import { sql, poolPromise } from '../config/database.js';

// Helper: Gửi thông báo Socket
const notifyParent = (io, parentId, title, message, type = 'INFO') => {
    if (io && parentId) {
        io.emit(`notification:parent:${parentId}`, { title, message, type });
    }
};

// --- API CŨ GIỮ NGUYÊN (Create, Get...) ---
export const createSchedule = async (req, res) => { /* Code cũ của bạn */ };
export const getAllSchedules = async (req, res) => { /* Code cũ của bạn */ };
export const getScheduleById = async (req, res) => { /* Code cũ của bạn */ };
export const updateSchedule = async (req, res) => { /* Code cũ của bạn */ };
export const deleteSchedule = async (req, res) => { /* Code cũ của bạn */ };

// --- 1. API CẬP NHẬT TRẠNG THÁI CHUYẾN ĐI (START / FINISH) ---
export const updateScheduleStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body; // 1: Bắt đầu, 2: Kết thúc
        const io = req.app.get('io');

        // Cập nhật trạng thái chuyến
        await Schedule.updateStatus(id, status);

        // Lấy danh sách phụ huynh trong chuyến này để báo tin
        const scheduleData = await Schedule.getById(id);
        const students = scheduleData?.danhSachDiemDanh || [];

        // LOGIC KHI KẾT THÚC CHUYẾN (Status = 2)
        if (Number(status) === 2) {
            const pool = await poolPromise;
            // Tự động đánh dấu "Đã trả" (2) cho tất cả học sinh đã "Lên xe" (1)
            await pool.request()
                .input('idLichTrinh', sql.Int, id)
                .query("UPDATE DIEMDANH SET trangThai = 2 WHERE idLichTrinh = @idLichTrinh AND trangThai = 1");
            
            // Gửi thông báo cho tất cả phụ huynh
            students.forEach(st => {
                notifyParent(io, st.idPhuHuynh, 'Chuyến xe kết thúc', `Xe đã về trường/bến. Bé ${st.hoTen} đã xuống xe.`, 'SUCCESS');
            });
        } 
        // LOGIC KHI BẮT ĐẦU (Status = 1)
        else if (Number(status) === 1) {
            students.forEach(st => {
                notifyParent(io, st.idPhuHuynh, 'Xe khởi hành', `Xe bus tuyến ${scheduleData.tenTuyen} đã bắt đầu chạy.`, 'INFO');
            });
        }

        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- 2. API CẬP NHẬT VỊ TRÍ TRẠM HIỆN TẠI (MỚI) ---
export const updateCurrentStop = async (req, res) => {
    try {
        const id = parseInt(req.params.id); // idLichTrinh
        // PHẢI NHẬN idDiemDung từ Frontend (DriverDashboard.jsx)
        const { stopIndex, stopName, idDiemDung } = req.body; 
        const io = req.app.get('io');

        const pool = await poolPromise;
        
        // --- Cập nhật DB: Cả số thứ tự và ID điểm dừng hiện tại ---
        await pool.request()
            .input('id', sql.Int, id)
            .input('thuTu', sql.Int, stopIndex)
            .input('idDiem', sql.Int, idDiemDung) // <--- LƯU ID ĐIỂM DỪNG MỚI
            .query("UPDATE LICHTRINH SET thuTuTramHienTai = @thuTu, idDiemDungHienTai = @idDiem WHERE idLichTrinh = @id");
        // --------------------------------------------------------

        // Báo tin cho phụ huynh
        const scheduleData = await Schedule.getById(id);
        scheduleData?.danhSachDiemDanh?.forEach(st => {
             if (st.trangThai !== 2) { 
                 // Socket sẽ kích hoạt loadData() ở ParentDashboard
                 notifyParent(io, st.idPhuHuynh, 'Cập nhật lộ trình', `Xe đã đến trạm: ${stopName}`, 'INFO');
             }
        });

        res.json({ success: true, message: 'Đã cập nhật trạm hiện tại' });
    } catch (err) {
        console.error("Lỗi cập nhật trạm:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- 3. API ĐIỂM DANH HỌC SINH ---
export const updateStudentAttendance = async (req, res) => {
    try {
        const { scheduleId, studentId } = req.params;
        const { status } = req.body;
        const io = req.app.get('io');

        await Schedule.updateAttendance(parseInt(scheduleId), parseInt(studentId), status);

        // Gửi Socket cho ĐÚNG phụ huynh đó
        // Cần query ID phụ huynh của học sinh này
        const pool = await poolPromise;
        const result = await pool.request()
            .input('sid', sql.Int, studentId)
            .query("SELECT idPhuHuynh, hoTen FROM HOCSINH WHERE idHocSinh = @sid");
        
        const student = result.recordset[0];
        if (student && io) {
            const msg = Number(status) === 1 ? `Bé ${student.hoTen} đã lên xe.` : `Bé ${student.hoTen} đã xuống xe.`;
            const type = Number(status) === 1 ? 'SUCCESS' : 'INFO';
            notifyParent(io, student.idPhuHuynh, 'Thông báo điểm danh', msg, type);
        }

        res.json({ success: true, message: 'Điểm danh thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};