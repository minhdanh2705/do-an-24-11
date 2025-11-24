import express from 'express';
import * as driverController from '../controllers/driver-controller.js';

const router = express.Router();

// GET /api/drivers
router.get('/', driverController.getAllDrivers);

// GET /api/drivers/:id
router.get('/:id', driverController.getDriverById);

// POST /api/drivers
router.post('/', driverController.createDriver);

// PUT /api/drivers/:id
router.put('/:id', driverController.updateDriver);

// DELETE /api/drivers/:id
router.delete('/:id', driverController.deleteDriver);

export default router;