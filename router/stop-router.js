import express from 'express';
import * as stopController from '../controllers/stop-controller.js';

const router = express.Router();

// GET /api/stops
router.get('/', stopController.getAllStops);

// GET /api/stops/:id
router.get('/:id', stopController.getStopById);

// POST /api/stops
router.post('/', stopController.createStop);

// PUT /api/stops/:id
router.put('/:id', stopController.updateStop);

// DELETE /api/stops/:id
router.delete('/:id', stopController.deleteStop);

export default router;