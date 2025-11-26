import express from 'express';
// Import Controllers
import * as authController from '../controllers/auth-controller.js';
import * as busController from '../controllers/bus-controller.js';
import * as driverController from '../controllers/driver-controller.js';
import * as parentController from '../controllers/parent-controller.js';
import * as routeController from '../controllers/route-controller.js';
import * as scheduleController from '../controllers/schedule-controller.js';
import * as studentController from '../controllers/student-controller.js';
import * as stopController from '../controllers/stop-controller.js';
import { markAttendance } from '../controllers/attendance-controller.js';
import { getStopsByRoute } from '../controllers/route-controller.js';

const router = express.Router();

// --- 1. AUTH ---
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/check', authController.checkSession);


// --- 2. BUSES ---
router.get('/buses', busController.getAllBuses);
router.get('/buses/:id', busController.getBusById);
router.post('/buses', busController.createBus);
router.put('/buses/:id', busController.updateBus);
router.delete('/buses/:id', busController.deleteBus);

// --- 3. DRIVERS ---
router.get('/drivers', driverController.getAllDrivers);
router.get('/drivers/:id', driverController.getDriverById);
router.post('/drivers', driverController.createDriver);
router.put('/drivers/:id', driverController.updateDriver);
router.delete('/drivers/:id', driverController.deleteDriver);

// --- 4. PARENTS ---
router.get('/parents', parentController.getAllParents);
router.get('/parents/:id', parentController.getParentById);
router.post('/parents', parentController.createParent);
router.put('/parents/:id', parentController.updateParent);
router.delete('/parents/:id', parentController.deleteParent);
router.get('/parents/:id/students', parentController.getStudentsForParent);
router.post('/parents/:id/students', parentController.linkStudentToParent);
router.delete('/parents/:parentId/students/:studentId', parentController.unlinkStudentFromParent);

// --- 5. ROUTES (TUYẾN ĐƯỜNG) ---
router.get('/routes', routeController.getAllRoutes);
router.get('/routes/:id', routeController.getRouteById);
router.post('/routes', routeController.createRoute);
router.put('/routes/:id', routeController.updateRoute);
router.delete('/routes/:id', routeController.deleteRoute);

// --- 6. SCHEDULES ---
router.get('/schedules', scheduleController.getAllSchedules);
router.get('/schedules/:id', scheduleController.getScheduleById);
router.post('/schedules', scheduleController.createSchedule);
router.put('/schedules/:id/status', scheduleController.updateScheduleStatus);
router.put('/schedules/:scheduleId/students/:studentId/attendance', scheduleController.updateStudentAttendance);

// --- 7. STUDENTS ---
router.get('/students', studentController.getAllStudents);
router.get('/students/:id', studentController.getStudentById);
router.post('/students', studentController.createStudent);
router.put('/students/:id', studentController.updateStudent);
router.delete('/students/:id', studentController.deleteStudent);
router.get('/students/:id/parents', studentController.getParentsForStudent);

// --- 8. STOPS (ĐIỂM DỪNG) ---
router.get('/stops', stopController.getAllStops);
router.get('/stops/:id', stopController.getStopById);
router.post('/stops', stopController.createStop);
router.put('/stops/:id', stopController.updateStop);
router.delete('/stops/:id', stopController.deleteStop);

router.put('/attendance', markAttendance);

router.get('/routes/:id/stops', getStopsByRoute);

export default router;