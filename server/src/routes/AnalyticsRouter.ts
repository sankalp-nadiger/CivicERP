import { Router } from 'express';
import { AnalyticsController } from '../controllers/index.js';
import { verifyToken } from '../utils/verifyUser.js';

const analyticsRouter = Router();

// GET /analytics/predict
analyticsRouter.get('/predict', verifyToken, AnalyticsController.predict);

export default analyticsRouter;
