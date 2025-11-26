import Schedule from '../models/schedule-model.js';
import { sql, poolPromise } from '../config/database.js';

// Helper: Gửi thông báo Socket
const notifyParent = (io, parentId, title, message, type = 'INFO') => {
    if (io && parentId) {
        io.emit(`notification:parent:${parentId}`, { title, message, type });
    }
};

// --- CÁC HÀM CRUD CƠ BẢN GIỮ NGUYÊN ---
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

// --- 1. API CẬP NHẬT TRẠNG THÁI CHUYẾN ĐI (START / FINISH) ---
export const updateScheduleStatus = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body; // 1: Bắt đầu, 2: Kết thúc
        const io = req.app.get('io');
        const pool = await poolPromise;

        // Cập nhật trạng thái chuyến
        await Schedule.updateStatus(id, status);

        const scheduleData = await Schedule.getById(id);
        const students = scheduleData?.danhSachDiemDanh || [];

        // LOGIC KHI KẾT THÚC CHUYẾN (Status = 2)
        if (Number(status) === 2) {
            // 1. Chỉ cập nhật những bé ĐÃ LÊN XE (1) thành ĐÃ TRẢ (2)
            await pool.request()
                .input('idLichTrinh', sql.Int, id)
                .query("UPDATE DIEMDANH SET trangThai = 2 WHERE idLichTrinh = @idLichTrinh AND trangThai = 1");

            // 2. Cập nhật những bé VẪN CÒN CHỜ (0) thành VẮNG (3) (Logic chốt sổ)
            await pool.request()
                .input('idLichTrinh', sql.Int, id)
                .query("UPDATE DIEMDANH SET trangThai = 3 WHERE idLichTrinh = @idLichTrinh AND trangThai = 0");

            // Gửi thông báo
            students.forEach(st => {
                // Chỉ báo tin cho những bé đã lên xe (giờ chuyển sang đã trả)
                if(st.trangThai === 1 || st.trangThai === 2) { 
                    notifyParent(io, st.idPhuHuynh, 'Chuyến xe kết thúc', `Xe đã về bến. Bé ${st.hoTen} đã xuống xe an toàn.`, 'SUCCESS');
                }
            });
        } 
        // LOGIC KHI BẮT ĐẦU (Status = 1)
        else if (Number(status) === 1) {
            students.forEach(st => {
                notifyParent(io, st.idPhuHuynh, 'Xe khởi hành', `Xe tuyến ${scheduleData.tenTuyen} đã bắt đầu chạy.`, 'INFO');
            });
        }

        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- 2. API CẬP NHẬT VỊ TRÍ TRẠM & XỬ LÝ VẮNG TỰ ĐỘNG ---
export const updateCurrentStop = async (req, res) => {
    try {
        const id = Number(req.params.id); // idLichTrinh
        const { stopIndex, stopName } = req.body; // stopIndex là trạm MỚI xe vừa tới
        const io = req.app.get('io');
        const pool = await poolPromise;

        // 1. LOGIC QUAN TRỌNG: Tự động đánh vắng (Status 3) các bé ở trạm TRƯỚC ĐÓ bị bỏ sót
        const missedQuery = await pool.request()
            .input('lid', sql.Int, id)
            .input('currentOrder', sql.Int, stopIndex)
            .query(`
                UPDATE d
                SET d.trangThai = 3 -- Đánh dấu là 3 (Vắng)
                OUTPUT inserted.idHocSinh -- Lấy ID để báo tin
                FROM DIEMDANH d
                JOIN HOCSINH h ON d.idHocSinh = h.idHocSinh
                JOIN TUYENDUONG_DIEMDUNG tdd ON h.idTuyen = tdd.idTuyenDuong AND h.idDiemDon = tdd.idDiemDung
                WHERE d.idLichTrinh = @lid 
                AND d.trangThai = 0 -- Vẫn đang chờ
                AND tdd.thuTu < @currentOrder -- Trạm đón của bé nằm trước trạm hiện tại
            `);
        
        // 2. Gửi thông báo "Vắng" ngay lập tức cho các bé vừa bị đánh dấu
        if (missedQuery.recordset.length > 0) {
            const missedIds = missedQuery.recordset.map(r => r.idHocSinh);
            if(missedIds.length > 0) {
                 const parentsResult = await pool.request()
                    .query(`SELECT idPhuHuynh, hoTen FROM HOCSINH WHERE idHocSinh IN (${missedIds.join(',')})`);
                 
                 parentsResult.recordset.forEach(p => {
                     notifyParent(io, p.idPhuHuynh, 'Thông báo vắng', `Xe đã đi qua điểm đón nhưng bé ${p.hoTen} chưa lên xe.`, 'WARNING');
                 });
            }
        }
        
        // 3. Cập nhật vị trí xe
        await pool.request()
            .input('id', sql.Int, id)
            .input('thuTu', sql.Int, stopIndex)
            .query('UPDATE LICHTRINH SET thuTuTramHienTai = @thuTu WHERE idLichTrinh = @id');

        // 4. Báo tin cập nhật lộ trình
        const scheduleData = await Schedule.getById(id);
        scheduleData?.danhSachDiemDanh?.forEach(st => {
            if (st.trangThai !== 2 && st.trangThai !== 3) {
                 notifyParent(io, st.idPhuHuynh, 'Cập nhật lộ trình', `Xe đã đến trạm: ${stopName}`, 'INFO');
            }
        });

        res.json({ success: true, message: 'Đã cập nhật trạm và xử lý vắng' });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- 3. API ĐIỂM DANH HỌC SINH ---
export const updateStudentAttendance = async (req, res) => {
    try {
        const { scheduleId, studentId } = req.params;
        const { status } = req.body; 
        const io = req.app.get('io');

        await Schedule.updateAttendance(Number(scheduleId), Number(studentId), status);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('sid', sql.Int, studentId)
            .query("SELECT idPhuHuynh, hoTen FROM HOCSINH WHERE idHocSinh = @sid");
        
        const student = result.recordset[0];
        if (student && io) {
            let msg = '';
            let type = 'INFO';
            
            if (Number(status) === 1) {
                msg = `Bé ${student.hoTen} đã lên xe.`;
                type = 'SUCCESS';
            } else if (Number(status) === 2) {
                msg = `Bé ${student.hoTen} đã xuống xe an toàn.`;
                type = 'SUCCESS';
            } else if (Number(status) === 3) {
                msg = `Xe đã đi qua nhưng bé ${student.hoTen} chưa lên xe (Vắng).`;
                type = 'WARNING'; 
            }

            if (msg) notifyParent(io, student.idPhuHuynh, 'Thông báo điểm danh', msg, type);
        }

        res.json({ success: true, message: 'Điểm danh thành công' });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};