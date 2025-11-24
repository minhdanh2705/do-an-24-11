import express from 'express';
import * as busController from '../controllers/bus-controller.js';

const router = express.Router();

// GET /api/buses
router.get('/', busController.getAllBuses);

// GET /api/buses/:id
router.get('/:id', busController.getBusById);

// POST /api/buses
router.post('/', busController.createBus);

// PUT /api/buses/:id
router.put('/:id', busController.updateBus);

// DELETE /api/buses/:id
router.delete('/:id', busController.deleteBus);

export default router;