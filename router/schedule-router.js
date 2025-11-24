import express from 'express';
import * as scheduleController from '../controllers/schedule-controller.js';

const router = express.Router();

// POST /api/schedules (Tạo lịch trình)
router.post('/', scheduleController.createSchedule);

// GET /api/schedules (Lấy tất cả)
router.get('/', scheduleController.getAllSchedules);

// GET /api/schedules/:id (Lấy chi tiết 1 lịch trình)
router.get('/:id', scheduleController.getScheduleById);

// PUT /api/schedules/:id/status (Cập nhật trạng thái chung của lịch trình)
router.put('/:id/status', scheduleController.updateScheduleStatus);


// === Quản lý Điểm danh (con của Lịch trình) ===

// PUT /api/schedules/:scheduleId/students/:studentId/attendance 
// (Tài xế cập nhật điểm danh 1 học sinh)
router.put('/:scheduleId/students/:studentId/attendance', scheduleController.updateStudentAttendance);

export default router;