import express from 'express';
import * as authController from '../controllers/auth-controller.js';

const router = express.Router();

// POST /api/login
router.post('/login', authController.login);

// POST /api/logout (Nên dùng POST hoặc DELETE)
router.post('/logout', authController.logout);

export default router;