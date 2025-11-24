import express from 'express';
import * as trackingController from '../controllers/tracking-controller.js';

const router = express.Router();

router.post('/location', trackingController.updateBusLocation);
router.get('/location/:idXeBus', trackingController.getBusLocation);

export default router;