import Schedule from '../models/schedule-model.js';
import { sql, poolPromise } from '../config/database.js';

// Helper: Gửi thông báo Socket
const notifyParent = (io, parentId, title, message, type = 'INFO') => {
    if (io && parentId) {
        io.emit(`notification:parent:${parentId}`, { title, message, type });
    }
};

// --- CÁC HÀM CRUD CƠ BẢN ---
export const createSchedule = async (req, res) => {
    try {
        const result = await Schedule.create(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getAllSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.getAll();
        res.json({ success: true, data: schedules });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getScheduleById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const schedule = await Schedule.getById(id);
        if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
        res.json({ success: true, data: schedule });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateSchedule = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const result = await Schedule.update(id, req.body);
        res.json({ success: true, data: result });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteSchedule = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const result = await Schedule.delete(id);
        res.json({ success: true, data: result });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// --- 1. QUAN TRỌNG: API CẬP NHẬT TRẠNG THÁI & BẮN THÔNG BÁO ---
export const updateScheduleStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body; // 1: Bắt đầu, 2: Kết thúc
        const io = req.app.get('io'); // Lấy Socket
        const pool = await poolPromise;

        // Bước 1: Gọi hàm trong Model để cập nhật DB (Và chốt sổ học sinh)
        await Schedule.updateStatus(id, status);

        // Bước 2: Lấy lại dữ liệu mới nhất để gửi thông báo
        const scheduleData = await Schedule.getById(id);
        
        // Lấy danh sách học sinh trong chuyến (đã được cập nhật trạng thái mới từ Bước 1)
        const students = scheduleData?.danhSachDiemDanh || [];

        // --- LOGIC GỬI THÔNG BÁO ---
        if (Number(status) === 2) { // KẾT THÚC CHUYẾN
            students.forEach(async (st) => {
                // Chỉ báo tin cho những bé Đã trả (2) hoặc Vắng (3)
                let msg = "";
                let type = "INFO";
                let title = "Chuyến xe kết thúc";

                if (st.trangThai === 2) {
                    msg = `Xe đã về bến. Bé ${st.hoTen} đã xuống xe an toàn.`;
                    type = "SUCCESS";
                } else if (st.trangThai === 3) {
                    msg = `Xe đã về bến. Bé ${st.hoTen} được ghi nhận là VẮNG mặt trong chuyến này.`;
                    type = "WARNING";
                }

                if (msg) {
                    // Lưu vào DB
                    await pool.request()
                        .input('pid', sql.Int, st.idPhuHuynh)
                        .input('title', sql.NVarChar, title)
                        .input('msg', sql.NVarChar, msg)
                        .input('type', sql.VarChar, type)
                        .query(`INSERT INTO THONGBAO (idPhuHuynh, tieuDe, noiDung, loai, daXem, thoiGian) VALUES (@pid, @title, @msg, @type, 0, GETDATE())`);
                    
                    // Bắn Socket
                    notifyParent(io, st.idPhuHuynh, title, msg, type);
                }
            });
        } 
        else if (Number(status) === 1) { // BẮT ĐẦU CHUYẾN
            // Lấy danh sách phụ huynh duy nhất để không báo trùng
            const uniqueParents = [...new Set(students.map(s => s.idPhuHuynh))];
            
            uniqueParents.forEach(async (parentId) => {
                const title = "Xe khởi hành";
                const msg = `Xe tuyến ${scheduleData.tenTuyen} đã bắt đầu lăn bánh.`;
                
                await pool.request()
                    .input('pid', sql.Int, parentId)
                    .input('title', sql.NVarChar, title)
                    .input('msg', sql.NVarChar, msg)
                    .query(`INSERT INTO THONGBAO (idPhuHuynh, tieuDe, noiDung, loai, daXem, thoiGian) VALUES (@pid, @title, @msg, 'INFO', 0, GETDATE())`);

                notifyParent(io, parentId, title, msg, 'INFO');
            });
        }

        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- 2. API CẬP NHẬT VỊ TRÍ TRẠM ---
export const updateCurrentStop = async (req, res) => {
    try {
        const id = Number(req.params.id); 
        const { stopIndex, stopName } = req.body;
        const io = req.app.get('io');
        const pool = await poolPromise;

        // Cập nhật vị trí xe
        await pool.request()
            .input('id', sql.Int, id)
            .input('thuTu', sql.Int, stopIndex)
            .query('UPDATE LICHTRINH SET thuTuTramHienTai = @thuTu WHERE idLichTrinh = @id');

        // Báo tin cập nhật lộ trình (Optional: Báo cho những bé chưa xuống xe)
        const scheduleData = await Schedule.getById(id);
        
        // Lọc danh sách phụ huynh cần báo (con chưa xuống xe)
        const relevantParents = scheduleData?.danhSachDiemDanh
            ?.filter(st => st.trangThai !== 2 && st.trangThai !== 3) // Chưa trả và chưa vắng
            .map(st => st.idPhuHuynh);
            
        const uniqueParents = [...new Set(relevantParents)];

        uniqueParents.forEach(pid => {
             notifyParent(io, pid, 'Cập nhật lộ trình', `Xe đã đến trạm: ${stopName}`, 'INFO');
        });

        res.json({ success: true, message: 'Đã cập nhật trạm' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- 3. API ĐIỂM DANH HỌC SINH (Bấm nút trên xe) ---
export const updateStudentAttendance = async (req, res) => {
    try {
        const { scheduleId, studentId } = req.params;
        const { status } = req.body; 
        const io = req.app.get('io');
        const pool = await poolPromise;

        // Gọi Model để update DB
        await Schedule.updateAttendance(Number(scheduleId), Number(studentId), status);

        // Lấy thông tin để báo tin
        const result = await pool.request()
            .input('sid', sql.Int, studentId)
            .query("SELECT idPhuHuynh, hoTen FROM HOCSINH WHERE idHocSinh = @sid");
        
        const student = result.recordset[0];
        if (student && io) {
            let msg = '';
            let type = 'INFO';
            let title = 'Thông báo điểm danh';
            
            if (Number(status) === 1) {
                msg = `Bé ${student.hoTen} đã LÊN XE an toàn.`;
                type = 'SUCCESS';
            } else if (Number(status) === 2) {
                msg = `Bé ${student.hoTen} đã XUỐNG XE an toàn.`;
                type = 'SUCCESS';
            } else if (Number(status) === 3) {
                msg = `Cảnh báo: Bé ${student.hoTen} VẮNG MẶT tại điểm đón.`;
                type = 'WARNING'; 
            }

            if (msg) {
                // Lưu DB
                await pool.request()
                    .input('pid', sql.Int, student.idPhuHuynh)
                    .input('title', sql.NVarChar, title)
                    .input('msg', sql.NVarChar, msg)
                    .input('type', sql.VarChar, type)
                    .query(`INSERT INTO THONGBAO (idPhuHuynh, tieuDe, noiDung, loai, daXem, thoiGian) VALUES (@pid, @title, @msg, @type, 0, GETDATE())`);
                
                // Bắn Socket
                notifyParent(io, student.idPhuHuynh, title, msg, type);
            }
        }

        res.json({ success: true, message: 'Điểm danh thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};