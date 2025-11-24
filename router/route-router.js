import express from 'express';
import * as routeController from '../controllers/route-controller.js';

const router = express.Router();

router.get('/', routeController.getAllRoutes);

// GET /api/routes/:id
router.get('/:id', routeController.getRouteById);

// POST /api/routes
router.post('/', routeController.createRoute);

// PUT /api/routes/:id
router.put('/:id', routeController.updateRoute);

// DELETE /api/routes/:id
router.delete('/:id', routeController.deleteRoute);

export default router;